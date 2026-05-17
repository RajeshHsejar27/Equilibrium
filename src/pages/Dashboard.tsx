import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight,
  Receipt
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfDay, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const timeframe = useStore((state) => state.timeframe);
  const setTimeframe = useStore((state) => state.setTimeframe);

  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const savingsGoals = useLiveQuery(() => db.savingsGoals.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get(1));

  if (!categories || categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  const timeframeStart = timeframe === 'month' ? currentMonthStart : sixMonthsAgo;
  const timeframeEnd = currentMonthEnd;

  // Filtered data for timeframe
  const filteredExpenses = expenses.filter(e => 
    isWithinInterval(e.date, { start: timeframeStart, end: timeframeEnd })
  );

  const periodExpenses = filteredExpenses.filter(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    return cat?.type !== 'inflow';
  });
  
  const periodIncome = filteredExpenses.filter(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    return cat?.type === 'inflow';
  });

  const totalExpenses = periodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = periodIncome.reduce((acc, curr) => acc + curr.amount, 0);

  // Comparison for the card percentages (always month vs month)
  const currentMonthExpensesTotal = expenses
    .filter(e => isWithinInterval(e.date, { start: currentMonthStart, end: currentMonthEnd }))
    .filter(e => categories.find(c => c.id === e.categoryId)?.type !== 'inflow')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const lastMonthExpensesTotal = expenses
    .filter(e => isWithinInterval(e.date, { start: lastMonthStart, end: lastMonthEnd }))
    .filter(e => categories.find(c => c.id === e.categoryId)?.type !== 'inflow')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expenseChange = lastMonthExpensesTotal > 0 
    ? ((currentMonthExpensesTotal - lastMonthExpensesTotal) / lastMonthExpensesTotal) * 100 
    : 0;

  // Graph Data
  const getGraphData = () => {
    if (timeframe === 'month') {
      return eachDayOfInterval({ start: currentMonthStart, end: now }).map(day => {
        const amount = expenses
          .filter(e => {
            const cat = categories.find(c => c.id === e.categoryId);
            return startOfDay(e.date).getTime() === startOfDay(day).getTime() && cat?.type !== 'inflow';
          })
          .reduce((acc, curr) => acc + curr.amount, 0);
        return { name: format(day, 'dd MMM'), amount };
      });
    } else {
      return eachMonthOfInterval({ start: subMonths(now, 5), end: now }).map(month => {
        const amount = expenses
          .filter(e => {
            const cat = categories.find(c => c.id === e.categoryId);
            return isWithinInterval(e.date, { start: startOfMonth(month), end: endOfMonth(month) }) && cat?.type !== 'inflow';
          })
          .reduce((acc, curr) => acc + curr.amount, 0);
        return { name: format(month, 'MMM'), amount };
      });
    }
  };

  const chartData = getGraphData();

  // Category Data for pie chart
  const categoryData = categories
    .filter(c => c.type !== 'inflow')
    .map(cat => {
      const amount = periodExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      return { name: cat.name, value: amount, color: cat.color, percentage };
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground">Premium tracking for your personal growth.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
           <Button 
             variant={timeframe === 'month' ? 'default' : 'ghost'} 
             size="sm" 
             onClick={() => setTimeframe('month')}
           >
             This Month
           </Button>
           <Button 
             variant={timeframe === '6months' ? 'default' : 'ghost'} 
             size="sm" 
             onClick={() => setTimeframe('6months')}
           >
             Last 6 Months
           </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
            <p className="text-xs mt-1 flex items-center gap-1">
              <span className={cn("font-medium", expenseChange > 0 ? "text-destructive" : "text-green-500")}>
                {expenseChange > 0 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
                {Math.abs(expenseChange).toFixed(1)}%
              </span> 
              <span className="text-muted-foreground">vs last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalIncome.toLocaleString()}</div>
            <p className="text-xs mt-1 text-muted-foreground">Collected this month</p>
          </CardContent>
        </Card>

         <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Savings Progress</CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0).toLocaleString()}</div>
            <div className="mt-3 space-y-1">
               <Progress value={(savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0) / (settings?.totalSavings || 1)) * 100} className="h-1.5" />
               <div className="flex justify-between text-[10px] text-muted-foreground">
                 <span>Progress</span>
                 <span>Target: ₹{(settings?.totalSavings || 0).toLocaleString()}</span>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Cash Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalIncome - totalExpenses).toLocaleString()}</div>
            <p className="text-xs mt-1 text-muted-foreground">Available to save or spend</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4 bg-card/50 backdrop-blur-sm border-none shadow-md">
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
            <CardDescription>
              {timeframe === 'month' ? `Daily trend for ${format(now, 'MMMM yyyy')}` : 'Monthly trend for last 6 months'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} 
                  interval={timeframe === 'month' ? 4 : 0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} 
                  tickFormatter={(value) => `₹${value >= 1000 ? value/1000 + 'k' : value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Pie */}
        <Card className="lg:col-span-3 bg-card/50 backdrop-blur-sm border-none shadow-md">
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)'
                    }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black">₹{totalExpenses.toLocaleString()}</span>
                 <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">Total Spent</span>
              </div>
            </div>
            <div className="w-full mt-4 space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
               {categoryData.map((item) => (
                 <div key={item.name} className="flex items-center justify-between group">
                   <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                     <span className="text-xs font-medium group-hover:text-primary transition-colors">{item.name}</span>
                   </div>
                   <div className="text-xs font-bold tabular-nums">
                     ₹{item.value.toLocaleString()} <span className="text-muted-foreground font-normal ml-1">({item.percentage.toFixed(0)}%)</span>
                   </div>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Expenses Table */}
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8" onClick={() => navigate('/expenses')}>View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5).map((expense) => {
                const cat = categories.find(c => c.id === expense.categoryId);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}>
                         <Receipt size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{expense.title}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          {cat ? `${cat.name} • ` : ''}{format(expense.date, 'MMM dd')}
                        </p>
                      </div>
                    </div>
                    <div className={cn("font-black tabular-nums", cat?.type === 'inflow' ? "text-green-500" : "text-foreground")}>
                      {cat?.type === 'inflow' ? '+' : '-'}₹{expense.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h2 className="text-lg font-bold tracking-tight">Active Savings</h2>
             <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={() => navigate('/savings')}>Manage</Button>
          </div>
          <div className="grid gap-4">
            {savingsGoals.slice(0, 2).map(goal => (
              <Card key={goal.id} className="shadow-md border-none overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
                 <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: goal.color }} />
                      {goal.title}
                    </CardTitle>
                    <CardDescription>₹{goal.currentAmount.toLocaleString()} of ₹{goal.targetAmount.toLocaleString()}</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}% Reached</span>
                       <span className="text-[10px] font-bold text-primary uppercase">₹{(goal.targetAmount - goal.currentAmount).toLocaleString()} Left</span>
                    </div>
                    <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-2" />
                 </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
