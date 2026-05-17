import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RecurringExpense } from '@/lib/db';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
import { Plus, Edit2, Trash2, Repeat, Zap, CreditCard, Clock } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn, getCategoryName } from '@/lib/utils';

const Recurring: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const recurring = useLiveQuery(() => db.recurringExpenses.toArray()) || [];

  const handleSave = async () => {
    if (!title || amount <= 0 || !categoryId) {
      toast.error("All fields are required");
      return;
    }

    try {
      const data: RecurringExpense = { 
        title, 
        amount, 
        categoryId, 
        frequency, 
        startDate: new Date(), 
        isActive: true 
      };

      if (editingRecurring) {
        await db.recurringExpenses.update(editingRecurring.id!, data);
        toast.success("Recurring expense updated");
      } else {
        await db.recurringExpenses.add(data);
        toast.success("Recurring expense added");
      }
      resetForm();
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount(0);
    setCategoryId('');
    setFrequency('monthly');
    setEditingRecurring(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring</h1>
          <p className="text-muted-foreground font-medium">Automated templates for subscriptions and bills.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 font-bold">
              <Plus size={20} />
              Add Recurring
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingRecurring ? 'Edit' : 'Add'} Recurring Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
               <div className="space-y-2">
                 <Label>Title</Label>
                 <Input 
                   placeholder="e.g. Netflix, Rent" 
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   className="h-11 bg-muted/50 border-none"
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Amount</Label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                     <Input 
                       type="number" 
                       className="h-11 pl-7 bg-muted/50 border-none"
                       placeholder="0" 
                       value={amount || ''}
                       onChange={(e) => setAmount(Number(e.target.value))}
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Frequency</Label>
                   <Select onValueChange={(v) => setFrequency(v as any)} value={frequency}>
                     <SelectTrigger className="h-11 bg-muted/50 border-none">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="weekly">Weekly</SelectItem>
                       <SelectItem value="monthly">Monthly</SelectItem>
                       <SelectItem value="yearly">Yearly</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="space-y-2">
                 <Label>Category</Label>
                 <Select onValueChange={(v) => setCategoryId(v || '')} value={categoryId}>
                   <SelectTrigger className="h-11 bg-muted/50 border-none">
                     <SelectValue placeholder="Select category">
                       {categoryId ? getCategoryName(categories, categoryId) : "Select category"}
                     </SelectValue>
                   </SelectTrigger>
                   <SelectContent>
                     {categories.map(cat => (
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
               <Button className="w-full h-11 font-bold shadow-lg mt-2" onClick={handleSave}>
                 Save Template
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="border-none bg-primary/5 shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Zap size={20} />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Recurring expenses act as templates. They will appear as <span className="text-primary font-bold">Smart Suggestions</span> when you add new transactions, allowing for 1-tap entry.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recurring.length === 0 ? (
          <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center bg-muted/20">
             <Repeat size={48} className="text-muted-foreground mb-4" />
             <h3 className="font-bold text-lg">No recurring bills</h3>
             <p className="text-sm text-muted-foreground max-w-xs mx-auto">Add your monthly subscriptions or rent here to get smart suggestions during entry.</p>
          </Card>
        ) : recurring.map((item) => {
          const category = categories.find(c => c.id === item.categoryId);
          return (
            <Card key={item.id} className="border-none shadow-lg group hover:shadow-xl transition-all">
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                       <CreditCard size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="text-[10px] uppercase font-bold tracking-widest">{category?.name}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        setEditingRecurring(item);
                        setTitle(item.title);
                        setAmount(item.amount);
                        setCategoryId(item.categoryId);
                        setFrequency(item.frequency);
                        setIsDialogOpen(true);
                     }}>
                        <Edit2 size={14} />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => db.recurringExpenses.delete(item.id!)}>
                        <Trash2 size={14} />
                     </Button>
                  </div>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center justify-between mt-2 p-3 bg-muted/50 rounded-xl">
                     <div className="text-xl font-black tabular-nums">₹{item.amount.toLocaleString()}</div>
                     <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary">
                        <Clock size={12} />
                        {item.frequency}
                     </div>
                  </div>
               </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn("text-xs font-bold uppercase tracking-wider text-muted-foreground", className)}>{children}</label>
);

export default Recurring;
