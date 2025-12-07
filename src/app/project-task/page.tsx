'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PlusCircle, Loader2, MoreVertical, Trash2, Edit, Calendar as CalendarIcon } from 'lucide-react';
import type { Project, Milestone, Task } from '@/types';
import { addProject, getProjects, addMilestone, addTask, updateTask, deleteTask, deleteMilestone, deleteProject } from '@/services/projectService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

// Schemas
const projectSchema = z.object({ name: z.string().min(1, "Project name is required") });
const milestoneSchema = z.object({ 
    name: z.string().min(1, "Milestone name is required"),
});
const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
});


export default function ProjectTaskPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const { userProfile, loading: authLoading } = useAuth();
  
  const fetchProjects = useCallback(async (workspaceId: string) => {
    setLoading(true);
    try {
      const fetchedProjects = await getProjects(workspaceId);
      setProjects(fetchedProjects);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch projects.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (userProfile?.workspaceId) {
        fetchProjects(userProfile.workspaceId);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [userProfile, authLoading, fetchProjects]);

  const handleAddProject = async (data: z.infer<typeof projectSchema>) => {
    if (!userProfile?.workspaceId) return false;
    try {
      await addProject(userProfile.workspaceId, { name: data.name });
      fetchProjects(userProfile.workspaceId);
      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add project.' });
      return false;
    }
  };

  const handleAddMilestone = async (projectId: string, data: z.infer<typeof milestoneSchema>) => {
    if (!userProfile?.workspaceId) return false;
    try {
      await addMilestone(userProfile.workspaceId, projectId, { name: data.name });
      fetchProjects(userProfile.workspaceId);
      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add milestone.' });
      return false;
    }
  };

  const handleAddTask = async (projectId: string, milestoneId: string, data: z.infer<typeof taskSchema>) => {
    if (!userProfile?.workspaceId) return false;
    try {
      await addTask(userProfile.workspaceId, projectId, milestoneId, data);
      fetchProjects(userProfile.workspaceId);
      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add task.' });
      return false;
    }
  };

  const handleUpdateTask = async (projectId: string, milestoneId: string, taskId: string, data: Partial<Task>) => {
    if (!userProfile?.workspaceId) return;
    try {
      await updateTask(userProfile.workspaceId, projectId, milestoneId, taskId, data);
      fetchProjects(userProfile.workspaceId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task.' });
    }
  };
  
  const handleDeleteTask = async (projectId: string, milestoneId: string, taskId: string) => {
    if (!userProfile?.workspaceId) return;
    setProcessingAction(`task-delete-${taskId}`);
    try {
      await deleteTask(userProfile.workspaceId, projectId, milestoneId, taskId);
      fetchProjects(userProfile.workspaceId);
      toast({ title: 'Success', description: 'Task deleted successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete task.' });
    } finally {
      setProcessingAction(null);
    }
  }

  const handleDeleteMilestone = async (projectId: string, milestoneId: string) => {
    if (!userProfile?.workspaceId) return;
    setProcessingAction(`milestone-delete-${milestoneId}`);
    try {
      await deleteMilestone(userProfile.workspaceId, projectId, milestoneId);
      fetchProjects(userProfile.workspaceId);
      toast({ title: 'Success', description: 'Milestone deleted successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete milestone.' });
    } finally {
      setProcessingAction(null);
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!userProfile?.workspaceId) return;
    setProcessingAction(`project-delete-${projectId}`);
    try {
      await deleteProject(userProfile.workspaceId, projectId);
      fetchProjects(userProfile.workspaceId);
      toast({ title: 'Success', description: 'Project deleted successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete project.' });
    } finally {
      setProcessingAction(null);
    }
  }

  if (authLoading) {
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects &amp; Tasks</h1>
          <FormDialog
            trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>}
            title="Add New Project"
            description="Create a new project to organize your milestones and tasks."
            schema={projectSchema}
            onSubmit={handleAddProject}
            fields={[{ name: 'name', label: 'Project Name', placeholder: 'e.g. Q3 Marketing Campaign' }]}
            defaultValues={{ name: '' }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 rounded-lg border bg-card text-card-foreground shadow-sm">
             <h3 className="text-xl font-semibold">No Projects Yet</h3>
             <p className="text-muted-foreground mt-2">Get started by creating your first project.</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {projects.map(project => (
              <ProjectItem
                key={project.id}
                project={project}
                onAddMilestone={(data) => handleAddMilestone(project.id, data)}
                onAddTask={(milestoneId, data) => handleAddTask(project.id, milestoneId, data)}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onDeleteMilestone={handleDeleteMilestone}
                onDeleteProject={() => handleDeleteProject(project.id)}
                processingAction={processingAction}
              />
            ))}
          </Accordion>
        )}
      </div>
    </AppLayout>
  );
}

// Project Components
function ProjectItem({ project, onAddMilestone, onAddTask, onUpdateTask, onDeleteTask, onDeleteMilestone, onDeleteProject, processingAction }: {
  project: Project,
  onAddMilestone: (data: z.infer<typeof milestoneSchema>) => Promise<boolean>,
  onAddTask: (milestoneId: string, data: z.infer<typeof taskSchema>) => Promise<boolean>,
  onUpdateTask: (projectId: string, milestoneId: string, taskId: string, data: Partial<Task>) => void,
  onDeleteTask: (projectId: string, milestoneId: string, taskId: string) => void,
  onDeleteMilestone: (projectId: string, milestoneId: string) => void,
  onDeleteProject: () => void,
  processingAction: string | null,
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{project.name}</CardTitle>
        <div className="flex items-center gap-2">
           <FormDialog
              trigger={<Button size="sm" variant="outline">Add Milestone</Button>}
              title="Add New Milestone"
              description={`Create a new milestone for the "${project.name}" project.`}
              schema={milestoneSchema}
              onSubmit={onAddMilestone}
              fields={[
                { name: 'name', label: 'Milestone Name', placeholder: 'e.g. Launch Week' },
              ]}
              defaultValues={{ name: '' }}
            />
          <ProjectActions onDelete={onDeleteProject} isDeleting={processingAction === `project-delete-${project.id}`} />
        </div>
      </CardHeader>
      <CardContent>
        {project.milestones && project.milestones.length > 0 ? (
           <Accordion type="multiple">
            {project.milestones.map(milestone => (
                <MilestoneItem
                    key={milestone.id}
                    projectId={project.id}
                    milestone={milestone}
                    onAddTask={(data) => onAddTask(milestone.id, data)}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onDelete={() => onDeleteMilestone(project.id, milestone.id)}
                    processingAction={processingAction}
                />
            ))}
           </Accordion>
        ) : (
            <p className="text-sm text-muted-foreground px-4 py-2">No milestones in this project yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

function ProjectActions({ onDelete, isDeleting }: { onDelete: () => void, isDeleting: boolean }) {
    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the project and all of its milestones and tasks.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


// Milestone Components
function MilestoneItem({ projectId, milestone, onAddTask, onUpdateTask, onDeleteTask, onDelete, processingAction }: {
  projectId: string,
  milestone: Milestone,
  onAddTask: (data: z.infer<typeof taskSchema>) => Promise<boolean>,
  onUpdateTask: (projectId: string, milestoneId: string, taskId: string, data: Partial<Task>) => void,
  onDeleteTask: (projectId: string, milestoneId: string, taskId: string) => void,
  onDelete: () => void,
  processingAction: string | null,
}) {
  const completedTasks = useMemo(() => milestone.tasks ? milestone.tasks.filter(t => t.completed).length : 0, [milestone.tasks]);
  const totalTasks = useMemo(() => milestone.tasks ? milestone.tasks.length : 0, [milestone.tasks]);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  return (
    <AccordionItem value={milestone.id}>
      <AccordionTrigger>
        <div className="flex-1 flex flex-col items-start text-left gap-1">
            <span className="font-semibold">{milestone.name}</span>
        </div>
        <div className="flex-1 flex items-center justify-end pr-4">
            <span className="text-sm text-muted-foreground">{completedTasks} / {totalTasks} tasks completed</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pl-4">
        <div className="flex items-center justify-between mb-2">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mr-4">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex items-center gap-2">
                <FormDialog
                    trigger={<Button size="sm" variant="outline">Add Task</Button>}
                    title="Add New Task"
                    description={`Create a new task for the "${milestone.name}" milestone.`}
                    schema={taskSchema}
                    onSubmit={onAddTask}
                    fields={[
                        { name: 'name', label: 'Task Name', placeholder: 'e.g. Design social media assets' },
                        { name: 'description', label: 'Description', placeholder: 'Details about the task...', type: 'textarea' },
                        { name: 'dueDate', label: 'Due Date', type: 'date' },
                    ]}
                    defaultValues={{ name: '', description: '', dueDate: undefined }}
                />
                <MilestoneActions 
                    onDelete={onDelete}
                    isDeleting={processingAction === `milestone-delete-${milestone.id}`}
                />
            </div>
        </div>
        <div className="space-y-2 mt-4">
            {milestone.tasks && milestone.tasks.map(task => (
                <TaskItem 
                    key={task.id} 
                    task={task} 
                    onUpdate={(data) => onUpdateTask(projectId, milestone.id, task.id, data)}
                    onDelete={() => onDeleteTask(projectId, milestone.id, task.id)}
                    isDeleting={processingAction === `task-delete-${task.id}`}
                />
            ))}
             {(!milestone.tasks || milestone.tasks.length === 0) && <p className="text-xs text-muted-foreground py-2">No tasks in this milestone yet.</p>}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function MilestoneActions({ onDelete, isDeleting }: { 
    onDelete: () => void, 
    isDeleting: boolean,
}) {
    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Milestone
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the milestone and all its tasks.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Task Components
function TaskItem({ task, onUpdate, onDelete, isDeleting }: { task: Task, onUpdate: (data: Partial<Task>) => void, onDelete: () => void, isDeleting: boolean }) {
    
    const dueDate = useMemo(() => {
        if (!task.dueDate) return null;
        // The dueDate can be a Firebase Timestamp or a regular Date object after being picked
        const date = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : task.dueDate;
        // Check if the date is valid before formatting
        if (date && !isNaN(date.getTime())) {
            return format(date, 'MMM d');
        }
        return null;
    }, [task.dueDate]);

    return (
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
            <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={(checked) => onUpdate({ completed: !!checked })} />
            <label htmlFor={`task-${task.id}`} className={cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground")}>
                {task.name}
            </label>
            {dueDate && (
                <span className="text-xs text-muted-foreground">
                    Due: {dueDate}
                </span>
            )}
            <TaskActions onDelete={onDelete} isDeleting={isDeleting} />
        </div>
    )
}

function TaskActions({ onDelete, isDeleting }: { onDelete: () => void, isDeleting: boolean }) {
    return (
        <AlertDialog>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete the task. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Generic Form Dialog
type FormDialogProps<T extends z.ZodObject<any, any>> = {
  trigger: React.ReactElement;
  title: string;
  description: string;
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<boolean>;
  fields: { name: keyof z.infer<T> & string, label: string, placeholder: string, type?: 'text' | 'textarea' | 'date' }[];
  defaultValues: z.infer<T>;
}

function FormDialog<T extends z.ZodObject<any, any>>({ trigger, title, description, schema, onSubmit, fields, defaultValues }: FormDialogProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleFormSubmit = async (data: z.infer<T>) => {
    // The data object from react-hook-form is valid according to the schema
    const success = await onSubmit(data);
    if (success) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
        reset(defaultValues);
    }
  }, [isOpen, reset, defaultValues]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {fields.map(field => (
                <div key={field.name} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={field.name} className="text-right">{field.label}</Label>
                    {field.type === 'textarea' ? (
                         <Textarea id={field.name} placeholder={field.placeholder} className="col-span-3" {...register(field.name)} />
                    ) : field.type === 'date' ? (
                        <Controller
                            name={field.name}
                            control={control}
                            render={({ field: controllerField }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("col-span-3 justify-start text-left font-normal", !controllerField.value && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {controllerField.value ? format(controllerField.value as Date, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={controllerField.value as Date} onSelect={controllerField.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                    ) : (
                        <Input id={field.name} placeholder={field.placeholder} className="col-span-3" {...register(field.name)} />
                    )}
                    {errors[field.name] && <p className="col-span-4 text-red-500 text-xs text-right">{errors[field.name]?.message?.toString()}</p>}
                </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
