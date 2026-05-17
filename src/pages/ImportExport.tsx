import React, { useState } from 'react';
import { db, type Expense } from '@/lib/db';
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

const ImportExport: React.FC = () => {
  const [previewData, setPreviewData] = useState<Expense[]>([]);
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
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Validation & Transformation
        const transformed: Expense[] = (data as any[]).map(item => ({
          title: item.title || item.Title || '',
          amount: Number(item.amount || item.Amount || 0),
          date: new Date(item.date || item.Date),
          categoryId: String(item.categoryId || item.CategoryId || '1'),
          note: item.note || item.Note || ''
        })).filter(item => item.title && !isNaN(item.amount) && !isNaN(item.date.getTime()));

        setPreviewData(transformed);
        setShowPreview(true);
      } catch (error) {
        toast.error("Failed to parse file. Check the format.");
      } finally {
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    try {
      const existing = await db.expenses.toArray();
      let importedCount = 0;
      let duplicateCount = 0;

      for (const item of previewData) {
        const isDuplicate = existing.some(e => 
          e.title === item.title && 
          e.amount === item.amount && 
          e.date.getTime() === item.date.getTime()
        );

        if (!isDuplicate) {
          await db.expenses.add(item);
          importedCount++;
        } else {
          duplicateCount++;
        }
      }

      toast.success(`Import complete: ${importedCount} added, ${duplicateCount} skipped (duplicates).`);
      setShowPreview(false);
      setPreviewData([]);
    } catch (error) {
      toast.error("Import failed");
    }
  };

  const removeFromPreview = (index: number) => {
    setPreviewData(prev => prev.filter((_, i) => i !== index));
  };

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
                <h4 className="text-xs font-black uppercase text-muted-foreground tracking-tighter">Requirements</h4>
                <ul className="text-[10px] space-y-1 text-muted-foreground font-medium">
                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Header columns: Title, Amount, Date, CategoryId</li>
                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Date format: YYYY-MM-DD</li>
                   <li className="flex items-center gap-2"><AlertCircle size={12} className="text-amber-500" /> Duplicates will be automatically skipped</li>
                </ul>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <CardDescription>Review {previewData.length} records before final import.</CardDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] rounded-md border mt-4">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Date</TableHead>
                   <TableHead>Title</TableHead>
                   <TableHead className="text-right">Amount</TableHead>
                   <TableHead className="w-10"></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {previewData.map((item, idx) => (
                   <TableRow key={idx}>
                     <TableCell className="text-xs">{format(item.date, 'yyyy-MM-dd')}</TableCell>
                     <TableCell className="text-xs font-bold">{item.title}</TableCell>
                     <TableCell className="text-xs text-right font-black">₹{item.amount.toLocaleString()}</TableCell>
                     <TableCell>
                       <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromPreview(idx)}>
                         <Trash2 size={12} />
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
          </ScrollArea>
          <DialogFooter className="mt-4">
             <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
             <Button onClick={processImport} className="font-bold">Confirm Import ({previewData.length} records)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportExport;
