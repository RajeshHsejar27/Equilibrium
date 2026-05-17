import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Category } from "./db"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCategoryName = (categories: Category[], id: string): string => {
  const cat = categories.find(c => c.id === id);
  return cat ? cat.name : 'Uncategorized';
};
