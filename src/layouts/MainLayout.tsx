import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  BarChart3, 
  Settings, 
  FolderTree,
  Wallet,
  Repeat,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Receipt, label: 'Expenses', to: '/expenses' },
  { icon: PiggyBank, label: 'Savings', to: '/savings' },
  { icon: BarChart3, label: 'Analytics', to: '/analytics' },
  { icon: Wallet, label: 'Budgets', to: '/budgets' },
  { icon: FolderTree, label: 'Categories', to: '/categories' },
  { icon: Repeat, label: 'Recurring', to: '/recurring' },
  { icon: Download, label: 'Import/Export', to: '/import-export' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

const MainLayout: React.FC = () => {
  const profile = useLiveQuery(() => db.profile.get(1));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card text-card-foreground">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">E</div>
          <h1 className="text-xl font-bold tracking-tight">Equilibrium</h1>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <item.icon size={18} className={cn("transition-transform group-hover:scale-110")} />
                <span className="font-semibold text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t bg-muted/20">
           <div className="flex items-center gap-3 px-3 py-2">
             <Avatar className="h-9 w-9 border-2 border-primary/10">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
             </Avatar>
             <div className="overflow-hidden">
               <p className="text-sm font-bold truncate">{profile?.name || 'User'}</p>
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Premium Plan</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 h-16 border-b bg-card/80 backdrop-blur-md text-card-foreground sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-xs shadow-lg shadow-primary/10">E</div>
            <h1 className="text-lg font-black tracking-tighter">EQUILIBRIUM</h1>
          </div>
          <NavLink to="/settings">
            <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
            </Avatar>
          </NavLink>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="container max-w-6xl mx-auto p-4 md:p-8 pb-32 md:pb-8">
             <motion.div
               key={window.location.pathname}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.3, ease: "easeOut" }}
             >
                <Outlet />
             </motion.div>
          </div>
        </div>

        {/* Mobile Bottom Navigation & Popover */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Soft blur backdrop overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-background/25 backdrop-blur-[2px] z-40 md:hidden"
              />
              
              {/* Framer Motion Popover Menu */}
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.9, y: 15, x: "-50%" }}
                animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, scale: 0.9, y: 15, x: "-50%" }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className="fixed bottom-24 left-1/2 w-[280px] bg-card/95 backdrop-blur-xl border border-border/80 rounded-3xl p-4 shadow-2xl z-50 md:hidden flex flex-col gap-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Wallet, label: 'Budgets', to: '/budgets' },
                    { icon: Repeat, label: 'Recurring', to: '/recurring' },
                    { icon: Download, label: 'Import/Export', to: '/import-export' },
                    { icon: Settings, label: 'Settings', to: '/settings' },
                  ].map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex flex-col items-center justify-center p-3 rounded-2xl transition-all gap-1.5",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground bg-muted/40"
                        )
                      }
                    >
                      <item.icon size={20} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-card/90 backdrop-blur-lg border-t flex items-center justify-around px-2 z-40 rounded-t-3xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)] border-muted-foreground/10">
          {/* Left Tabs */}
          <div className="flex w-2/5 justify-around items-center h-full">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
              { icon: Receipt, label: 'Expenses', to: '/expenses' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16",
                    isActive ? "text-primary scale-110" : "text-muted-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      "p-2 rounded-2xl transition-all",
                      isActive ? "bg-primary/10" : ""
                    )}>
                      <item.icon size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Elevated Circular Center Menu Button */}
          <div className="relative -top-4 flex justify-center items-center z-50">
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "h-14 w-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-all duration-300 bg-primary text-primary-foreground",
                isMenuOpen ? "scale-90 opacity-90" : "hover:scale-105 active:scale-95"
              )}
            >
              <MoreHorizontal size={24} className={cn("transition-transform duration-300", isMenuOpen ? "rotate-90" : "")} />
            </Button>
          </div>

          {/* Right Tabs */}
          <div className="flex w-2/5 justify-around items-center h-full">
            {[
              { icon: BarChart3, label: 'Analytics', to: '/analytics' },
              { icon: PiggyBank, label: 'Savings', to: '/savings' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16",
                    isActive ? "text-primary scale-110" : "text-muted-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      "p-2 rounded-2xl transition-all",
                      isActive ? "bg-primary/10" : ""
                    )}>
                      <item.icon size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </main>

      {/* Global Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Transaction</DialogTitle>
          </DialogHeader>
          <ExpenseForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainLayout;
