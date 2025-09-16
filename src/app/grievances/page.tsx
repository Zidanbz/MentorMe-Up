'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Grievance, GrievanceClientData } from '@/types';
import { getGrievances, addGrievance, markGrievancesAsSeen, deleteGrievances } from '@/services/grievanceService';
import { Timestamp } from 'firebase/firestore';

import { format } from 'date-fns';

const grievanceSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  file: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList).optional()),
});

type GrievanceFormData = z.infer<typeof grievanceSchema>;

function AddGrievanceDialog({ workspaceId, onGrievanceAdded, userProfile }: { workspaceId: string, onGrievanceAdded: () => void, userProfile: any }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceSchema),
  });

  const handleAddGrievance = async (data: GrievanceFormData) => {
    if (!user || !user.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a grievance.' });
      return;
    }
    try {
      let fileData: GrievanceClientData['file'] | undefined = undefined;
      if (data.file && data.file.length > 0) {
        const file = data.file[0];
        const arrayBuffer = await file.arrayBuffer();
        fileData = {
          buffer: Buffer.from(arrayBuffer).toString('base64'),
          name: file.name,
          type: file.type,
        };
      }

      const grievanceData: GrievanceClientData = {
        subject: data.subject,
        description: data.description,
        type: userProfile.workspaceId, // Set type based on workspace
        file: fileData,
      };

      await addGrievance(workspaceId, grievanceData, { userId: user.uid, userEmail: user.email ?? '', userRole: userProfile.role });
      toast({ title: 'Success', description: 'Your grievance has been submitted.' });
      setIsDialogOpen(false);
      reset();
      onGrievanceAdded();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit grievance.';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Buat Pengaduan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(handleAddGrievance)}>
          <DialogHeader>
            <DialogTitle>Buat Pengaduan Baru</DialogTitle>
            <DialogDescription>
              Pengaduan Anda akan dikirim secara rahasia kepada CEO.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">Subjek</Label>
              <Input id="subject" {...register('subject')} className="col-span-3" disabled={isSubmitting} />
              {errors.subject && <p className="col-span-4 text-right text-red-500 text-xs">{errors.subject.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">Deskripsi</Label>
              <Textarea id="description" {...register('description')} className="col-span-3" disabled={isSubmitting}/>
              {errors.description && <p className="col-span-4 text-right text-red-500 text-xs">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">Lampiran</Label>
              <Input id="file" type="file" {...register('file')} className="col-span-3" disabled={isSubmitting} />
              {errors.file && <p className="col-span-4 text-right text-red-500 text-xs">{errors.file.message?.toString()}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastVisible, setLastVisible] = useState<any | null>(null);
  const [pageSize] = useState(5);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [pageStack, setPageStack] = useState<any[]>([]);

  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const isCEO = userProfile?.role === 'CEO';

  const fetchGrievances = useCallback(async (workspaceId: string, startAfterDoc?: any, isNextPage = true) => {
    console.log('fetchGrievances called with:', { workspaceId, user, userProfile });
    if (!user?.uid || !user?.email || !userProfile?.role) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('fetchGrievances params:', { workspaceId, userRole: userProfile.role });
      const data = await getGrievances(workspaceId, {
        userId: user.uid,
        userEmail: user.email,
        userRole: userProfile.role,
      });

      console.log('Grievances fetched:', data);
      console.log('Grievances count:', data.length);

      if (!data || !Array.isArray(data)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid data received for grievances.' });
        setGrievances([]);
        setIsNextDisabled(true);
        return;
      }

      if (data.length === 0) {
        setGrievances([]);
        setIsNextDisabled(true);
        setLoading(false);
        return;
      }

      data.sort((a, b) => {
        // createdAt is already a Date object, no need to call toDate()
        const aDate = a.createdAt instanceof Date ? a.createdAt : (a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt));
        const bDate = b.createdAt instanceof Date ? b.createdAt : (b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt));
        return bDate.getTime() - aDate.getTime();
      });
      setGrievances(data);
      setLastVisible(null);
      setPageStack([]);
      setIsPrevDisabled(true);
      setIsNextDisabled(data.length < pageSize);
    } catch (error) {
      console.error('Error fetching grievances:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch grievances.' });
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  }, [toast, pageSize, user, userProfile]);




  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const deleteSelected = async () => {
    if (!userProfile?.workspaceId) return;
    if (selectedIds.length === 0) {
      toast({ title: 'No selection', description: 'Please select grievances to delete.' });
      return;
    }
    try {
      await deleteGrievances(userProfile.workspaceId, selectedIds);
      toast({ title: 'Success', description: `${selectedIds.length} grievances deleted.` });
      setSelectedIds([]);
      fetchGrievances(userProfile.workspaceId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete grievances.' });
    }
  };

  useEffect(() => {
    console.log('useEffect triggered with:', { userProfile, user, isCEO, authLoading });
    if (userProfile?.workspaceId && user) {
      const workspaceId = userProfile.workspaceId;
      console.log('Calling fetchGrievances with workspaceId:', workspaceId);
      fetchGrievances(workspaceId);
      if (isCEO) {
        markGrievancesAsSeen(workspaceId);
      }
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, userProfile, isCEO, authLoading, fetchGrievances]);



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
          <h1 className="text-3xl font-bold">Pengaduan Anggota</h1>
          {/* Hide grievances feature as it is under development */}
          {userProfile?.workspaceId && (
            <>
              {!isCEO && (
                <AddGrievanceDialog
                  workspaceId={userProfile.workspaceId}
                  onGrievanceAdded={() => fetchGrievances(userProfile.workspaceId)}
                  userProfile={userProfile}
                />
              )}
            </>
          )}

          <Button variant="destructive" onClick={deleteSelected} disabled={selectedIds.length === 0}>
            Delete Selected
          </Button>
        </div>

        {/* Hide grievances list and messages */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : grievances.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mt-2">
              {isCEO ? 'Belum ada pengaduan yang diajukan oleh anggota tim.' : 'Anda belum mengajukan pengaduan.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {grievances.map((g) => (
                <Card key={g.id}>
                  <CardHeader className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(g.id)}
                      onChange={() => toggleSelect(g.id)}
                      className="h-4 w-4 self-start"
                    />
                    <div className="flex-1">
                      <CardTitle>{g.subject}</CardTitle>
                      <CardDescription>
                        Submitted on {format(g.createdAt instanceof Date ? g.createdAt : (g.createdAt instanceof Timestamp ? g.createdAt.toDate() : new Date(g.createdAt)), 'MMM d, yyyy, HH:mm')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap text-left">{g.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div></div>
                    {g.fileUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={g.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Lampiran
                        </a>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={() => {
                // Pagination logic here if needed
              }} disabled={isPrevDisabled}>
                Previous
              </Button>
              <Button onClick={() => {
                // Pagination logic here if needed
              }} disabled={isNextDisabled}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
