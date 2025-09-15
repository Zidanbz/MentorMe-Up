'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getProjects, addTask, updateTask, deleteTask, addProject, addMilestone, deleteProject, deleteMilestone } from '@/services/projectService';
import { updateProjectTask } from '@/services/projectTaskService';
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

  // New states for checkbox modal
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completeTask, setCompleteTask] = useState<any | null>(null);
  const [completeProjectId, setCompleteProjectId] = useState<string | null>(null);
  const [completeMilestoneId, setCompleteMilestoneId] = useState<string | null>(null);
  const [completionIssues, setCompletionIssues] = useState('');
  const [completionDate, setCompletionDate] = useState<string>('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // New states for milestone dialog
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [milestoneProjectId, setMilestoneProjectId] = useState<string | null>(null);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

  // States for delete operations
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  const [isDeleteMilestoneDialogOpen, setIsDeleteMilestoneDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [milestoneToDelete, setMilestoneToDelete] = useState<any | null>(null);

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

  // New handlers for project dialog
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  const openNewProjectDialog = () => {
    setIsProjectDialogOpen(true);
  };

  const handleAddProject = async (projectName: string) => {
    const workspaceId = userProfile?.workspaceId || localStorage.getItem('workspaceId');
    if (!workspaceId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workspace not found. Please log out and log in again.' });
      return;
    }
    try {
      await addProject(workspaceId, { name: projectName });
      await fetchProjects(workspaceId);
      setIsProjectDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add project.' });
    }
  };

  const handleAddMilestone = async (milestoneName: string) => {
    if (!milestoneProjectId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Project not selected for milestone.' });
      return;
    }
    const workspaceId = userProfile?.workspaceId || localStorage.getItem('workspaceId');
    if (!workspaceId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workspace not found. Please log out and log in again.' });
      return;
    }
    setIsSubmittingMilestone(true);
    try {
      await addMilestone(workspaceId, milestoneProjectId, { name: milestoneName });
      await fetchProjects(workspaceId);
      setIsMilestoneDialogOpen(false);
      setNewMilestoneName('');
      setMilestoneProjectId(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add milestone.' });
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  const openDeleteProjectDialog = (project: any) => {
    setProjectToDelete(project);
    setIsDeleteProjectDialogOpen(true);
  };

  const openDeleteMilestoneDialog = (projectId: string, milestone: any) => {
    setMilestoneToDelete({ ...milestone, projectId });
    setIsDeleteMilestoneDialogOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    const workspaceId = userProfile?.workspaceId || localStorage.getItem('workspaceId');
    if (!workspaceId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workspace not found. Please log out and log in again.' });
      return;
    }
    setDeletingProjectId(projectId);
    try {
      await deleteProject(workspaceId, projectId);
      await fetchProjects(workspaceId);
      setIsDeleteProjectDialogOpen(false);
      setProjectToDelete(null);
      toast({ title: 'Success', description: 'Project deleted successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete project.' });
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleDeleteMilestone = async (projectId: string, milestoneId: string) => {
    const workspaceId = userProfile?.workspaceId || localStorage.getItem('workspaceId');
    if (!workspaceId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workspace not found. Please log out and log in again.' });
      return;
    }
    setDeletingMilestoneId(milestoneId);
    try {
      await deleteMilestone(workspaceId, projectId, milestoneId);
      await fetchProjects(workspaceId);
      setIsDeleteMilestoneDialogOpen(false);
      setMilestoneToDelete(null);
      toast({ title: 'Success', description: 'Milestone deleted successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete milestone.' });
    } finally {
      setDeletingMilestoneId(null);
    }
  };

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

  const onTaskCheckboxClick = async (projectId: string, milestoneId: string, task: any) => {
    const workspaceId = userProfile?.workspaceId || localStorage.getItem('workspaceId');
    if (!workspaceId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workspace not found. Please log out and log in again.' });
      return;
    }
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await updateProjectTask(workspaceId, projectId, milestoneId, task.id, { status: newStatus });
      await fetchProjects(workspaceId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task status.' });
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Project & Task</h1>
          <Button onClick={openNewProjectDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="border rounded p-4 mb-6 bg-white shadow">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">{project.name}</h2>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => {
                    setMilestoneProjectId(project.id);
                    setIsMilestoneDialogOpen(true);
                  }}>
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Add Milestone
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={deletingProjectId === project.id}>
                        {deletingProjectId === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDeleteProjectDialog(project)} className="text-red-600">
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {project.milestones && project.milestones.length > 0 ? (
                project.milestones.map((milestone: any) => (
                  <div key={milestone.id} className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-lg font-medium">{milestone.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={deletingMilestoneId === milestone.id}>
                            {deletingMilestoneId === milestone.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDeleteMilestoneDialog(project.id, milestone)} className="text-red-600">
                            Delete Milestone
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {milestone.tasks && milestone.tasks.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{/* Checkbox column */}</TableHead>
                            <TableHead>Task Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {milestone.tasks.map((task: any) => (
                            <TableRow key={task.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={task.status === 'Completed'}
                                  onChange={() => onTaskCheckboxClick(project.id, milestone.id, task)}
                                />
                              </TableCell>
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

        <ProjectDialog
          isOpen={isProjectDialogOpen}
          setIsOpen={setIsProjectDialogOpen}
          onAddProject={handleAddProject}
        />

        <MilestoneDialog
          isOpen={isMilestoneDialogOpen}
          setIsOpen={setIsMilestoneDialogOpen}
          onAddMilestone={handleAddMilestone}
          isSubmitting={isSubmittingMilestone}
        />

        <DeleteProjectDialog
          isOpen={isDeleteProjectDialogOpen}
          setIsOpen={setIsDeleteProjectDialogOpen}
          project={projectToDelete}
          onDelete={handleDeleteProject}
          isDeleting={!!deletingProjectId}
        />

        <DeleteMilestoneDialog
          isOpen={isDeleteMilestoneDialogOpen}
          setIsOpen={setIsDeleteMilestoneDialogOpen}
          milestone={milestoneToDelete}
          onDelete={handleDeleteMilestone}
          isDeleting={!!deletingMilestoneId}
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

type ProjectDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddProject: (projectName: string) => void;
};

function ProjectDialog({ isOpen, setIsOpen, onAddProject }: ProjectDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddProject(projectName.trim());
      setProjectName('');
      setIsOpen(false);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectName" className="text-right">Project Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="col-span-3"
                placeholder="Enter project name"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !projectName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type MilestoneDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddMilestone: (milestoneName: string) => void;
  isSubmitting: boolean;
};

function MilestoneDialog({ isOpen, setIsOpen, onAddMilestone, isSubmitting }: MilestoneDialogProps) {
  const [milestoneName, setMilestoneName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneName.trim()) return;
    try {
      await onAddMilestone(milestoneName.trim());
      setMilestoneName('');
      setIsOpen(false);
    } catch (error) {
      // Error handled in parent
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Milestone</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="milestoneName" className="text-right">Milestone Name</Label>
              <Input
                id="milestoneName"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                className="col-span-3"
                placeholder="Enter milestone name"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !milestoneName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteProjectDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  project: any;
  onDelete: (projectId: string) => void;
  isDeleting: boolean;
};

function DeleteProjectDialog({ isOpen, setIsOpen, project, onDelete, isDeleting }: DeleteProjectDialogProps) {
  const handleDelete = () => {
    onDelete(project.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to delete the project "{project?.name}"? This action cannot be undone.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isDeleting}>Cancel</Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DeleteMilestoneDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  milestone: any;
  onDelete: (projectId: string, milestoneId: string) => void;
  isDeleting: boolean;
};

function DeleteMilestoneDialog({ isOpen, setIsOpen, milestone, onDelete, isDeleting }: DeleteMilestoneDialogProps) {
  const handleDelete = () => {
    onDelete(milestone.projectId, milestone.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Delete Milestone</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to delete the milestone "{milestone?.name}"? This action cannot be undone.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isDeleting}>Cancel</Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Milestone'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
