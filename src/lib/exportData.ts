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
      const { categoryId, ...rest } = e;

      return {
        ...rest,
        date:
          e.date instanceof Date && !isNaN(e.date.getTime())
            ? e.date.toISOString().split('T')[0]
            : '',
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
