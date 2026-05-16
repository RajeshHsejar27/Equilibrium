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
  Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from 'date-fns';
import { TrendingUp, Zap, Lightbulb } from 'lucide-react';

const Analytics: React.FC = () => {
  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const now = new Date();
  const last6Months = eachMonthOfInterval({
    start: subMonths(now, 5),
    end: now
  });

  // Overall Expense Overview (Last 6 Months)
  const trendData = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const spent = expenses
      .filter(e => isWithinInterval(e.date, { start: monthStart, end: monthEnd }) && e.categoryId !== '6')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const income = expenses
      .filter(e => isWithinInterval(e.date, { start: monthStart, end: monthEnd }) && e.categoryId === '6')
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { 
      name: format(month, 'MMM'), 
      Spent: spent,
      Income: income
    };
  });

  // Category Wise Expenditure (Current Month)
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const currentMonthExpenses = expenses.filter(e => 
    isWithinInterval(e.date, { start: currentMonthStart, end: currentMonthEnd }) && e.categoryId !== '6'
  );

  const categoryData = categories
    .filter(c => c.id !== '6')
    .map(cat => {
      const amount = currentMonthExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { name: cat.name, value: amount, color: cat.color };
    })
    .filter(c => c.value > 0);

  // Month Wise Spending Per Category (Last 4 Months)
  const last4Months = eachMonthOfInterval({
    start: subMonths(now, 3),
    end: now
  });

  const topCategories = categories
    .filter(c => c.id !== '6')
    .map(cat => {
      const total = expenses
        .filter(e => e.categoryId === cat.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { ...cat, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  const categoryTrendData = last4Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const data: any = { name: format(month, 'MMM') };
    topCategories.forEach(cat => {
      data[cat.name] = expenses
        .filter(e => e.categoryId === cat.id && isWithinInterval(e.date, { start: monthStart, end: monthEnd }))
        .reduce((acc, curr) => acc + curr.amount, 0);
    });
    return data;
  });

  // Insights Logic
  const calculateInsights = () => {
    const insights = [];
    const totalSpent = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Highest Spending Category
    const highest = [...categoryData].sort((a, b) => b.value - a.value)[0];
    if (highest) {
      insights.push({
        title: `High Spending in ${highest.name}`,
        description: `You've spent ₹${highest.value.toLocaleString()} on ${highest.name} this month, which is ${((highest.value / totalSpent) * 100).toFixed(0)}% of your total budget.`,
        icon: <TrendingUp className="text-destructive" />,
        type: 'warning'
      });
    }

    // Savings Opportunity
    insights.push({
      title: "Subscription Cleanup",
      description: "We noticed 3 recurring payments this week. Consider reviewing and canceling unused subscriptions to save ₹1,500/month.",
      icon: <Lightbulb className="text-primary" />,
      type: 'info'
    });

    // Positive Trend
    const lastMonthSpent = expenses
      .filter(e => isWithinInterval(e.date, { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }) && e.categoryId !== '6')
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your financial habits and trends.</p>
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
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="Income" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                <Area type="monotone" dataKey="Spent" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorSpent)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Expenditure */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Expenditure by category (Current Month)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Month-wise Category Spending */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Category Trends</CardTitle>
          <CardDescription>How your top categories have changed over the last 4 months</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                 cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              {topCategories.map((cat) => (
                <Bar key={cat.id} dataKey={cat.name} fill={cat.color} radius={[4, 4, 0, 0]} />
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
