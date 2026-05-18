import React, { useState } from 'react';
import { db, type Expense, type Category, type Budget, type RecurringExpense, type SavingsGoal } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
// import * as XLSX from 'xlsx/xlsx.mjs';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { exportData } from '@/lib/exportData';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImportPreview {
  categories: Category[];
  expenses: Expense[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  savingsGoals: SavingsGoal[];
}

const ImportExport: React.FC = () => {
  const [previewData, setPreviewData] = useState<ImportPreview>({
    categories: [],
    expenses: [],
    budgets: [],
    recurringExpenses: [],
    savingsGoals: []
  });
  const [showPreview, setShowPreview] = useState(false);

  // const handleExport = async (format: 'xlsx' | 'csv') => {
  //   try {
  //     const expenses = await db.expenses.toArray();
  //     const categories = await db.categories.toArray();
  //     const budgets = await db.budgets.toArray();
  //     const recurring = await db.recurringExpenses.toArray();
  //     const goals = await db.savingsGoals.toArray();
  //     const settings = await db.settings.toArray();
  //     const profile = await db.profile.toArray();

  //     const workbook = XLSX.utils.book_new();

  //     // Sheets preparation
  //     const expensesData = expenses.map(e => {
  //       const { categoryId, ...rest } = e;
  //       return {
  //         ...rest,
  //         date: e.date.toISOString().split('T')[0],
  //         category: categories.find(c => c.id === e.categoryId)?.name || 'Uncategorized'
  //       };
  //     });
  //     const categoriesData = categories;
  //     const budgetsData = budgets;
  //     const recurringData = recurring;
  //     const goalsData = goals;
  //     const settingsData = settings;
  //     const profileData = profile;

  //     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expensesData), "Expenses");
  //     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categoriesData), "Categories");
  //     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(budgetsData), "Budgets");
  //     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(recurringData), "Recurring");
  //     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(goalsData), "SavingsGoals");
  //     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(settingsData), "Settings");
  //     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(profileData), "Profile");

  //     const timestamp = new Date().toISOString().split('T')[0];
  //     if (format === 'xlsx') {
  //       XLSX.writeFile(workbook, `equilibrium_full_backup_${timestamp}.xlsx`);
  //     } else {
  //       // CSV only supports one sheet, exporting expenses
  //       XLSX.writeFile(workbook, `equilibrium_expenses_${timestamp}.csv`, { bookType: 'csv' });
  //     }
  //     toast.success(`Data exported successfully`);
  //   } catch (error) {
  //     toast.error("Export failed");
  //   }
  // };


  const handleExport = (format: 'xlsx' | 'csv') => {
    exportData(format);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Helper function to parse Excel dates
        const parseExcelDate = (dateValue: any): Date => {
          if (!dateValue) return new Date();
          if (dateValue instanceof Date) return dateValue;
          if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue);
            if (!isNaN(parsed.getTime())) return parsed;
          }
          if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1900, 0, 1).getTime();
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            return new Date(excelEpoch + (dateValue - 2) * millisecondsPerDay);
          }
          return new Date();
        };

        const preview: ImportPreview = {
          categories: [],
          expenses: [],
          budgets: [],
          recurringExpenses: [],
          savingsGoals: []
        };

        const existingCategories = await db.categories.toArray();

        // Parse Categories sheet
        if (wb.SheetNames.includes('Categories')) {
          const ws = wb.Sheets['Categories'];
          const data = XLSX.utils.sheet_to_json(ws, { raw: false });
          preview.categories = (data as any[]).map(item => ({
            id: String(item.id || item.Id || crypto.randomUUID()),
            name: item.name || item.Name || '',
            color: item.color || item.Color || '#3b82f6',
            icon: item.icon || item.Icon,
            budget: item.budget ? Number(item.budget) : undefined,
            type: (item.type || item.Type || 'outflow') as 'inflow' | 'outflow'
          })).filter(c => c.name && c.id);
        }

        // Parse Expenses sheet
        if (wb.SheetNames.includes('Expenses')) {
          const ws = wb.Sheets['Expenses'];
          const data = XLSX.utils.sheet_to_json(ws, { raw: false });
          
          // Combine existing + new categories for lookup
          const allCategories = [...existingCategories, ...preview.categories];

          const resolveCategoryId = (item: any): string => {
            // Try direct categoryId first
            if (item.categoryId || item.CategoryId) {
              const id = String(item.categoryId || item.CategoryId);
              if (allCategories.some(c => c.id === id)) return id;
            }
            // Try category name
            if (item.category || item.Category) {
              const categoryName = String(item.category || item.Category);
              const found = allCategories.find(c => c.name === categoryName);
              if (found) return found.id;
            }
            // Default fallback
            const defaultCat = allCategories.find(c => c.name === 'Uncategorized') || allCategories[0];
            return defaultCat?.id || '1';
          };

          preview.expenses = (data as any[]).map(item => ({
            title: item.title || item.Title || '',
            amount: Number(item.amount || item.Amount || 0),
            date: parseExcelDate(item.date || item.Date),
            categoryId: resolveCategoryId(item),
            note: item.note || item.Note || '',
            isRecurring: item.isRecurring === 'TRUE' || item.isRecurring === true,
            recurringId: item.recurringId || item.RecurringId
          })).filter(e => e.title && !isNaN(e.amount) && !isNaN(e.date.getTime()));
        }

        // Parse Budgets sheet
        if (wb.SheetNames.includes('Budgets')) {
          const ws = wb.Sheets['Budgets'];
          const data = XLSX.utils.sheet_to_json(ws, { raw: false });
          const allCategories = [...existingCategories, ...preview.categories];

          preview.budgets = (data as any[]).map(item => ({
            categoryId: String(item.categoryId || item.CategoryId || allCategories[0]?.id || '1'),
            monthlyLimit: Number(item.monthlyLimit || item.MonthlyLimit || 0),
            period: String(item.period || item.Period || '')
          })).filter(b => b.categoryId && b.monthlyLimit > 0);
        }

        // Parse Recurring Expenses sheet
        if (wb.SheetNames.includes('Recurring')) {
          const ws = wb.Sheets['Recurring'];
          const data = XLSX.utils.sheet_to_json(ws, { raw: false });
          const allCategories = [...existingCategories, ...preview.categories];

          preview.recurringExpenses = (data as any[]).map(item => ({
            title: item.title || item.Title || '',
            amount: Number(item.amount || item.Amount || 0),
            categoryId: String(item.categoryId || item.CategoryId || allCategories[0]?.id || '1'),
            frequency: (item.frequency || item.Frequency || 'monthly') as 'weekly' | 'monthly' | 'yearly',
            startDate: parseExcelDate(item.startDate || item.StartDate),
            endDate: item.endDate || item.EndDate ? parseExcelDate(item.endDate || item.EndDate) : undefined,
            isActive: (item.isActive || item.IsActive) !== 'FALSE' && (item.isActive || item.IsActive) !== false
          })).filter(r => r.title && !isNaN(r.amount) && !isNaN(r.startDate.getTime()));
        }

        // Parse Savings Goals sheet
        if (wb.SheetNames.includes('SavingsGoals')) {
          const ws = wb.Sheets['SavingsGoals'];
          const data = XLSX.utils.sheet_to_json(ws, { raw: false });

          preview.savingsGoals = (data as any[]).map(item => {
            const deadlineValue = item.deadline || item.Deadline;
            return {
              title: item.title || item.Title || '',
              targetAmount: Number(item.targetAmount || item.TargetAmount || 0),
              currentAmount: Number(item.currentAmount || item.CurrentAmount || 0),
              deadline: deadlineValue ? parseExcelDate(deadlineValue) : undefined,
              color: item.color || item.Color || '#3b82f6'
            };
          }).filter(g => g.title && g.targetAmount > 0);
        }

        setPreviewData(preview);
        setShowPreview(true);
      } catch (error) {
        console.error('Parse error:', error);
        toast.error("Failed to parse file. Check the format.");
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    try {
      let stats = {
        categories: 0,
        expenses: 0,
        budgets: 0,
        recurring: 0,
        goals: 0
      };

      // 1. Import Categories first (so expenses can reference them)
      if (previewData.categories.length > 0) {
        const existingCategories = await db.categories.toArray();
        for (const cat of previewData.categories) {
          const exists = existingCategories.some(c => c.id === cat.id);
          if (!exists) {
            await db.categories.add(cat);
            stats.categories++;
          }
        }
      }

      // 2. Import Expenses
      if (previewData.expenses.length > 0) {
        const existing = await db.expenses.toArray();
        for (const exp of previewData.expenses) {
          const isDuplicate = existing.some(e =>
            e.title === exp.title &&
            e.amount === exp.amount &&
            e.date.getTime() === exp.date.getTime()
          );
          if (!isDuplicate) {
            await db.expenses.add(exp);
            stats.expenses++;
          }
        }
      }

      // 3. Import Budgets
      if (previewData.budgets.length > 0) {
        const existing = await db.budgets.toArray();
        for (const budget of previewData.budgets) {
          const isDuplicate = existing.some(b =>
            b.categoryId === budget.categoryId &&
            b.period === budget.period
          );
          if (!isDuplicate) {
            await db.budgets.add(budget);
            stats.budgets++;
          }
        }
      }

      // 4. Import Recurring Expenses
      if (previewData.recurringExpenses.length > 0) {
        const existing = await db.recurringExpenses.toArray();
        for (const rec of previewData.recurringExpenses) {
          const isDuplicate = existing.some(r =>
            r.title === rec.title &&
            r.categoryId === rec.categoryId &&
            r.frequency === rec.frequency
          );
          if (!isDuplicate) {
            await db.recurringExpenses.add(rec);
            stats.recurring++;
          }
        }
      }

      // 5. Import Savings Goals
      if (previewData.savingsGoals.length > 0) {
        const existing = await db.savingsGoals.toArray();
        for (const goal of previewData.savingsGoals) {
          const isDuplicate = existing.some(g =>
            g.title === goal.title &&
            g.targetAmount === goal.targetAmount
          );
          if (!isDuplicate) {
            await db.savingsGoals.add(goal);
            stats.goals++;
          }
        }
      }

      toast.success(
        `Import complete! Categories: ${stats.categories}, Expenses: ${stats.expenses}, ` +
        `Budgets: ${stats.budgets}, Recurring: ${stats.recurring}, Goals: ${stats.goals}`
      );
      
      setShowPreview(false);
      setPreviewData({
        categories: [],
        expenses: [],
        budgets: [],
        recurringExpenses: [],
        savingsGoals: []
      });
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Import failed");
    }
  };

  const removeFromPreview = (sheetType: keyof ImportPreview, index: number) => {
    setPreviewData(prev => ({
      ...prev,
      [sheetType]: prev[sheetType].filter((_, i) => i !== index)
    }));
  };

  const totalRecords = 
    previewData.categories.length +
    previewData.expenses.length +
    previewData.budgets.length +
    previewData.recurringExpenses.length +
    previewData.savingsGoals.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
        <p className="text-muted-foreground font-medium">Backup or restore your financial records.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Section */}
        <Card className="border-none shadow-lg bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Download className="h-5 w-5 text-primary" />
               Export Data
            </CardTitle>
            <CardDescription>Download your expenses in your preferred format.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <Button onClick={() => handleExport('xlsx')} className="h-24 flex-col gap-2 font-bold shadow-md">
                 <FileSpreadsheet size={28} />
                 Excel (.xlsx)
               </Button>
               <Button onClick={() => handleExport('csv')} variant="outline" className="h-24 flex-col gap-2 font-bold border-primary/20 hover:bg-primary/10">
                 <FileText size={28} className="text-primary" />
                 CSV (.csv)
               </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest pt-2">
               All local records will be included
            </p>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Upload className="h-5 w-5 text-primary" />
               Import Data
            </CardTitle>
            <CardDescription>Upload records from Excel or CSV files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-2xl p-8 hover:bg-muted/30 transition-colors relative cursor-pointer group">
                <input 
                  id="import-file"
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                />
                <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                   <FileSpreadsheet size={32} className="text-primary" />
                </div>
                <p className="text-sm font-bold">Drag and drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">Supports XLSX, XLS, and CSV</p>
             </div>
             
             <div className="bg-muted/50 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-black uppercase text-muted-foreground tracking-tighter">Supported Sheets</h4>
                <ul className="text-[10px] space-y-1 text-muted-foreground font-medium">
                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Categories (id, name, color, type)</li>
                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Expenses (title, amount, date, categoryId)</li>
                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Budgets (categoryId, monthlyLimit, period)</li>
                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Recurring (title, amount, categoryId, frequency)</li>
                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> SavingsGoals (title, targetAmount, currentAmount)</li>
                   <li className="flex items-center gap-2"><AlertCircle size={12} className="text-amber-500" /> Date format: YYYY-MM-DD (auto-converts Excel dates)</li>
                </ul>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <CardDescription>Review {totalRecords} records before final import.</CardDescription>
          </DialogHeader>

          <Tabs defaultValue="expenses" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-5">
              {previewData.categories.length > 0 && (
                <TabsTrigger value="categories" className="text-xs">
                  Categories ({previewData.categories.length})
                </TabsTrigger>
              )}
              {previewData.expenses.length > 0 && (
                <TabsTrigger value="expenses" className="text-xs">
                  Expenses ({previewData.expenses.length})
                </TabsTrigger>
              )}
              {previewData.budgets.length > 0 && (
                <TabsTrigger value="budgets" className="text-xs">
                  Budgets ({previewData.budgets.length})
                </TabsTrigger>
              )}
              {previewData.recurringExpenses.length > 0 && (
                <TabsTrigger value="recurring" className="text-xs">
                  Recurring ({previewData.recurringExpenses.length})
                </TabsTrigger>
              )}
              {previewData.savingsGoals.length > 0 && (
                <TabsTrigger value="goals" className="text-xs">
                  Goals ({previewData.savingsGoals.length})
                </TabsTrigger>
              )}
            </TabsList>

            {/* Categories Tab */}
            {previewData.categories.length > 0 && (
              <TabsContent value="categories" className="flex-1 overflow-hidden">
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.categories.map((cat, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-bold">{cat.name}</TableCell>
                          <TableCell className="text-xs">{cat.type}</TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded border" style={{ backgroundColor: cat.color }}></div>
                              {cat.color}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromPreview('categories', idx)}>
                              <Trash2 size={12} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Expenses Tab */}
            {previewData.expenses.length > 0 && (
              <TabsContent value="expenses" className="flex-1 overflow-hidden">
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category ID</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.expenses.map((exp, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs">{format(exp.date, 'yyyy-MM-dd')}</TableCell>
                          <TableCell className="text-xs font-bold">{exp.title}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{exp.categoryId}</TableCell>
                          <TableCell className="text-xs text-right font-black">₹{exp.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromPreview('expenses', idx)}>
                              <Trash2 size={12} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Budgets Tab */}
            {previewData.budgets.length > 0 && (
              <TabsContent value="budgets" className="flex-1 overflow-hidden">
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category ID</TableHead>
                        <TableHead className="text-right">Monthly Limit</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.budgets.map((budget, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-bold">{budget.categoryId}</TableCell>
                          <TableCell className="text-xs text-right">₹{budget.monthlyLimit.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{budget.period}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromPreview('budgets', idx)}>
                              <Trash2 size={12} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Recurring Tab */}
            {previewData.recurringExpenses.length > 0 && (
              <TabsContent value="recurring" className="flex-1 overflow-hidden">
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.recurringExpenses.map((rec, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-bold">{rec.title}</TableCell>
                          <TableCell className="text-xs text-right">₹{rec.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{rec.frequency}</TableCell>
                          <TableCell className="text-xs">{rec.isActive ? '✓' : '✗'}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromPreview('recurringExpenses', idx)}>
                              <Trash2 size={12} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Goals Tab */}
            {previewData.savingsGoals.length > 0 && (
              <TabsContent value="goals" className="flex-1 overflow-hidden">
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-right">Target</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.savingsGoals.map((goal, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-bold">{goal.title}</TableCell>
                          <TableCell className="text-xs text-right">₹{goal.targetAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">₹{goal.currentAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromPreview('savingsGoals', idx)}>
                              <Trash2 size={12} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
            <Button onClick={processImport} className="font-bold">Confirm Import ({totalRecords} records)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportExport;
