import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area,
  ReferenceArea
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { TrendingUp, Zap, Lightbulb, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip as TooltipWrapper,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';

const Analytics: React.FC = () => {
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [distributionMonth, setDistributionMonth] = React.useState(new Date().getMonth());
  const [trendChunk, setTrendChunk] = React.useState(0); // 0: Jan-Apr, 1: May-Aug, 2: Sep-Dec

  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const recurring = useLiveQuery(() => db.recurringExpenses.toArray()) || [];

  if (!categories || categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const now = new Date();
  const monthsInYear = Array.from({ length: 12 }, (_, i) => new Date(selectedYear, i, 1));

  // Overall Cash Flow Trend (Sliding 6 months window based on current year)
  const trendData = monthsInYear.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const spent = expenses
      .filter(e => isWithinInterval(e.date, { start: monthStart, end: monthEnd }) && categories.find(c => c.id === e.categoryId)?.type !== 'inflow')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const income = expenses
      .filter(e => isWithinInterval(e.date, { start: monthStart, end: monthEnd }) && categories.find(c => c.id === e.categoryId)?.type === 'inflow')
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { 
      name: format(month, 'MMM'), 
      Spent: spent,
      Income: income
    };
  });

  // Category Wise Expenditure (Based on distributionMonth)
  const distMonthStart = startOfMonth(new Date(selectedYear, distributionMonth, 1));
  const distMonthEnd = endOfMonth(distMonthStart);
  const distMonthExpenses = expenses.filter(e => 
    isWithinInterval(e.date, { start: distMonthStart, end: distMonthEnd }) && 
    categories.find(c => c.id === e.categoryId)?.type !== 'inflow'
  );

  const rawCategoryData = categories
    .filter(c => c.type !== 'inflow')
    .map(cat => {
      const amount = distMonthExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { name: cat.name, value: amount, color: cat.color };
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const categoryData = rawCategoryData.length > 7
    ? [
        ...rawCategoryData.slice(0, 6),
        {
          name: 'Other',
          value: rawCategoryData.slice(6).reduce((acc, curr) => acc + curr.value, 0),
          color: '#94a3b8'
        }
      ]
    : rawCategoryData;

  // Category Trends (Sliding 4 months window)
  const chunkMonths = Array.from({ length: 4 }, (_, i) => new Date(selectedYear, trendChunk * 4 + i, 1));

  const sortedCategories = categories
    .filter(c => c.type !== 'inflow')
    .map(cat => {
      const total = expenses
        .filter(e => e.categoryId === cat.id && e.date.getFullYear() === selectedYear)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { id: cat.id, name: cat.name, color: cat.color, total };
    })
    .sort((a, b) => b.total - a.total);

  const hasOthers = sortedCategories.length > 6;
  const visibleCategories = hasOthers 
    ? [
        ...sortedCategories.slice(0, 6),
        { id: 'others', name: 'Others', color: '#94a3b8', total: sortedCategories.slice(6).reduce((acc, c) => acc + c.total, 0) }
      ]
    : sortedCategories;

  const categoryTrendData = chunkMonths.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const data: any = { name: format(month, 'MMM') };
    
    visibleCategories.forEach(cat => {
      if (cat.id === 'others') {
        const othersIds = sortedCategories.slice(6).map(c => c.id);
        data[cat.name] = expenses
          .filter(e => othersIds.includes(e.categoryId) && isWithinInterval(e.date, { start: monthStart, end: monthEnd }))
          .reduce((acc, curr) => acc + curr.amount, 0);
      } else {
        data[cat.name] = expenses
          .filter(e => e.categoryId === cat.id && isWithinInterval(e.date, { start: monthStart, end: monthEnd }))
          .reduce((acc, curr) => acc + curr.amount, 0);
      }
    });
    return data;
  });



  // Insights Logic
  const calculateInsights = () => {
    const insights = [];
    const totalSpent = distMonthExpenses.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    
    // Highest Spending Category
    const highest = [...categoryData].sort((a, b) => b.value - a.value)[0];
    if (highest) {
      insights.push({
        title: `High Spending in ${highest.name}`,
        description: `You've spent ₹${highest.value.toLocaleString()} on ${highest.name} this month, which is ${((highest.value / (totalSpent || 1)) * 100).toFixed(0)}% of your total budget.`,
        icon: <TrendingUp className="text-destructive" />,
        type: 'warning'
      });
    }

    // Savings Opportunity
    if (recurring.length > 0) {
      const recurringTotal = recurring.reduce((acc, curr) => acc + curr.amount, 0);
      insights.push({
        title: "Subscription Cleanup",
        description: `We noticed ${recurring.length} recurring payment${recurring.length > 1 ? 's' : ''} in your account. Consider reviewing and canceling unused subscriptions to save ₹${recurringTotal.toLocaleString()}/month.`,
        icon: <Lightbulb className="text-primary" />,
        type: 'info'
      });
    }

    // Positive Trend
    const lastMonthSpent = expenses
      .filter(e => {
        const cat = categories.find(c => c.id === e.categoryId);
        return isWithinInterval(e.date, { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }) && cat?.type !== 'inflow';
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    if (totalSpent < lastMonthSpent) {
      insights.push({
        title: "Budget Master!",
        description: `You've spent ₹${(lastMonthSpent - totalSpent).toLocaleString()} less than last month. Keep it up!`,
        icon: <Zap className="text-green-500" />,
        type: 'success'
      });
    }

    return insights;
  };

  const insights = calculateInsights();

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground font-medium">Deep dive into your financial habits and trends.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-xl w-fit">
           {[2024, 2025, 2026].map(year => (
             <button
               key={year}
               onClick={() => setSelectedYear(year)}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                 selectedYear === year ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
               )}
             >
               {year}
             </button>
           ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overall Trend */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Cash Flow Trend</CardTitle>
            <CardDescription>Income vs Expenses for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
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
                <Area type="monotone" dataKey="Income" stroke="var(--primary)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                <Area type="monotone" dataKey="Spent" stroke="var(--destructive)" fillOpacity={1} fill="url(#colorSpent)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Expenditure */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Expenditure for {format(distMonthStart, 'MMMM yyyy')}</CardDescription>
            </div>
          </CardHeader>
          <div className="px-6 flex gap-1 mb-2">
             {Array.from({ length: 12 }).map((_, i) => (
               <button
                 key={i}
                 onClick={() => setDistributionMonth(i)}
                 className={cn(
                   "w-2 h-2 rounded-full transition-all",
                   distributionMonth === i ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                 )}
               />
             ))}
          </div>
          <CardContent className="h-[300px] flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <TooltipProvider>
                <TooltipWrapper>
                  <TooltipTrigger>
                    <div className="w-full h-20 px-4">
                      <Button 
                        disabled 
                        variant="outline" 
                        className="w-full h-full border-dashed rounded-2xl flex flex-col gap-1 hover:bg-muted/20 cursor-default opacity-50"
                      >
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-bold">No Data</span>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>No expense records found for this period.</p>
                  </TooltipContent>
                </TooltipWrapper>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Month-wise Category Spending */}
      <Card className="border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Category Trends</CardTitle>
            <CardDescription>Monthly category performance in {selectedYear}</CardDescription>
          </div>
          <div className="flex gap-2 bg-muted p-1 rounded-lg">
             {[0, 1, 2].map(chunk => (
               <button
                 key={chunk}
                 onClick={() => setTrendChunk(chunk)}
                 className={cn(
                   "w-3 h-3 rounded-full transition-all",
                   trendChunk === chunk ? "bg-primary scale-110 shadow-sm shadow-primary/20" : "bg-muted-foreground/30"
                 )}
               />
             ))}
          </div>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              {categoryTrendData.map((d) => (
                <ReferenceArea 
                  key={d.name} 
                  x1={d.name} 
                  x2={d.name} 
                  stroke="var(--border)" 
                  strokeOpacity={0.25}
                  strokeWidth={1}
                  fill="var(--muted)" 
                  fillOpacity={0.04} 
                />
              ))}
              <Tooltip 
                 cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                 contentStyle={{ 
                   borderRadius: '16px', 
                   border: 'none', 
                   boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                   backgroundColor: 'var(--card)',
                   color: 'var(--foreground)'
                 }}
                 itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
              />
              <Legend iconType="circle" />
              {visibleCategories.map((cat) => (
                <Bar key={cat.id} dataKey={cat.name} fill={cat.color} radius={[4, 4, 0, 0]} barSize={20} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="text-primary fill-primary" />
          Smart Insights
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {insights.map((insight) => (
            <Card key={insight.title} className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-all">
               <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                     <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        {insight.icon}
                     </div>
                  </div>
                  <h3 className="font-bold mb-1">{insight.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
               </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
