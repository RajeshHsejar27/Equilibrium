import React, { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Expense } from '@/lib/db';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { toast } from 'sonner';
import { cn, getCategoryName } from '@/lib/utils';

const columnHelper = createColumnHelper<Expense>();

const Expenses: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const columns = useMemo(() => [
    columnHelper.accessor('date', {
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-4 h-8" onClick={() => {
          const nextDesc = column.getIsSorted() !== "desc";
          setSortBy(nextDesc ? 'date-desc' : 'date-asc');
          setSorting([{ id: 'date', desc: nextDesc }]);
        }}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: info => format(new Date(info.getValue() as Date), 'MMM dd, yyyy'),
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      cell: info => <span className="font-semibold">{info.getValue()}</span>,
    }),
    columnHelper.accessor('categoryId', {
      header: 'Category',
      cell: info => {
        const cat = categories.find(c => c.id === info.getValue());
        if (!cat) return <span className="text-xs text-muted-foreground italic">Uncategorized</span>;
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
            <span className="text-xs">{cat.name}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => (
        <div className="text-right">
          <Button variant="ghost" className="h-8" onClick={() => {
            const nextDesc = column.getIsSorted() !== "desc";
            setSortBy(nextDesc ? 'amount-desc' : 'amount-asc');
            setSorting([{ id: 'amount', desc: nextDesc }]);
          }}>
            Amount <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: info => {
        const cat = categories.find(c => c.id === info.row.original.categoryId);
        return (
          <div className={cn("text-right font-black tabular-nums", cat?.type === 'inflow' ? "text-green-500" : "text-foreground")}>
            {cat?.type === 'inflow' ? '+' : '-'}₹{info.getValue().toLocaleString()}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: info => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            setEditingExpense(info.row.original);
            setIsDialogOpen(true);
          }}>
            <Edit2 size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(info.row.original.id!)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    }),
  ], [categories]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      await db.expenses.delete(id);
      toast.success("Expense deleted");
    }
  };

  // Filter Helpers
  const months = eachMonthOfInterval({
    start: subMonths(new Date(), 12),
    end: new Date()
  }).reverse();

  const filteredExpenses = useMemo(() => {
    let list = [...expenses];

    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const start = startOfMonth(new Date(year, month - 1, 1));
      const end = endOfMonth(new Date(year, month - 1, 1));
      list = list.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= start && expenseDate <= end;
      });
    }

    if (selectedCategoryId !== 'all') {
      list = list.filter(e => e.categoryId === selectedCategoryId);
    }

    const query = globalFilter.trim().toLowerCase();
    if (query) {
      list = list.filter(e => {
        const categoryName = getCategoryName(categories, e.categoryId).toLowerCase();
        return (
          e.title.toLowerCase().includes(query) ||
          categoryName.includes(query) ||
          e.note?.toLowerCase().includes(query)
        );
      });
    }

    return list;
  }, [categories, expenses, globalFilter, selectedCategoryId, selectedMonth]);

  const sortedCardExpenses = useMemo(() => {
    const list = [...filteredExpenses];

    if (sortBy === 'date-desc') list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortBy === 'date-asc') list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortBy === 'amount-desc') list.sort((a, b) => b.amount - a.amount);
    if (sortBy === 'amount-asc') list.sort((a, b) => a.amount - b.amount);

    return list;
  }, [filteredExpenses, sortBy]);

  const handleSortChange = (value: string) => {
    setSortBy(value);

    if (value === 'date-desc') setSorting([{ id: 'date', desc: true }]);
    if (value === 'date-asc') setSorting([{ id: 'date', desc: false }]);
    if (value === 'amount-desc') setSorting([{ id: 'amount', desc: true }]);
    if (value === 'amount-asc') setSorting([{ id: 'amount', desc: false }]);
  };

  const table = useReactTable({
    data: filteredExpenses,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [globalFilter, selectedCategoryId, selectedMonth, sortBy]);

  const addEditDialog = (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) setEditingExpense(null);
    }}>
      <DialogTrigger>
        <Button className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 font-bold w-full sm:w-auto">
          <Plus size={20} />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingExpense ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <ExpenseForm
          initialData={editingExpense ?? undefined}
          onSuccess={() => {
            setIsDialogOpen(false);
            setEditingExpense(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground font-medium">Manage your daily spending history.</p>
        </div>
        {/* Add Button — hidden on mobile here, shown in filter block */}
        <div className="hidden sm:block">
          {addEditDialog}
        </div>
      </div>

      {/* Search + Add (mobile: full-width stacked) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search description..." 
            className="pl-9 h-10 border-none bg-muted/50 focus-visible:ring-primary/20 w-full"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        {/* Add button on mobile below search */}
        <div className="sm:hidden">
          {addEditDialog}
        </div>
      </div>

      {/* ===== MOBILE VIEW (<768px): Card List ===== */}
      <div className="md:hidden space-y-4">
        {/* Mobile Filters: 2-column grid */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v ?? 'all')}>
            <SelectTrigger className="h-10 bg-muted/50 border-none w-full">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {months.map(m => (
                <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                  {format(m, 'MMM yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategoryId} onValueChange={(v) => setSelectedCategoryId(v ?? 'all')}>
            <SelectTrigger className="h-10 bg-muted/50 border-none w-full">
              <SelectValue placeholder="Category">
                {selectedCategoryId !== 'all'
                  ? (categories.find(c => c.id === selectedCategoryId)?.name ?? 'Category')
                  : 'Category'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => handleSortChange(v ?? 'date-desc')}>
            <SelectTrigger className="h-10 bg-muted/50 border-none w-full col-span-2">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="amount-desc">Highest Amount</SelectItem>
              <SelectItem value="amount-asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction count */}
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
          {sortedCardExpenses.length} Transaction{sortedCardExpenses.length !== 1 ? 's' : ''}
        </p>

        {/* Card list */}
        {sortedCardExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <p className="font-medium italic">No matching transactions found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedCardExpenses.map((expense) => {
              const cat = categories.find(c => c.id === expense.categoryId);
              const isInflow = cat?.type === 'inflow';
              return (
                <Card 
                  key={expense.id} 
                  className="border-none shadow-md bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden"
                >
                  <CardContent className="p-4">
                    {/* Row 1: Title + Amount */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Category color circle avatar */}
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                          style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                        >
                          {(expense.title?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base leading-tight truncate">{expense.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "text-lg font-black tabular-nums shrink-0",
                        isInflow ? "text-green-500" : "text-foreground"
                      )}>
                        {isInflow ? '+' : '-'}₹{expense.amount.toLocaleString()}
                      </div>
                    </div>

                    {/* Row 2: Category dot + name + action buttons */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: cat?.color ?? '#94a3b8' }} 
                        />
                        <span className="text-xs text-muted-foreground font-medium">
                          {cat?.name ?? 'Uncategorized'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl hover:bg-muted/60"
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(expense.id!)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== DESKTOP/TABLET VIEW (>=768px): TanStack Table ===== */}
      <div className="hidden md:block">
        <Card className="border-none shadow-xl bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-2">
              {/* Month Filter */}
              <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v ?? 'all')}>
                <SelectTrigger className="w-[140px] h-10 bg-muted/50 border-none">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  {months.map(m => (
                    <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                      {format(m, 'MMM yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={selectedCategoryId} onValueChange={(v) => setSelectedCategoryId(v ?? 'all')}>
                <SelectTrigger className="w-[140px] h-10 bg-muted/50 border-none">
                  <SelectValue placeholder="Category">
                    {selectedCategoryId !== 'all'
                      ? getCategoryName(categories, selectedCategoryId)
                      : "Category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Shortcut */}
              <Select value={sortBy} onValueChange={(v) => handleSortChange(v ?? 'date-desc')}>
                <SelectTrigger className="w-[140px] h-10 bg-muted/50 border-none">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="amount-desc">Highest Amount</SelectItem>
                  <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-muted-foreground/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-medium italic">
                        No matching transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} className="hover:bg-muted/30 transition-colors border-muted-foreground/10">
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 px-1">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Showing {table.getFilteredRowModel().rows.length === 0
                  ? 0
                  : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of {table.getFilteredRowModel().rows.length} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg" 
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg" 
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft size={16} />
                </Button>
                {/* Page number chips */}
                {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                  const pageIdx = table.getState().pagination.pageIndex;
                  const total = table.getPageCount();
                  const start = Math.max(0, Math.min(pageIdx - 2, total - 5));
                  const page = start + i;
                  if (page >= total) return null;
                  return (
                    <Button
                      key={page}
                      variant={pageIdx === page ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 rounded-lg text-xs"
                      onClick={() => table.setPageIndex(page)}
                    >
                      {page + 1}
                    </Button>
                  );
                })}
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg" 
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg" 
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Expenses;
