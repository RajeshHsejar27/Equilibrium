import Dexie, { liveQuery, type Table } from 'dexie';
import { endOfMonth, format, isWithinInterval, startOfMonth } from 'date-fns';
import { toast } from 'sonner';

export interface Expense {
  id?: number;
  title: string;
  amount: number;
  date: Date;
  categoryId: string;
  isRecurring?: boolean;
  recurringId?: string;
  note?: string;
}

export interface Category {
  id: string; // UUID or string id
  name: string;
  color: string;
  icon?: string;
  budget?: number;
  type: 'inflow' | 'outflow';
}

export interface SavingsGoal {
  id?: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
}

export interface Budget {
  id?: number;
  categoryId: string;
  monthlyLimit: number;
  period: string; // e.g., '2024-05'
}

export interface RecurringExpense {
  id?: number;
  title: string;
  amount: number;
  categoryId: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface Profile {
  id: number;
  name: string;
  avatar?: string;
}

export interface Settings {
  id: number;
  theme: 'light' | 'dark' | 'system';
  accentColor?: string;
  overspendingAlert: boolean;
  alertThreshold: number; // percentage
  overspendingAlertState?: Record<
    string,
    {
      alerted: boolean;
      lastAlertAt?: string;
      lastAlertedSpent?: number;
      lastAlertedExpenseCount?: number;
    }
  >;
  emailReports: boolean;
  emailAddress?: string;
  billReminders: boolean;
  totalSavings: number;
}

export class EquilibriumDB extends Dexie {
  expenses!: Table<Expense>;
  categories!: Table<Category>;
  savingsGoals!: Table<SavingsGoal>;
  budgets!: Table<Budget>;
  recurringExpenses!: Table<RecurringExpense>;
  profile!: Table<Profile>;
  settings!: Table<Settings>;

  constructor() {
    super('EquilibriumDB');
    this.version(2).stores({
      expenses: '++id, date, categoryId, title',
      categories: 'id, name, type',
      savingsGoals: '++id, title',
      budgets: '++id, categoryId, period',
      recurringExpenses: '++id, title, categoryId',
      profile: 'id',
      settings: 'id'
    });
    this.version(3)
      .stores({
        expenses: '++id, date, categoryId, title',
        categories: 'id, name, type',
        savingsGoals: '++id, title',
        budgets: '++id, categoryId, period',
        recurringExpenses: '++id, title, categoryId',
        profile: 'id',
        settings: 'id'
      })
      .upgrade(tx =>
        tx.table('settings')
          .toCollection()
          .modify(setting => {
            if (setting.alertThreshold == null) {
              setting.alertThreshold = 80;
            }

            if (setting.overspendingAlert == null) {
              setting.overspendingAlert = true;
            }

            if (!setting.overspendingAlertState) {
              setting.overspendingAlertState = {};
            }
          })
      );
  }
}

export const db = new EquilibriumDB();

// Ensure default profile and settings records exist in the database
export const ensureDefaults = async () => {
  try {
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.add({
        id: 1,
        theme: 'dark',
        overspendingAlert: true,
        alertThreshold: 80,
        emailReports: false,
        billReminders: false,
        totalSavings: 0
      });
    }
    const profileCount = await db.profile.count();
    if (profileCount === 0) {
      await db.profile.add({
        id: 1,
        name: 'User'
      });
    }
  } catch (error) {
    console.error('Failed to initialize default database records:', error);
  }
};

ensureDefaults();

const DEFAULT_ALERT_THRESHOLD = 80;
const MIN_ALERT_THRESHOLD = 40;
const MAX_ALERT_THRESHOLD = 100;
const ALERT_THRESHOLD_STEP = 5;
const ALERT_FLUSH_DELAY_MS = 750;

type OverspendingAlertState = NonNullable<Settings['overspendingAlertState']>;
type BudgetAlertDetails = {
  categoryId: string;
  categoryName: string;
  spent: number;
  monthlyLimit: number;
  currentPercent: number;
};

const clampAlertThreshold = (value: number) => {
  if (!Number.isFinite(value)) return DEFAULT_ALERT_THRESHOLD;

  const steppedValue = Math.round(value / ALERT_THRESHOLD_STEP) * ALERT_THRESHOLD_STEP;
  return Math.min(MAX_ALERT_THRESHOLD, Math.max(MIN_ALERT_THRESHOLD, steppedValue));
};

let isUpdatingOverspendingAlertState = false;
let pendingAlertFlush: ReturnType<typeof setTimeout> | undefined;
const pendingBudgetAlerts = new Map<string, BudgetAlertDetails>();

const clearPendingBudgetAlerts = () => {
  pendingBudgetAlerts.clear();

  if (pendingAlertFlush) {
    clearTimeout(pendingAlertFlush);
    pendingAlertFlush = undefined;
  }
};

const flushPendingBudgetAlerts = () => {
  pendingAlertFlush = undefined;

  // pendingBudgetAlerts.forEach(alert => {
  //   toast.warning("⚠ Budget Alert", {
  //     description: `${alert.categoryName} spending reached ${Math.round(alert.currentPercent)}%\n(₹${alert.spent.toLocaleString()} / ₹${alert.monthlyLimit.toLocaleString()})`,
  //     classNames: {
  //       description: "!text-black dark:!text-white !opacity-100 whitespace-pre-line",
  //     }
  //   });
  // });

  pendingBudgetAlerts.forEach(alert => {
  toast.warning(
    `⚠ Budget Alert:
${alert.categoryName} spending reached ${Math.round(alert.currentPercent)}%
(₹${alert.spent.toLocaleString()} / ₹${alert.monthlyLimit.toLocaleString()})`,
    {
      classNames: {
        title:
          "whitespace-pre-line leading-relaxed"
      }
    }
  );
});

  pendingBudgetAlerts.clear();
};

const enqueueBudgetAlert = (alert: BudgetAlertDetails) => {
  pendingBudgetAlerts.set(alert.categoryId, alert);

  if (pendingAlertFlush) {
    clearTimeout(pendingAlertFlush);
  }

  pendingAlertFlush = setTimeout(flushPendingBudgetAlerts, ALERT_FLUSH_DELAY_MS);
};

const hasStateFromPreviousMonth = (state: OverspendingAlertState, currentPeriod: string) =>
  Object.values(state).some(categoryState => {
    if (!categoryState.lastAlertAt) return true;

    const lastAlertDate = new Date(categoryState.lastAlertAt);
    if (Number.isNaN(lastAlertDate.getTime())) return true;

    return format(lastAlertDate, 'yyyy-MM') !== currentPeriod;
  });

const getCurrentMonthCategorySpend = (
  expenses: Expense[],
  categoryId: string,
  monthStart: Date,
  monthEnd: Date,
) => {
  const categoryExpenses = expenses.filter(expense => (
    expense.categoryId === categoryId &&
    isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
  ));

  return {
    expenseCount: categoryExpenses.length,
    spent: categoryExpenses.reduce((total, expense) => total + expense.amount, 0),
  };
};

liveQuery(async () => {
  const [settings, expenses, budgets, categories] = await Promise.all([
    db.settings.get(1),
    db.expenses.toArray(),
    db.budgets.toArray(),
    db.categories.toArray(),
  ]);

  return {
    settings,
    expenses,
    budgets,
    categories,
  };
}).subscribe({
  next: async ({ settings, expenses, budgets, categories }) => {
    if (!settings?.overspendingAlert) {
      clearPendingBudgetAlerts();
      return;
    }

    if (isUpdatingOverspendingAlertState) return;

    const now = new Date();
    const nowIso = now.toISOString();
    const currentPeriod = format(now, 'yyyy-MM');
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const alertThreshold = clampAlertThreshold(settings.alertThreshold ?? DEFAULT_ALERT_THRESHOLD);
    const existingState = settings.overspendingAlertState ?? {};
    const hasStaleMonthState = hasStateFromPreviousMonth(existingState, currentPeriod);
    const nextState: OverspendingAlertState = {};
    const currentMonthBudgets = budgets.filter(budget => {
      const category = categories.find(cat => cat.id === budget.categoryId);
      return (
        budget.period === currentPeriod &&
        budget.monthlyLimit > 0 &&
        Boolean(category) &&
        category?.type !== 'inflow'
      );
    });
    const activeBudgetCategoryIds = new Set(currentMonthBudgets.map(budget => budget.categoryId));

    pendingBudgetAlerts.forEach((_, categoryId) => {
      if (!activeBudgetCategoryIds.has(categoryId)) {
        pendingBudgetAlerts.delete(categoryId);
      }
    });

    currentMonthBudgets
      .forEach(budget => {
        const category = categories.find(cat => cat.id === budget.categoryId);
        if (!category) return;

        const { expenseCount, spent } = getCurrentMonthCategorySpend(
          expenses,
          budget.categoryId,
          monthStart,
          monthEnd,
        );
        const currentPercent = (spent / budget.monthlyLimit) * 100;
        const previousState = hasStaleMonthState ? undefined : existingState[budget.categoryId];
        const wasAlerted = previousState?.alerted === true;
        const lastAlertedSpent = previousState?.lastAlertedSpent ?? 0;
        const spendingIncreasedSinceLastAlert = spent > lastAlertedSpent;
        const shouldTriggerAlert = !wasAlerted || spendingIncreasedSinceLastAlert;

        if (currentPercent >= alertThreshold) {
          if (shouldTriggerAlert) {
            enqueueBudgetAlert({
              categoryId: budget.categoryId,
              categoryName: category.name,
              spent,
              monthlyLimit: budget.monthlyLimit,
              currentPercent,
            });
          }

          nextState[budget.categoryId] = {
            alerted: true,
            lastAlertAt: !shouldTriggerAlert && previousState?.lastAlertAt
              ? previousState.lastAlertAt
              : nowIso,
            lastAlertedSpent: shouldTriggerAlert
              ? spent
              : previousState?.lastAlertedSpent ?? spent,
            lastAlertedExpenseCount: shouldTriggerAlert
              ? expenseCount
              : previousState?.lastAlertedExpenseCount ?? expenseCount,
          };
          return;
        }

        pendingBudgetAlerts.delete(budget.categoryId);

        if (previousState) {
          nextState[budget.categoryId] = {
            alerted: false,
            lastAlertAt: previousState.lastAlertAt ?? nowIso,
            lastAlertedSpent: 0,
            lastAlertedExpenseCount: expenseCount,
          };
        }
      });

    if (hasStaleMonthState || JSON.stringify(existingState) !== JSON.stringify(nextState)) {
      isUpdatingOverspendingAlertState = true;

      try {
        await db.settings.put({
          ...settings,
          overspendingAlertState: nextState,
        });
      } finally {
        isUpdatingOverspendingAlertState = false;
      }
    }
  },
});
