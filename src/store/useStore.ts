import { create } from 'zustand';
import { db, type Expense, type Category, type SavingsGoal, type Budget, type RecurringExpense, type Profile, type Settings } from '@/lib/db';

interface ExpenseSlice {
  expenses: Expense[];
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: number, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

interface CategorySlice {
  categories: Category[];
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

interface SavingsSlice {
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  updateSavingsGoal: (id: number, goal: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: number) => Promise<void>;
}

interface BudgetSlice {
  budgets: Budget[];
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (id: number, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
}

interface RecurringSlice {
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (expense: RecurringExpense) => Promise<void>;
  updateRecurringExpense: (id: number, expense: Partial<RecurringExpense>) => Promise<void>;
  deleteRecurringExpense: (id: number) => Promise<void>;
}

interface SettingsSlice {
  settings: Settings | null;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
}

interface AnalyticsSlice {
  timeframe: 'month' | '6months';
  setTimeframe: (timeframe: 'month' | '6months') => void;
}

interface ProfileSlice {
  profile: Profile | null;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
}

export const useStore = create<
  ExpenseSlice & 
  CategorySlice & 
  SavingsSlice & 
  BudgetSlice & 
  RecurringSlice & 
  SettingsSlice & 
  AnalyticsSlice & 
  ProfileSlice
>((set) => ({
  // Expenses
  expenses: [],
  addExpense: async (expense) => {
    await db.expenses.add(expense);
  },
  updateExpense: async (id, expense) => {
    await db.expenses.update(id, expense);
  },
  deleteExpense: async (id) => {
    await db.expenses.delete(id);
  },

  // Categories
  categories: [],
  addCategory: async (category) => {
    await db.categories.add(category);
  },
  updateCategory: async (id, category) => {
    await db.categories.update(id, category);
  },
  deleteCategory: async (id) => {
    await db.categories.delete(id);
  },

  // Savings
  savingsGoals: [],
  addSavingsGoal: async (goal) => {
    await db.savingsGoals.add(goal);
  },
  updateSavingsGoal: async (id, goal) => {
    await db.savingsGoals.update(id, goal);
  },
  deleteSavingsGoal: async (id) => {
    await db.savingsGoals.delete(id);
  },

  // Budgets
  budgets: [],
  addBudget: async (budget) => {
    await db.budgets.add(budget);
  },
  updateBudget: async (id, budget) => {
    await db.budgets.update(id, budget);
  },
  deleteBudget: async (id) => {
    await db.budgets.delete(id);
  },

  // Recurring
  recurringExpenses: [],
  addRecurringExpense: async (expense) => {
    await db.recurringExpenses.add(expense);
  },
  updateRecurringExpense: async (id, expense) => {
    await db.recurringExpenses.update(id, expense);
  },
  deleteRecurringExpense: async (id) => {
    await db.recurringExpenses.delete(id);
  },

  // Settings
  settings: null,
  updateSettings: async (settings) => {
    await db.settings.update(1, settings);
  },

  // Analytics
  timeframe: 'month',
  setTimeframe: (timeframe) => set({ timeframe }),

  // Profile
  profile: null,
  updateProfile: async (profile) => {
    await db.profile.update(1, profile);
  },
}));
