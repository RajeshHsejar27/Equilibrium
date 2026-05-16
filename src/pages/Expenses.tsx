import React, { useState, useMemo } from 'react';
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
  type ColumnFiltersState
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
import { cn } from '@/lib/utils';

const columnHelper = createColumnHelper<Expense>();

const Expenses: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const columns = useMemo(() => [
    columnHelper.accessor('date', {
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-4 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: info => format(info.getValue() as Date, 'MMM dd, yyyy'),
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      cell: info => <span className="font-semibold">{info.getValue()}</span>,
    }),
    columnHelper.accessor('categoryId', {
      header: 'Category',
      cell: info => {
        const cat = categories.find(c => c.id === info.getValue());
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: cat?.color }} />
            <span className="text-xs">{cat?.name}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => (
        <div className="text-right">
          <Button variant="ghost" className="h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Amount <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: info => (
        <div className={cn("text-right font-black tabular-nums", info.row.original.categoryId === '6' ? "text-green-500" : "text-foreground")}>
          {info.row.original.categoryId === '6' ? '+' : '-'}₹{info.getValue().toLocaleString()}
        </div>
      ),
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

  const table = useReactTable({
    data: expenses,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground font-medium">Manage your daily spending history.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 font-bold">
              <Plus size={20} />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit' : 'Add'} Transaction</DialogTitle>
            </DialogHeader>
            <ExpenseForm 
              initialData={editingExpense || undefined} 
              onSuccess={() => {
                setIsDialogOpen(false);
                setEditingExpense(null);
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl bg-card/80 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search description..." 
                className="pl-9 h-10 border-none bg-muted/50 focus-visible:ring-primary/20"
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Month Filter */}
              <Select onValueChange={(v: string | null) => {
                if (!v || v === 'all') {
                  table.getColumn('date')?.setFilterValue(undefined);
                } else {
                  const date = new Date(v);
                  const start = startOfMonth(date);
                  const end = endOfMonth(date);
                  table.getColumn('date')?.setFilterValue([start, end]);
                }
              }}>
                <SelectTrigger className="w-[140px] h-10 bg-muted/50 border-none">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  {months.map(m => (
                    <SelectItem key={format(m, 'yyyy-MM')} value={m.toISOString()}>
                      {format(m, 'MMM yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select onValueChange={(v) => table.getColumn('categoryId')?.setFilterValue(v === 'all' ? undefined : v)}>
                <SelectTrigger className="w-[140px] h-10 bg-muted/50 border-none">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Shortcut */}
              <Select onValueChange={(v) => {
                if (v === 'date-desc') setSorting([{ id: 'date', desc: true }]);
                if (v === 'date-asc') setSorting([{ id: 'date', desc: false }]);
                if (v === 'amount-desc') setSorting([{ id: 'amount', desc: true }]);
                if (v === 'amount-asc') setSorting([{ id: 'amount', desc: false }]);
              }}>
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
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
  );
};

export default Expenses;
