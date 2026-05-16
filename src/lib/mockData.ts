import { db } from './db';
import { subMonths, startOfMonth, subDays } from 'date-fns';

export const initializeMockData = async () => {
  const categoriesCount = await db.categories.count();
  if (categoriesCount > 0) return;

  // Categories
  const categories = [
    { id: '1', name: 'Food & Dining', color: '#ef4444', icon: 'Utensils' },
    { id: '2', name: 'Transport', color: '#f59e0b', icon: 'Bus' },
    { id: '3', name: 'Shopping', color: '#3b82f6', icon: 'ShoppingBag' },
    { id: '4', name: 'Housing', color: '#10b981', icon: 'Home' },
    { id: '5', name: 'Entertainment', color: '#8b5cf6', icon: 'Film' },
    { id: '6', name: 'Income', color: '#22c55e', icon: 'DollarSign' },
  ];
  await db.categories.bulkAdd(categories);

  // Expenses
  const expenses = [];
  const now = new Date();
  
  // Last 3 months of data
  for (let i = 0; i < 60; i++) {
    const date = subDays(now, Math.floor(Math.random() * 90));
    const cat = categories[Math.floor(Math.random() * (categories.length - 1))]; // exclude income
    expenses.push({
      title: `${cat.name} Item ${i}`,
      amount: Math.floor(Math.random() * 1000) + 50,
      date,
      categoryId: cat.id,
    });
  }
  
  // Incomes
  for (let i = 0; i < 3; i++) {
    expenses.push({
      title: 'Monthly Salary',
      amount: 50000,
      date: startOfMonth(subMonths(now, i)),
      categoryId: '6',
    });
  }
  
  await db.expenses.bulkAdd(expenses);

  // Savings Goals
  await db.savingsGoals.bulkAdd([
    { title: 'New Bike', targetAmount: 100000, currentAmount: 45000, color: '#3b82f6' },
    { title: 'Vacation', targetAmount: 50000, currentAmount: 12000, color: '#10b981' },
  ]);

  // Budgets
  await db.budgets.bulkAdd([
    { categoryId: '1', monthlyLimit: 8000, period: '2026-05' },
    { categoryId: '2', monthlyLimit: 3000, period: '2026-05' },
  ]);

  // Settings
  await db.settings.add({ 
    id: 1, 
    theme: 'dark', 
    overspendingAlert: true, 
    alertThreshold: 80,
    emailReports: false,
    billReminders: false
  });
  
  // Profile
  await db.profile.add({ id: 1, name: 'Alex Johnson' });
};
