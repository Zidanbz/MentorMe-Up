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
  DialogFooter,
  DialogClose,
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
  } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const transactionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['Income', 'Expense']),
  amount: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive({ message: 'Amount must be positive' })
  ),
  category: z.enum(['Salary', 'Marketing', 'Investment', 'Operations', 'Other']),
  description: z.string().min(1, { message: 'Description is required' }),
  date: z.date(),
});

const transactionCategories: Transaction['category'][] = ['Salary', 'Marketing', 'Investment', 'Operations', 'Other'];

export default function CashFlowPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'Income', amount: 5000000, category: 'Salary', description: 'Monthly Salary', date: new Date(2023, 5, 1) },
    { id: '2', type: 'Expense', amount: 2500000, category: 'Marketing', description: 'Social Media Campaign', date: new Date(2023, 5, 5) },
    { id: '3', type: 'Income', amount: 1200000, category: 'Investment', description: 'Stock Dividend', date: new Date(2023, 5, 10) },
    { id: '4', type: 'Expense', amount: 300000, category: 'Operations', description: 'Office Supplies', date: new Date(2023, 5, 12) },
    { id: '5', type: 'Expense', amount: 750000, category: 'Operations', description: 'Cloud Server Hosting', date: new Date(2023, 5, 15) },
  ]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();

  const handleAddTransaction = (data: Transaction) => {
    setTransactions(prev => [...prev, { ...data, id: Date.now().toString() }]);
    toast({ title: 'Success', description: 'Transaction added successfully.' });
    setIsDialogOpen(false);
  };

  const handleUpdateTransaction = (data: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === data.id ? data : t));
    toast({ title: 'Success', description: 'Transaction updated successfully.' });
    setEditingTransaction(null);
    setIsDialogOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Success', description: 'Transaction deleted successfully.' });
  };
  
  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingTransaction(null);
    setIsDialogOpen(true);
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cash Flow</h1>
          <Button onClick={openNewDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
          </Button>
        </div>

        <TransactionDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            editingTransaction={editingTransaction}
        />

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TransactionTable transactions={transactions} onEdit={openEditDialog} onDelete={handleDeleteTransaction} />
          </TabsContent>
          <TabsContent value="income">
            <TransactionTable transactions={transactions.filter(t => t.type === 'Income')} onEdit={openEditDialog} onDelete={handleDeleteTransaction} />
          </TabsContent>
          <TabsContent value="expense">
            <TransactionTable transactions={transactions.filter(t => t.type === 'Expense')} onEdit={openEditDialog} onDelete={handleDeleteTransaction} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

type TransactionDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onAddTransaction: (data: Transaction) => void;
    onUpdateTransaction: (data: Transaction) => void;
    editingTransaction: Transaction | null;
};

function TransactionDialog({ isOpen, setIsOpen, onAddTransaction, onUpdateTransaction, editingTransaction }: TransactionDialogProps) {
    const isEditMode = !!editingTransaction;
    const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<Transaction>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'Expense',
            date: new Date(),
        }
    });

    React.useEffect(() => {
        if (isEditMode) {
            reset(editingTransaction);
        } else {
            reset({
                type: 'Expense',
                amount: 0,
                category: 'Other',
                description: '',
                date: new Date(),
            });
        }
    }, [editingTransaction, isOpen, reset, isEditMode]);


    const onSubmit = (data: Transaction) => {
        if (isEditMode) {
            onUpdateTransaction({ ...editingTransaction, ...data });
        } else {
            onAddTransaction(data);
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit' : 'Add New'} Transaction</DialogTitle>
                        <DialogDescription>
                            Record a new income or expense. Use your voice for the description!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Income">Income</SelectItem>
                                            <SelectItem value="Expense">Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <Input id="amount" type="number" placeholder="Rp 0" className="col-span-3" {...register('amount')} />
                            {errors.amount && <p className="col-span-4 text-red-500 text-xs text-right">{errors.amount.message}</p>}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {transactionCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Date</Label>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "col-span-3 justify-start text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">Description</Label>
                            <div className="col-span-3">
                                <Textarea id="description" placeholder="Transaction details..." {...register('description')} />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                <VoiceInput onTranscription={(text) => setValue('description', text)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">{isEditMode ? 'Save Changes' : 'Save Transaction'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function TransactionTable({ transactions, onEdit, onDelete }: { transactions: Transaction[], onEdit: (transaction: Transaction) => void, onDelete: (id: string) => void }) {
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
                    {transactions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">No transactions found.</TableCell>
                        </TableRow>
                    )}
                    {transactions.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.description}</TableCell>
                            <TableCell>
                                <span className={cn(
                                    "rounded-full px-2 py-1 text-xs font-semibold",
                                    t.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                )}>
                                {t.type}
                                </span>
                            </TableCell>
                            <TableCell>{t.category}</TableCell>
                            <TableCell>{format(t.date, 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right font-mono">{t.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(t)}>Edit</DropdownMenuItem>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the transaction.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => onDelete(t.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
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

    