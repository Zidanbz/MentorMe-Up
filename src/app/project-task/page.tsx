'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getProjects, addTask, updateTask, deleteTask } from '@/services/projectService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Loader2, MoreVertical, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

const taskSchema = z.object({
  name: z.string().min(1, { message: 'Task name is required' }),
  description: z.string().optional(),
  dueDate: z.date().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function ProjectTaskPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();

  const fetchProjects = useCallback(async (workspaceId: string) => {
    setLoading(true);
    try {
      const data = await getProjects(workspaceId);
      setProjects(data);
      console.log('ProjectTaskPage: projects fetched:', data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch projects.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const workspaceId = userProfile?.workspaceId || localStorage.getItem('workspaceId');
    console.log('ProjectTaskPage: workspaceId used for fetchProjects:', workspaceId);
    if (workspaceId) {
      fetchProjects(workspaceId);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [userProfile, authLoading, fetchProjects]);

  const openNewTaskDialog = (projectId: string, milestoneId: string) => {
    setSelectedProjectId(projectId);
    setSelectedMilestoneId(milestoneId);
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const openEditTaskDialog = (projectId: string, milestoneId: string, task: any) => {
    setSelectedProjectId(projectId);
    setSelectedMilestoneId(milestoneId);
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleAddTask = async (data: TaskFormData) => {
    if (!selectedProjectId || !selectedMilestoneId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Project or milestone not selected.' });
      return;
    }
    const workspaceId = userProfile?.workspaceId || localStorage.getItem('workspaceId');
    if (!workspaceId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workspace not found. Please log out and log in again.' });
      return;
    }
    try {
      await addTask(workspaceId, selectedProjectId, selectedMilestoneId, data);
      await fetchProjects(workspaceId);
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add task.' });
    }
  };

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!selectedProjectId || !selectedMilestoneId || !editingTask?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Project, milestone, or task not selected.' });
      return;
    }
    const workspaceId = userProfile?.workspaceId || localStorage.getItem('workspaceId');
    if (!workspaceId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workspace not found. Please log out and log in again.' });
      return;
    }
    try {
      await updateTask(workspaceId, selectedProjectId, selectedMilestoneId, editingTask.id, data);
      await fetchProjects(workspaceId);
      setEditingTask(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task.' });
    }
  };

  const handleDeleteTask = async (projectId: string, milestoneId: string, taskId: string) => {
    const workspaceId = userProfile?.workspaceId || localStorage.getItem('workspaceId');
    if (!workspaceId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workspace not found. Please log out and log in again.' });
      return;
    }
    setDeletingTaskId(taskId);
    try {
      await deleteTask(workspaceId, projectId, milestoneId, taskId);
      await fetchProjects(workspaceId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete task.' });
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (authLoading) {
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
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Project & Task</h1>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="border rounded p-4 mb-6 bg-white shadow">
              <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                project.milestones && project.milestones.length > 0 ? (
                project.milestones.map((milestone: any) => (
                  <div key={milestone.id} className="mb-4">
                    <h3 className="text-lg font-medium mb-1">{milestone.name}</h3>
                    {milestone.tasks && milestone.tasks.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {milestone.tasks.map((task: any) => (
                            <TableRow key={task.id}>
                              <TableCell>{task.name}</TableCell>
                              <TableCell>{task.description || '-'}</TableCell>
                              <TableCell>{task.dueDate ? (typeof task.dueDate.toDate === 'function' ? format(task.dueDate.toDate(), 'MMM d, yyyy') : format(new Date(task.dueDate), 'MMM d, yyyy')) : '-'}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={deletingTaskId === task.id}>
                                      {deletingTaskId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditTaskDialog(project.id, milestone.id, task)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteTask(project.id, milestone.id, task.id)}>Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="italic text-sm text-muted-foreground">No tasks found.</p>
                    )}
                    <Button size="sm" className="mt-2" onClick={() => openNewTaskDialog(project.id, milestone.id)}>
                      <PlusCircle className="mr-1 h-4 w-4" />
                      Add Task
                    </Button>
                  </div>
                ))
              ) : (
                <p className="italic text-sm text-muted-foreground">No milestones found.</p>
              )}
            </div>
          ))
        )}

        <TaskDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          editingTask={editingTask}
        />
      </div>
    </AppLayout>
  );
}

type TaskDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddTask: (data: TaskFormData) => void;
  onUpdateTask: (data: TaskFormData) => void;
  editingTask: any;
};

function TaskDialog({ isOpen, setIsOpen, onAddTask, onUpdateTask, editingTask }: TaskDialogProps) {
  const isEditMode = !!editingTask;
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingTask) {
        reset({
          ...editingTask,
          dueDate: editingTask.dueDate ? (typeof editingTask.dueDate.toDate === 'function' ? editingTask.dueDate.toDate() : new Date(editingTask.dueDate)) : undefined,
        });
      } else {
        reset({
          name: '',
          description: '',
          dueDate: undefined,
        });
      }
    }
  }, [editingTask, isOpen, reset, isEditMode]);

  const onSubmit = (data: TaskFormData) => {
    if (isEditMode) {
      onUpdateTask(data);
    } else {
      onAddTask(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit' : 'Add New'} Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Task Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="col-span-4 text-right text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input id="description" {...register('description')} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">Due Date</Label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="date"
                    className="col-span-3"
                    {...field}
                    value={field.value ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
