import Dexie, { type Table } from 'dexie';

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
  overspendingAlert: boolean;
  alertThreshold: number; // percentage
  emailReports: boolean;
  emailAddress?: string;
  billReminders: boolean;
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
    this.version(1).stores({
      expenses: '++id, date, categoryId, title',
      categories: 'id, name',
      savingsGoals: '++id, title',
      budgets: '++id, categoryId, period',
      recurringExpenses: '++id, title, categoryId',
      profile: 'id',
      settings: 'id'
    });
  }
}

export const db = new EquilibriumDB();
