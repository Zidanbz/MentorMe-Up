'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Banknote, FileText, Users, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { RecentActivity, Transaction, Document } from '@/types';
import { useState, useEffect } from 'react';
import { getTransactions } from '@/services/transactionService';
import { getDocuments } from '@/services/documentService';
import { format, subMonths, getMonth, getYear } from 'date-fns';

const chartConfig = {
  income: {
    label: 'Income',
    color: 'hsl(var(--chart-1))',
  },
  expense: {
    label: 'Expense',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const recentActivities: RecentActivity[] = [
    { id: '1', user: 'CEO', avatar: 'https://placehold.co/40x40.png', action: 'Uploaded "Q2 Financials.pdf"', timestamp: '2 hours ago' },
    { id: '2', user: 'CFO', avatar: 'https://placehold.co/40x40.png', action: 'Added an expense of Rp 2,500,000 for Marketing', timestamp: '5 hours ago' },
    { id: '3', user: 'COO', avatar: 'https://placehold.co/40x40.png', action: 'Downloaded "Operational_Plan_v3.docx"', timestamp: '1 day ago' },
    { id: '4', user: 'CTO', avatar: 'https://placehold.co/40x40.png', action: 'Uploaded "Tech_Roadmap.pdf"', timestamp: '2 days ago' },
];

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transactionsData, documentsData] = await Promise.all([
          getTransactions(),
          getDocuments(),
        ]);
        setTransactions(transactionsData);
        setDocuments(documentsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
  }

  // Calculate total income and expenses for the current cash balance
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, item) => acc + item.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, item) => acc + item.amount, 0);
  const currentBalance = totalIncome - totalExpense;

  const processChartData = () => {
    const monthlyData: { [key: string]: { month: string, income: number, expense: number } } = {};
    const sixMonthsAgo = subMonths(new Date(), 5);
    
    for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyData[monthKey] = { month: format(monthDate, 'MMMM'), income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const transactionDate = t.date.toDate();
      if (transactionDate >= sixMonthsAgo) {
        const monthKey = format(transactionDate, 'yyyy-MM');
        if (monthlyData[monthKey]) {
            if (t.type === 'Income') {
                monthlyData[monthKey].income += t.amount;
            } else {
                monthlyData[monthKey].expense += t.amount;
            }
        }
      }
    });

    return Object.values(monthlyData).reverse();
  };

  const chartData = processChartData();

  if (loading) {
    return (
        <AppLayout>
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Current Cash Balance"
            value={formatCurrency(currentBalance)}
            icon={Banknote}
            details="+20.1% from last month"
            change="up"
          />
          <DashboardCard
            title="Total Documents"
            value={documents.length.toString()}
            icon={FileText}
            details="+2 this month"
            change="up"
          />
          <DashboardCard
            title="Monthly Transactions"
            value={transactions.length.toString()}
            icon={Activity}
            details={`${transactions.filter(t => t.type === 'Income').length} income, ${transactions.filter(t => t.type === 'Expense').length} expenses`}
          />
          <DashboardCard
            title="Active Users"
            value="8"
            icon={Users}
            details="CEO, CFO, COO, CTO..."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => `Rp${Number(value) / 1000000}jt`} />
                    <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(Number(value))} />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentActivities.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
                    {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={activity.avatar} alt={activity.user} data-ai-hint="person portrait" />
                                <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{activity.action}</p>
                                <p className="text-xs text-muted-foreground">{activity.user} - {activity.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  details: string;
  change?: 'up' | 'down';
}

function DashboardCard({ title, value, icon: Icon, details, change }: DashboardCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="flex items-center text-xs text-muted-foreground">
            {change === 'up' && <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />}
            {change === 'down' && <ArrowDownRight className="h-4 w-4 mr-1 text-red-500" />}
            {details}
        </p>
      </CardContent>
    </Card>
  );
}
