import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from '@/layouts/MainLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Expenses from '@/pages/Expenses';
import Savings from '@/pages/Savings';
import Analytics from '@/pages/Analytics';
import Budgets from '@/pages/Budgets';
import Categories from '@/pages/Categories';
import Recurring from '@/pages/Recurring';
import ImportExport from '@/pages/ImportExport';
import Settings from '@/pages/Settings';

import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="equilibrium-theme">
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="savings" element={<Savings />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="categories" element={<Categories />} />
              <Route path="recurring" element={<Recurring />} />
              <Route path="import-export" element={<ImportExport />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
