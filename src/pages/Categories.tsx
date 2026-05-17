import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Category } from '@/lib/db';
import { 
  Card, 
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Categories: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#3b82f6');
  const [catType, setCatType] = useState<'inflow' | 'outflow'>('outflow');

  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const handleSave = async () => {
    if (!catName) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await db.categories.update(editingCategory.id, { name: catName, color: catColor, type: catType });
        toast.success("Category updated");
      } else {
        await db.categories.add({ 
          id: crypto.randomUUID(), 
          name: catName, 
          color: catColor,
          type: catType
        });
        toast.success("Category added");
      }
      resetForm();
    } catch (error) {
      toast.error("Failed to save category");
    }
  };

  const resetForm = () => {
    setCatName('');
    setCatColor('#3b82f6');
    setCatType('outflow');
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (id === '6') {
      toast.error("Default category cannot be deleted");
      return;
    }
    if (confirm("Deleting this category will not delete expenses in it, but they will lose their category association. Proceed?")) {
      await db.categories.delete(id);
      toast.success("Category deleted");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground font-medium">Organize your expenses with custom categories.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2 font-bold h-11 px-6 shadow-lg shadow-primary/20">
              <Plus size={18} />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Name</label>
                 <Input 
                   placeholder="e.g. Health, Travel" 
                   value={catName}
                   onChange={(e) => setCatName(e.target.value)}
                   className="h-11 bg-muted/50 border-none"
                 />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Category Type</label>
                  <Select onValueChange={(v: any) => setCatType(v)} value={catType}>
                    <SelectTrigger className="h-11 bg-muted/50 border-none">
                      <SelectValue>
                        {catType === 'inflow' ? "Cash Inflow (Income)" : "Cash Outflow (Expense)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outflow">Cash Outflow (Expense)</SelectItem>
                      <SelectItem value="inflow">Cash Inflow (Income)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Color</label>
                 <div className="flex gap-2">
                   <Input 
                     type="color" 
                     className="w-12 h-11 p-1 bg-muted/50 border-none rounded-lg"
                     value={catColor}
                     onChange={(e) => setCatColor(e.target.value)}
                   />
                   <Input 
                     value={catColor}
                     onChange={(e) => setCatColor(e.target.value)}
                     className="h-11 bg-muted/50 border-none"
                   />
                 </div>
               </div>
               <Button className="w-full h-11 font-bold shadow-lg mt-2" onClick={handleSave}>
                 {editingCategory ? 'Update' : 'Create'} Category
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="overflow-hidden border-none shadow-lg group hover:shadow-xl transition-all">
             <CardHeader className="flex flex-row items-center justify-between py-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: cat.color }}>
                       <div className="w-4 h-4 rounded-full bg-white/20" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{cat.name}</CardTitle>
                      <div className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mt-1",
                        cat.type === 'inflow' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {cat.type || 'outflow'}
                      </div>
                    </div>
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
                      setEditingCategory(cat);
                      setCatName(cat.name);
                      setCatColor(cat.color);
                      setCatType(cat.type || 'outflow');
                      setIsDialogOpen(true);
                    }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleDelete(cat.id)}>
                      <Trash2 size={14} />
                    </Button>
                 </div>
             </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Categories;
