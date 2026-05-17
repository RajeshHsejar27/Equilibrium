import { db, type Category } from './db';

export const initializeMockData = async () => {
  const categoriesCount = await db.categories.count();
  if (categoriesCount > 0) return;

  // Categories
  const categories: Category[] = [
    { id: '1', name: 'Food & Dining', color: '#ef4444', icon: 'Utensils', type: 'outflow' },
    { id: '2', name: 'Transport', color: '#f59e0b', icon: 'Bus', type: 'outflow' },
    { id: '3', name: 'Shopping', color: '#3b82f6', icon: 'ShoppingBag', type: 'outflow' },
    { id: '4', name: 'Housing', color: '#10b981', icon: 'Home', type: 'outflow' },
    { id: '5', name: 'Entertainment', color: '#8b5cf6', icon: 'Film', type: 'outflow' },
    { id: '6', name: 'Income', color: '#22c55e', icon: 'DollarSign', type: 'inflow' },
  ];
  await db.categories.bulkAdd(categories);

  // Sample transactions: one per category with amount 100 for better first-time UX
  const now = new Date();
  const expenses = [
    {
      title: 'Coffee & Breakfast',
      amount: 100,
      date: now,
      categoryId: '1',
    },
    {
      title: 'Taxi Ride',
      amount: 100,
      date: now,
      categoryId: '2',
    },
    {
      title: 'Grocery Items',
      amount: 100,
      date: now,
      categoryId: '3',
    },
    {
      title: 'Rent Payment',
      amount: 100,
      date: now,
      categoryId: '4',
    },
    {
      title: 'Movie Tickets',
      amount: 100,
      date: now,
      categoryId: '5',
    },
  ];
  
  await db.expenses.bulkAdd(expenses);

  // Settings
  await db.settings.add({ 
    id: 1, 
    theme: 'light', 
    overspendingAlert: false, 
    alertThreshold: 80,
    emailReports: false,
    billReminders: false,
    totalSavings: 0
  });
  
  // Profile
  await db.profile.add({ id: 1, name: 'User' });
};
