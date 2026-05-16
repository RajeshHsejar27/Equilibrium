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
import { toast } from 'sonner';

const Categories: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#3b82f6');

  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const handleSave = async () => {
    if (!catName) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await db.categories.update(editingCategory.id, { name: catName, color: catColor });
        toast.success("Category updated");
      } else {
        await db.categories.add({ 
          id: crypto.randomUUID(), 
          name: catName, 
          color: catColor 
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Organize your expenses with custom categories.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2">
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
                 <label className="text-sm font-medium">Name</label>
                 <Input 
                   placeholder="e.g. Health, Travel" 
                   value={catName}
                   onChange={(e) => setCatName(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium">Color</label>
                 <div className="flex gap-2">
                   <Input 
                     type="color" 
                     className="w-12 h-10 p-1"
                     value={catColor}
                     onChange={(e) => setCatColor(e.target.value)}
                   />
                   <Input 
                     value={catColor}
                     onChange={(e) => setCatColor(e.target.value)}
                   />
                 </div>
               </div>
               <Button className="w-full" onClick={handleSave}>
                 {editingCategory ? 'Update' : 'Create'} Category
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: cat.color }}>
             <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full" style={{ backgroundColor: cat.color }} />
                   <CardTitle className="text-lg">{cat.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                   <Button variant="ghost" size="icon" onClick={() => {
                     setEditingCategory(cat);
                     setCatName(cat.name);
                     setCatColor(cat.color);
                     setIsDialogOpen(true);
                   }}>
                     <Edit2 size={14} />
                   </Button>
                   <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat.id)}>
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
