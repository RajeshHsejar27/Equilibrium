// import * as XLSX from 'xlsx/xlsx.mjs';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export const exportData = async (format: 'xlsx' | 'csv') => {
  try {
    const expenses = await db.expenses.toArray();
    const categories = await db.categories.toArray();
    const budgets = await db.budgets.toArray();
    const recurring = await db.recurringExpenses.toArray();
    const goals = await db.savingsGoals.toArray();
    const settings = await db.settings.toArray();
    const profile = await db.profile.toArray();

    const workbook = XLSX.utils.book_new();

    // Prevent Excel 32767 char crash
    const sanitizeForExcel = (data: any[]) => {
      return data.map(item => {
        const clean: any = {};

        Object.entries(item).forEach(([key, value]) => {
          const blockedFields = [
            'profilePicture',
            'profileImage',
            'avatar',
            'image',
            'blob',
            'preview',
            'base64',
            'file'
          ];

          // Replace huge image fields
          if (blockedFields.includes(key)) {
            clean[key] = '[Excluded from export]';
            return;
          }

          // Strings
          if (typeof value === 'string') {
            if (value.length > 32767) {
              console.warn('Large export field:', key, value.length);
            }

            clean[key] =
              value.length > 30000
                ? value.slice(0, 30000)
                : value;
          }

          // Dates
          else if (value instanceof Date) {
            clean[key] =
              isNaN(value.getTime())
                ? ''
                : value.toISOString().split('T')[0];
          }

          // Nested Objects
          else if (typeof value === 'object' && value !== null) {
            const stringified = JSON.stringify(value);

            clean[key] =
              stringified.length > 30000
                ? stringified.slice(0, 30000)
                : stringified;
          }

          // Numbers/Booleans
          else {
            clean[key] = value;
          }
        });

        return clean;
      });
    };

    const safeSheet = (data: any[]) =>
      XLSX.utils.json_to_sheet(
        data.length ? sanitizeForExcel(data) : [{}]
      );

    // Expenses Sheet
    const expensesData = expenses.map(e => {
      return {
        ...e,
        date:
          e.date instanceof Date && !isNaN(e.date.getTime())
            ? e.date.toISOString().split('T')[0]
            : '',
        categoryId: e.categoryId,
        category:
          categories.find(c => c.id === e.categoryId)?.name ||
          'Uncategorized'
      };
    });

    XLSX.utils.book_append_sheet(workbook, safeSheet(expensesData), 'Expenses');
    XLSX.utils.book_append_sheet(workbook, safeSheet(categories), 'Categories');
    XLSX.utils.book_append_sheet(workbook, safeSheet(budgets), 'Budgets');
    XLSX.utils.book_append_sheet(workbook, safeSheet(recurring), 'Recurring');
    XLSX.utils.book_append_sheet(workbook, safeSheet(goals), 'SavingsGoals');
    XLSX.utils.book_append_sheet(workbook, safeSheet(settings), 'Settings');
    XLSX.utils.book_append_sheet(workbook, safeSheet(profile), 'Profile');

    const timestamp = new Date().toISOString().split('T')[0];

    // XLSX Export
    if (format === 'xlsx') {
      XLSX.writeFile(
        workbook,
        `equilibrium_full_backup_${timestamp}.xlsx`
      );
    }
    // CSV Export
    else {
      const csvSheet = XLSX.utils.json_to_sheet(expensesData);

      XLSX.writeFile(
        {
          SheetNames: ['Expenses'],
          Sheets: { Expenses: csvSheet }
        },
        `equilibrium_expenses_${timestamp}.csv`,
        { bookType: 'csv' }
      );
    }

    toast.success('Data exported successfully');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Export failed');
  }
};

export const downloadMockTemplate = () => {
  try {
    const workbook = XLSX.utils.book_new();

    const categories = [
      { id: '1', name: 'Food & Dining', color: '#ef4444', type: 'outflow' },
      { id: '2', name: 'Transport', color: '#f59e0b', type: 'outflow' },
      { id: '3', name: 'Shopping', color: '#3b82f6', type: 'outflow' },
      { id: '4', name: 'Housing', color: '#10b981', type: 'outflow' },
      { id: '5', name: 'Entertainment', color: '#8b5cf6', type: 'outflow' },
      { id: '6', name: 'Income', color: '#22c55e', type: 'inflow' }
    ];

    const expenses = [
      { title: 'Coffee & Breakfast', amount: 120, date: '2026-05-18', categoryId: '1', category: 'Food & Dining', note: 'Daily morning coffee', isRecurring: false },
      { title: 'Monthly Salary', amount: 75000, date: '2026-05-01', categoryId: '6', category: 'Income', note: 'Primary job salary', isRecurring: false },
      { title: 'Weekly Groceries', amount: 2500, date: '2026-05-15', categoryId: '1', category: 'Food & Dining', note: 'Fresh vegetables and dairy', isRecurring: false },
      { title: 'Metro Commute', amount: 80, date: '2026-05-17', categoryId: '2', category: 'Transport', note: 'Office travel', isRecurring: false },
      { title: 'Apparel shopping', amount: 3400, date: '2026-05-10', categoryId: '3', category: 'Shopping', note: 'New jeans and t-shirt', isRecurring: false },
      { title: 'House Rent', amount: 18000, date: '2026-05-02', categoryId: '4', category: 'Housing', note: 'Rent for current month', isRecurring: false },
      { title: 'Cinema Tickets', amount: 700, date: '2026-05-16', categoryId: '5', category: 'Entertainment', note: 'Watched latest blockbuster', isRecurring: false }
    ];

    const budgets = [
      { categoryId: '1', monthlyLimit: 15000, period: '2026-05' },
      { categoryId: '2', monthlyLimit: 3000, period: '2026-05' },
      { categoryId: '3', monthlyLimit: 10000, period: '2026-05' },
      { categoryId: '4', monthlyLimit: 20000, period: '2026-05' },
      { categoryId: '5', monthlyLimit: 5000, period: '2026-05' }
    ];

    const recurring = [
      { title: 'Netflix Premium', amount: 649, categoryId: '5', frequency: 'monthly', startDate: '2026-01-01', isActive: true },
      { title: 'Gym Membership', amount: 1500, categoryId: '5', frequency: 'monthly', startDate: '2026-01-10', isActive: true }
    ];

    const goals = [
      { title: 'Emergency Fund', targetAmount: 150000, currentAmount: 35000, deadline: '2026-12-31', color: '#10b981' },
      { title: 'MacBook Pro', targetAmount: 180000, currentAmount: 50000, deadline: '2026-09-30', color: '#3b82f6' }
    ];

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expenses), 'Expenses');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categories), 'Categories');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(budgets), 'Budgets');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(recurring), 'Recurring');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(goals), 'SavingsGoals');

    XLSX.writeFile(workbook, `equilibrium_mock_template.xlsx`);
    toast.success('Mock data template downloaded successfully!');
  } catch (error) {
    console.error('Error generating template:', error);
    toast.error('Failed to generate template.');
  }
};
