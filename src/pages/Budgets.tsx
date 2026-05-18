import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Budget } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, AlertCircle, Target, Wallet } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { cn, getCategoryName } from '@/lib/utils';

const Budgets: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState<number>(0);

  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];

  const now = new Date();
  const currentPeriod = format(now, 'yyyy-MM');
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const handleSave = async () => {
    if (!categoryId || limit <= 0) {
      toast.error("Category and limit are required");
      return;
    }

    try {
      const budgetData = { categoryId, monthlyLimit: limit, period: currentPeriod };
      if (editingBudget) {
        await db.budgets.update(editingBudget.id!, budgetData);
        toast.success("Budget updated");
      } else {
        const existing = await db.budgets.where({ categoryId, period: currentPeriod }).first();
        if (existing) {
          toast.error("Budget already exists for this category this month. Edit the existing one instead.");
          return;
        }
        await db.budgets.add(budgetData);
        toast.success("Budget set");
      }
      resetForm();
    } catch (error) {
      toast.error("Failed to save budget");
    }
  };

  const resetForm = () => {
    setCategoryId('');
    setLimit(0);
    setEditingBudget(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground font-medium">Monthly spending limits for better control.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 font-bold">
              <Plus size={20} />
              Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Edit' : 'New'} Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
               <div className="space-y-2">
                 <Label>Category</Label>
                 <Select onValueChange={(v) => setCategoryId(v || '')} value={categoryId}>
                   <SelectTrigger className="h-11">
                     <SelectValue placeholder="Select category">
                       {categoryId ? getCategoryName(categories, categoryId) : "Select category"}
                     </SelectValue>
                   </SelectTrigger>
                   <SelectContent>
                     {categories.filter(c => c.id !== '6').map(cat => (
                       <SelectItem key={cat.id} value={cat.id}>
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                           {cat.name}
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Monthly Limit</Label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                   <Input 
                     type="number" 
                     className="pl-7 h-11"
                     placeholder="0" 
                     value={limit || ''}
                     onChange={(e) => setLimit(Number(e.target.value))}
                   />
                 </div>
               </div>
               <Button className="w-full h-11 font-bold shadow-lg" onClick={handleSave}>
                 Save Budget
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length === 0 ? (
          <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center bg-muted/20">
             <Wallet size={48} className="text-muted-foreground mb-4" />
             <h3 className="font-bold text-lg">No budgets set</h3>
             <p className="text-sm text-muted-foreground max-w-xs mx-auto">Set monthly limits for your categories to start tracking your spending efficiency.</p>
          </Card>
        ) : budgets.map((budget) => {
          const category = categories.find(c => c.id === budget.categoryId);
          const spent = expenses
            .filter(e => 
              e.categoryId === budget.categoryId && 
              isWithinInterval(e.date, { start: monthStart, end: monthEnd })
            )
            .reduce((acc, curr) => acc + curr.amount, 0);
          
          const progress = (spent / budget.monthlyLimit) * 100;
          const isOver = spent > budget.monthlyLimit;
          const isWarning = progress > 80 && !isOver;

          return (
            <Card key={budget.id} className={cn(
              "border-none shadow-lg overflow-hidden group hover:scale-[1.02] transition-all",
              isOver ? "bg-destructive/5" : ""
            )}>
               <div className="h-1.5 w-full" style={{ backgroundColor: category?.color }} />
               <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-4">
                     <CardTitle className="text-lg flex items-center gap-2 break-words min-w-0 flex-1">
                        {category?.name}
                     </CardTitle>
                     <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setEditingBudget(budget);
                          setCategoryId(budget.categoryId);
                          setLimit(budget.monthlyLimit);
                          setIsDialogOpen(true);
                        }}>
                          <Edit2 size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => db.budgets.delete(budget.id!)}>
                          <Trash2 size={12} />
                        </Button>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                     <div>
                        <div className="text-2xl font-black tabular-nums">₹{spent.toLocaleString()}</div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Limit: ₹{budget.monthlyLimit.toLocaleString()}</p>
                     </div>
                     <div className={cn(
                       "text-xs font-black tabular-nums px-2 py-0.5 rounded-full",
                       isOver ? 'bg-destructive text-destructive-foreground' : 
                       isWarning ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                     )}>
                        {Math.round(progress)}%
                     </div>
                  </div>
                  <Progress 
                    value={Math.min(progress, 100)} 
                    className="h-2.5"
                  />
                  
                  {isOver ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-[11px] font-bold">
                       <AlertCircle size={16} />
                       Limit exceeded by ₹{(spent - budget.monthlyLimit).toLocaleString()}
                    </div>
                  ) : isWarning ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-600 text-[11px] font-bold">
                       <Target size={16} />
                       Approaching limit (80% used)
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 text-muted-foreground text-[11px] font-bold">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                       ₹{(budget.monthlyLimit - spent).toLocaleString()} remaining
                    </div>
                  )}
               </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Internal Label component since I don't have it from ui/
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn("text-sm font-semibold tracking-tight", className)}>{children}</label>
);

export default Budgets;
