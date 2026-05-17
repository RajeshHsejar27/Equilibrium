import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, type Expense } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCategoryName } from '@/lib/utils';

const expenseSchema = z.object({
  title: z.string().min(2, "Title is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  categoryId: z.string().min(1, "Category is required"),
  note: z.string().optional(),
});



interface ExpenseFormProps {
  onSuccess?: () => void;
  initialData?: Partial<Expense>;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, initialData }) => {
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const recurring = useLiveQuery(() => db.recurringExpenses.toArray()) || [];
  
  const form = useForm<any>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: initialData?.title || '',
      amount: initialData?.amount || 0,
      date: initialData?.date ? initialData.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      categoryId: initialData?.categoryId || '',
      note: initialData?.note || '',
    },
  });

  const onSubmit = async (values: any) => {
    try {
      const expenseData = {
        ...values,
        date: new Date(values.date),
      };

      if (initialData?.id) {
        await db.expenses.update(initialData.id, expenseData);
        toast.success("Expense updated successfully");
      } else {
        await db.expenses.add(expenseData);
        toast.success("Expense added successfully");
      }
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save expense");
    }
  };

  const watchTitle = form.watch("title");
  const watchCategoryId = form.watch("categoryId");
  const selectedCategory = categories.find(c => c.id === watchCategoryId);
  
  // Smart Suggestions: Previous records + Recurring
  const historySuggestions = useLiveQuery(
    () => db.expenses
      .where("title")
      .startsWithIgnoreCase(watchTitle)
      .limit(5)
      .toArray(),
    [watchTitle]
  ) || [];

  const recurringSuggestions = recurring.filter(r => 
    r.title.toLowerCase().startsWith(watchTitle.toLowerCase())
  );

  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }: { field: any }) => (
            <FormItem className="relative">
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder={selectedCategory?.type === 'inflow' ? "Where did you earn this?" : "What did you spend on?"} 
                  {...field} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoComplete="off"
                />
              </FormControl>
              {showSuggestions && watchTitle && (historySuggestions.length > 0 || recurringSuggestions.length > 0) && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-xl shadow-2xl overflow-hidden">
                   <ScrollArea className="max-h-[200px]">
                      <div className="p-2 space-y-1">
                        {recurringSuggestions.length > 0 && (
                          <>
                            <p className="text-[10px] font-black uppercase text-primary px-2 py-1">Recurring Suggestions</p>
                            {recurringSuggestions.map((s, idx) => (
                              <div 
                                key={`rec-${idx}`} 
                                className="text-sm p-2 hover:bg-muted cursor-pointer rounded-lg flex items-center justify-between"
                                onClick={() => {
                                  form.setValue("title", s.title);
                                  form.setValue("amount", s.amount);
                                  form.setValue("categoryId", s.categoryId);
                                  setShowSuggestions(false);
                                }}
                              >
                                <span>{s.title}</span>
                                <span className="text-xs font-bold text-primary">₹{s.amount}</span>
                              </div>
                            ))}
                          </>
                        )}
                        {historySuggestions.length > 0 && (
                          <>
                            <p className="text-[10px] font-black uppercase text-muted-foreground px-2 py-1">History</p>
                            {historySuggestions.map((s, idx) => (
                              <div 
                                key={`hist-${idx}`} 
                                className="text-sm p-2 hover:bg-muted cursor-pointer rounded-lg flex items-center justify-between"
                                onClick={() => {
                                  form.setValue("title", s.title);
                                  form.setValue("amount", s.amount);
                                  form.setValue("categoryId", s.categoryId);
                                  setShowSuggestions(false);
                                }}
                              >
                                <span>{s.title}</span>
                                <span className="text-xs text-muted-foreground">₹{s.amount}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                   </ScrollArea>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input type="number" step="0.01" className="pl-7" placeholder="0.00" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-muted/50 border-none">
                    <SelectValue placeholder="Select category">
                      {field.value ? getCategoryName(categories, field.value) : "Select category"}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/20 h-11">
          {initialData?.id ? 'Update' : 'Save'} Transaction
        </Button>
      </form>
    </Form>
  );
};
