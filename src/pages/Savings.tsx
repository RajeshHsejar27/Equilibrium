import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SavingsGoal } from '@/lib/db';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Target, AlertCircle, Info, PiggyBank, Wallet } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const SavingsGoals: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [color, setColor] = useState('#3b82f6');
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false);
  const [newTotalSavings, setNewTotalSavings] = useState<number>(0);

  const goals = useLiveQuery(() => db.savingsGoals.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get(1));

  const totalSavings = settings?.totalSavings || 0;
  const totalAllocated = goals.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const isSavingsDeficit = totalSavings < totalAllocated;

  const handleSave = async () => {
    if (!title || targetAmount <= 0) {
      toast.error("Title and target amount are required");
      return;
    }

    if (currentAmount > totalSavings) {
      toast.error(`Please add current savings within ₹${totalSavings.toLocaleString()}!`);
      return;
    }

    try {
      const goalData = { title, targetAmount, currentAmount, color };
      if (editingGoal) {
        await db.savingsGoals.update(editingGoal.id!, goalData);
        toast.success("Goal updated");
      } else {
        await db.savingsGoals.add(goalData);
        toast.success("Goal created");
      }
      resetForm();
    } catch (error) {
      toast.error("Failed to save goal");
    }
  };

  const handleUpdateTotalSavings = async () => {
    if (newTotalSavings < 0) {
      toast.error("Amount cannot be negative");
      return;
    }
    await db.settings.update(1, { totalSavings: newTotalSavings });
    setIsSavingsDialogOpen(false);
    toast.success("Total savings updated");
  };

  const resetForm = () => {
    setTitle('');
    setTargetAmount(0);
    setCurrentAmount(0);
    setColor('#3b82f6');
    setEditingGoal(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      await db.savingsGoals.delete(id);
      toast.success("Goal deleted");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground font-medium">Track your progress towards your financial dreams.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSavingsDialogOpen} onOpenChange={setIsSavingsDialogOpen}>
            <DialogTrigger>
              <Button variant="outline" className="gap-2 font-bold h-11 border-primary/20 hover:bg-primary/5">
                <Wallet size={18} className="text-primary" />
                Set Total Savings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Set Initial Total Savings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                 <div className="space-y-2">
                   <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Overall money in bank</label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                     <Input 
                       type="number" 
                       className="pl-7 h-11 bg-muted/50 border-none"
                       placeholder="0" 
                       value={newTotalSavings || ''}
                       onChange={(e) => setNewTotalSavings(Number(e.target.value))}
                     />
                   </div>
                 </div>
                 <Button className="w-full h-11 font-bold shadow-lg" onClick={handleUpdateTotalSavings}>
                   Save Amount
                 </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button className="gap-2 font-bold h-11 px-6 shadow-lg shadow-primary/20">
                <Plus size={18} />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Edit' : 'Create'} Savings Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                 <div className="space-y-2">
                   <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Goal Title</label>
                   <Input 
                     placeholder="e.g. Dream House, New Car" 
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     className="h-11 bg-muted/50 border-none"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Target Amount</label>
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                       <Input 
                         type="number" 
                         placeholder="0" 
                         value={targetAmount || ''}
                         onChange={(e) => setTargetAmount(Number(e.target.value))}
                         className="h-11 pl-7 bg-muted/50 border-none"
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Current Savings</label>
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                       <Input 
                         type="number" 
                         placeholder="0" 
                         value={currentAmount || ''}
                         onChange={(e) => setCurrentAmount(Number(e.target.value))}
                         className="h-11 pl-7 bg-muted/50 border-none"
                       />
                     </div>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Goal Color</label>
                   <Input 
                     type="color" 
                     className="w-full h-10 p-1 bg-muted/50 border-none rounded-lg"
                     value={color}
                     onChange={(e) => setColor(e.target.value)}
                   />
                 </div>
                 <Button className="w-full h-11 font-bold shadow-lg mt-2" onClick={handleSave}>
                   {editingGoal ? 'Update' : 'Create'} Goal
                 </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Savings Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-md bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <PiggyBank size={14} className="text-primary" />
               Total Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tabular-nums">₹{totalSavings.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Overall money in bank</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <Target size={14} className="text-primary" />
               Allocated Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tabular-nums">₹{totalAllocated.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Sum of all current goals</p>
          </CardContent>
        </Card>

        <Card className={cn("border-none shadow-md", isSavingsDeficit ? "bg-amber-500/10" : "bg-green-500/10")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               {isSavingsDeficit ? <AlertCircle size={14} className="text-amber-500" /> : <Info size={14} className="text-green-500" />}
               Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-lg font-black uppercase tracking-tighter", isSavingsDeficit ? "text-amber-600" : "text-green-600")}>
               {isSavingsDeficit ? "Savings Deficit" : "Healthy Allocation"}
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
               {isSavingsDeficit ? "Sum exceeds total savings!" : "Funds are properly distributed"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          return (
            <Card key={goal.id} className={cn(
              "relative overflow-hidden group transition-all border-2",
              isSavingsDeficit ? "border-amber-400 shadow-amber-100" : "border-transparent shadow-lg"
            )}>
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="flex gap-1">
                    <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => {
                      setEditingGoal(goal);
                      setTitle(goal.title);
                      setTargetAmount(goal.targetAmount);
                      setCurrentAmount(goal.currentAmount);
                      setColor(goal.color);
                      setIsDialogOpen(true);
                    }}>
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-8 w-8 text-destructive shadow-sm" onClick={() => handleDelete(goal.id!)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
               </div>
               {isSavingsDeficit && (
                 <div className="absolute top-4 right-4 group-hover:opacity-0 transition-opacity">
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger>
                         <AlertCircle className="text-amber-500 h-6 w-6 animate-pulse" />
                       </TooltipTrigger>
                       <TooltipContent className="bg-amber-500 text-white border-none font-bold">
                         <p>Savings have been drastically reduced, revise the current savings for each goals.</p>
                       </TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                 </div>
               )}
               <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: goal.color }}>
                       <Target size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{goal.title}</CardTitle>
                      <CardDescription className="text-[10px] font-black uppercase tracking-widest">Target: ₹{goal.targetAmount.toLocaleString()}</CardDescription>
                    </div>
                  </div>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                     <div className="text-2xl font-black tabular-nums">₹{goal.currentAmount.toLocaleString()}</div>
                     <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">{Math.round(progress)}% reached</div>
                  </div>
                  <Progress value={progress} className="h-2.5" />
               </CardContent>
               <CardFooter className="bg-muted/30 border-t py-3 flex justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Remaining: <span className="text-foreground">₹{(goal.targetAmount - goal.currentAmount).toLocaleString()}</span>
                  </p>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: goal.color }} />
               </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SavingsGoals;
