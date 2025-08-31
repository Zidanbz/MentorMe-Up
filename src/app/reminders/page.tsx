'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { getProjects, addReminder, getReminders, deleteReminder } from '@/services/projectService';
import type { Milestone, Project, Task, Reminder, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type FlatTask = Task & {
    milestoneName: string;
    projectName: string;
    projectId: string;
    milestoneId: string;
}

const reminderSchema = z.object({
    message: z.string().min(10, "Message must be at least 10 characters."),
    targetRole: z.enum(['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CHRO', 'CDO', 'Member']),
    reminderDate: z.date({ required_error: "Reminder date is required." }),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

const roles: UserProfile['role'][] = ['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CHRO', 'CDO', 'Member'];

export default function RemindersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [tasks, setTasks] = useState<FlatTask[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const isAuthorized = useMemo(() => user?.email === 'ceo@mentorme.com' || user?.email === 'coo@mentorme.com', [user?.email]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsData, remindersData] = await Promise.all([
                getProjects(),
                getReminders(),
            ]);

            const allTasks: FlatTask[] = [];
            projectsData.forEach(project => {
                project.milestones.forEach(milestone => {
                    milestone.tasks.forEach(task => {
                        allTasks.push({
                            ...task,
                            milestoneName: milestone.name,
                            projectName: project.name,
                            projectId: project.id,
                            milestoneId: milestone.id,
                        });
                    });
                });
            });

            allTasks.sort((a,b) => {
                const dateA = a.dueDate ? (a.dueDate as Timestamp).toMillis() : Infinity;
                const dateB = b.dueDate ? (b.dueDate as Timestamp).toMillis() : -Infinity;
                return dateA - dateB;
            });
            
            setTasks(allTasks);
            setReminders(remindersData);

        } catch (error) {
            console.error("Failed to fetch reminders page data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (!authLoading) {
            if (!isAuthorized) {
                router.push('/dashboard');
            } else {
                fetchData();
            }
        }
    }, [authLoading, isAuthorized, router]);
    
    const handleAddReminder = async (data: ReminderFormData) => {
        try {
            await addReminder(data);
            toast({ title: "Success", description: "Reminder created successfully." });
            fetchData(); // Refresh data
            return true;
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create reminder.' });
            return false;
        }
    };

    const handleDeleteReminder = async (id: string) => {
        try {
            await deleteReminder(id);
            toast({ title: 'Success', description: 'Reminder deleted successfully.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete reminder.' });
        }
    }
    
    if (authLoading || loading || !isAuthorized) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Reminders</h1>
                    <AddReminderDialog onSubmit={handleAddReminder} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Scheduled Reminders</CardTitle>
                        <CardDescription>A list of all manually scheduled reminders. These will be sent on the specified date.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReminderTable reminders={reminders} onDelete={handleDeleteReminder} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>All Project Tasks</CardTitle>
                        <CardDescription>An overview of all tasks and their deadlines across all projects.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TaskTable tasks={tasks} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function ReminderTable({ reminders, onDelete }: { reminders: Reminder[], onDelete: (id: string) => void }) {
    if (reminders.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No scheduled reminders found. Click "Create Reminder" to add one.</p>;
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Target Role</TableHead>
                    <TableHead>Send Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reminders.map(r => (
                    <TableRow key={r.id}>
                        <TableCell className="max-w-sm truncate">{r.message}</TableCell>
                        <TableCell>{r.targetRole}</TableCell>
                        <TableCell>{format((r.reminderDate as Timestamp).toDate(), 'PPP')}</TableCell>
                        <TableCell>
                            <DeleteReminderButton id={r.id} onDelete={onDelete} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function TaskTable({ tasks }: { tasks: FlatTask[] }) {
     if (tasks.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No tasks found in any project.</p>;
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Due Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tasks.map(t => (
                    <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.milestoneName}</TableCell>
                        <TableCell>{t.projectName}</TableCell>
                        <TableCell>
                             <span className={cn(
                                "rounded-full px-2 py-1 text-xs font-semibold",
                                t.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            )}>
                                {t.completed ? 'Completed' : 'Pending'}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                           {t.dueDate ? format((t.dueDate as Timestamp).toDate(), 'PPP') : '-'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function AddReminderDialog({ onSubmit }: { onSubmit: (data: ReminderFormData) => Promise<boolean> }) {
    const [isOpen, setIsOpen] = useState(false);
    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<ReminderFormData>({
        resolver: zodResolver(reminderSchema),
    });

    const handleFormSubmit = async (data: ReminderFormData) => {
        const success = await onSubmit(data);
        if (success) {
            setIsOpen(false);
            reset();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Reminder
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Create New Reminder</DialogTitle>
                        <DialogDescription>
                            Schedule a custom reminder to be sent via WhatsApp to a specific role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" placeholder="e.g., Don't forget to submit the weekly report." {...register('message')} />
                            {errors.message && <p className="text-red-500 text-xs">{errors.message.message}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="targetRole">Target Role</Label>
                             <Controller
                                name="targetRole"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.targetRole && <p className="text-red-500 text-xs">{errors.targetRole.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="reminderDate">Reminder Date</Label>
                             <Controller
                                name="reminderDate"
                                control={control}
                                render={({ field }) => (
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
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
                             {errors.reminderDate && <p className="text-red-500 text-xs">{errors.reminderDate.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteReminderButton({ id, onDelete }: { id: string, onDelete: (id: string) => void}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(id);
        // no need to set isDeleting back to false as it will unmount
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
    