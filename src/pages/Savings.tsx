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
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
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

  const goals = useLiveQuery(() => db.savingsGoals.toArray()) || [];

  const handleSave = async () => {
    if (!title || targetAmount <= 0) {
      toast.error("Title and target amount are required");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground">Track your progress towards your financial dreams.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2">
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
                 <label className="text-sm font-medium">Goal Title</label>
                 <Input 
                   placeholder="e.g. Dream House, New Car" 
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Target Amount</label>
                   <Input 
                     type="number" 
                     placeholder="0" 
                     value={targetAmount}
                     onChange={(e) => setTargetAmount(Number(e.target.value))}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Current Savings</label>
                   <Input 
                     type="number" 
                     placeholder="0" 
                     value={currentAmount}
                     onChange={(e) => setCurrentAmount(Number(e.target.value))}
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium">Goal Color</label>
                 <Input 
                   type="color" 
                   className="w-full h-10 p-1"
                   value={color}
                   onChange={(e) => setColor(e.target.value)}
                 />
               </div>
               <Button className="w-full" onClick={handleSave}>
                 {editingGoal ? 'Update' : 'Create'} Goal
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          return (
            <Card key={goal.id} className="relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {
                      setEditingGoal(goal);
                      setTitle(goal.title);
                      setTargetAmount(goal.targetAmount);
                      setCurrentAmount(goal.currentAmount);
                      setColor(goal.color);
                      setIsDialogOpen(true);
                    }}>
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(goal.id!)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
               </div>
               <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: goal.color }}>
                       <Target size={20} />
                    </div>
                    <div>
                      <CardTitle>{goal.title}</CardTitle>
                      <CardDescription>Target: ₹{goal.targetAmount.toLocaleString()}</CardDescription>
                    </div>
                  </div>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                     <div className="text-2xl font-bold">₹{goal.currentAmount.toLocaleString()}</div>
                     <div className="text-sm text-muted-foreground">{Math.round(progress)}% reached</div>
                  </div>
                  <Progress value={progress} className="h-3" style={{ color: goal.color }} />
               </CardContent>
               <CardFooter className="bg-muted/50 border-t py-3">
                  <p className="text-xs text-muted-foreground">
                    Remaining: <span className="font-medium text-foreground">₹{(goal.targetAmount - goal.currentAmount).toLocaleString()}</span>
                  </p>
               </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SavingsGoals;
