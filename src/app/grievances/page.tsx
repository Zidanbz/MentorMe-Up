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
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Loader2, Paperclip, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Grievance, GrievanceClientData } from '@/types';
import { getGrievances, addGrievance } from '@/services/grievanceService';
import { format } from 'date-fns';

const grievanceSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  file: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList).optional()),
});

type GrievanceFormData = z.infer<typeof grievanceSchema>;

function AddGrievanceDialog() {
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
        file: fileData,
      };

      await addGrievance(grievanceData, { userId: user.uid, userEmail: user.email });
      toast({ title: 'Success', description: 'Your grievance has been submitted.' });
      setIsDialogOpen(false);
      reset();
      // This will trigger a re-fetch in the parent component if it's listening
      window.dispatchEvent(new Event('grievanceSubmitted'));

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
              <Input id="subject" {...register('subject')} className="col-span-3" />
              {errors.subject && <p className="col-span-4 text-right text-red-500 text-xs">{errors.subject.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">Deskripsi</Label>
              <Textarea id="description" {...register('description')} className="col-span-3" />
              {errors.description && <p className="col-span-4 text-right text-red-500 text-xs">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">Lampiran</Label>
              <Input id="file" type="file" {...register('file')} className="col-span-3" />
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
  const { toast } = useToast();
  const { user } = useAuth();
  const isCEO = user?.email === 'ceo@mentorme.com';

  const fetchGrievances = async () => {
    if (!user?.uid || !user?.email) return;

    try {
      setLoading(true);
      const data = await getGrievances({ userId: user.uid, userEmail: user.email });
      setGrievances(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch grievances.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGrievances();
    }
     // Listen for custom event to re-fetch
     window.addEventListener('grievanceSubmitted', fetchGrievances);
     return () => {
       window.removeEventListener('grievanceSubmitted', fetchGrievances);
     };
  }, [user]);


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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pengaduan Anggota</h1>
           {!isCEO && <AddGrievanceDialog />}
        </div>
        
        {grievances.length === 0 && (
            <div className="text-center py-12">
                <p className="text-muted-foreground mt-2">
                    {isCEO ? "Belum ada pengaduan yang diajukan oleh anggota tim." : "Anda belum mengajukan pengaduan."}
                </p>
            </div>
        )}

        {grievances.length > 0 && (
            <div className="flex flex-col gap-4">
                {grievances.map(g => (
                    <Card key={g.id}>
                        <CardHeader>
                            <CardTitle>{g.subject}</CardTitle>
                            <CardDescription>
                                {isCEO && `From: ${g.userEmail} | `}
                                Submitted on {format(g.createdAt, 'MMM d, yyyy, HH:mm')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{g.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end items-center">
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
        )}

      </div>
    </AppLayout>
  );
}
