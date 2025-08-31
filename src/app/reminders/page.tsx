'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { getProjects } from '@/services/projectService';
import type { Milestone, Project } from '@/types';
import { format } from 'date-fns';
import { Loader2, Megaphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';

type ActiveReminder = {
    projectId: string;
    projectName: string;
    milestoneId: string;
    milestoneName: string;
    dueDate: Date;
}

export default function RemindersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [reminders, setReminders] = useState<ActiveReminder[]>([]);
    const [loading, setLoading] = useState(true);

    const isAuthorized = useMemo(() => user?.email === 'ceo@mentorme.com' || user?.email === 'coo@mentorme.com', [user?.email]);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthorized) {
                router.push('/dashboard');
            } else {
                fetchActiveReminders();
            }
        }
    }, [authLoading, isAuthorized, router]);

    const fetchActiveReminders = async () => {
        try {
            setLoading(true);
            const projects = await getProjects();
            const activeReminders: ActiveReminder[] = [];

            projects.forEach(project => {
                project.milestones.forEach(milestone => {
                    if (milestone.reminderEnabled && milestone.dueDate) {
                        activeReminders.push({
                            projectId: project.id,
                            projectName: project.name,
                            milestoneId: milestone.id,
                            milestoneName: milestone.name,
                            dueDate: (milestone.dueDate as Timestamp).toDate(),
                        });
                    }
                });
            });
            
            // Sort by due date, soonest first
            activeReminders.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

            setReminders(activeReminders);
        } catch (error) {
            console.error("Failed to fetch active reminders:", error);
        } finally {
            setLoading(false);
        }
    };
    
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
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Active Reminders</h1>
                <p className="text-muted-foreground">
                    This page lists all project milestones with active reminders. Notifications will be sent daily via WhatsApp starting 7 days before the due date.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Milestone Reminders</CardTitle>
                        <CardDescription>A total of {reminders.length} reminder(s) are currently active.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reminders.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Milestone</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead className="text-right">Due Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reminders.map(r => (
                                        <TableRow key={r.milestoneId}>
                                            <TableCell className="font-medium">{r.milestoneName}</TableCell>
                                            <TableCell>{r.projectName}</TableCell>
                                            <TableCell className="text-right">{format(r.dueDate, 'PPP')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                                <Megaphone className="h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No Active Reminders</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    To activate a reminder, go to the Project & Task page and click the bell icon on a milestone.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
