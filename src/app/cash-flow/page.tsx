'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, MoreVertical, PlusCircle } from 'lucide-react';
import type { Transaction } from '@/types';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { VoiceInput } from '@/components/voice-input';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

const transactions: Transaction[] = [
    { id: '1', type: 'Income', amount: 5000, category: 'Salary', description: 'Monthly Salary', date: new Date(2023, 5, 1) },
    { id: '2', type: 'Expense', amount: 2500, category: 'Marketing', description: 'Social Media Campaign', date: new Date(2023, 5, 5) },
    { id: '3', type: 'Income', amount: 1200, category: 'Investment', description: 'Stock Dividend', date: new Date(2023, 5, 10) },
    { id: '4', type: 'Expense', amount: 300, category: 'Operations', description: 'Office Supplies', date: new Date(2023, 5, 12) },
    { id: '5', type: 'Expense', amount: 750, category: 'Operations', description: 'Cloud Server Hosting', date: new Date(2023, 5, 15) },
];

const transactionCategories: Transaction['category'][] = ['Salary', 'Marketing', 'Investment', 'Operations', 'Other'];

export default function CashFlowPage() {
  const [description, setDescription] = useState('');
  
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cash Flow</h1>
          <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Transaction
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                    <DialogDescription>
                        Record a new income or expense. Use your voice for the description!
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Amount</Label>
                        <Input id="amount" type="number" placeholder="$0.00" className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Category</Label>
                         <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {transactionCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[280px] justify-start text-left font-normal",
                                    !Date && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(new Date(), 'PPP')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">Description</Label>
                        <div className="col-span-3">
                          <Textarea id="description" placeholder="Transaction details..." value={description} onChange={e => setDescription(e.target.value)} />
                           <VoiceInput onTranscription={ (text) => setDescription(prev => prev ? `${prev} ${text}` : text) } />
                        </div>
                    </div>
                </div>
                <DialogHeader>
                    <Button type="submit">Save Transaction</Button>
                </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TransactionTable transactions={transactions} />
          </TabsContent>
          <TabsContent value="income">
            <TransactionTable transactions={transactions.filter(t => t.type === 'Income')} />
          </TabsContent>
          <TabsContent value="expense">
            <TransactionTable transactions={transactions.filter(t => t.type === 'Expense')} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function TransactionTable({ transactions }: { transactions: Transaction[] }) {
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                         <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.description}</TableCell>
                            <TableCell>
                                <span className={cn(
                                    "rounded-full px-2 py-1 text-xs",
                                    t.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                )}>
                                {t.type}
                                </span>
                            </TableCell>
                            <TableCell>{t.category}</TableCell>
                            <TableCell>{format(t.date, 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right font-mono">${t.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}

// A wrapper card for the table to provide a consistent border/shadow
function Card({children}: {children: React.ReactNode}) {
    return <div className="rounded-lg border bg-card text-card-foreground shadow-sm">{children}</div>
}
