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

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isCEO = user?.email === 'ceo@mentorme.com';

  useEffect(() => {
    const fetchGrievances = async () => {
      if (!user || !user.email) return;
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

    if (user && user.email) {
      fetchGrievances();
    }
  }, [user]);

  const handleAddGrievance = async (data: GrievanceFormData) => {
    if (!user || !user.email) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a grievance.' });
        return;
    }
    try {
        let fileData: GrievanceClientData['file'] = undefined;
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
        
        // Refetch grievances after submission
        const updatedGrievances = await getGrievances({ userId: user.uid, userEmail: user.email });
        setGrievances(updatedGrievances);
        
        setIsDialogOpen(false);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit grievance.';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };


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
          <AddGrievanceDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            onSubmit={handleAddGrievance}
          />
        </div>
        
        {grievances.length === 0 ? (
            <Card className="text-center py-12">
                <CardContent>
                    <h3 className="text-xl font-semibold">Tidak Ada Pengaduan</h3>
                    <p className="text-muted-foreground mt-2">
                        {isCEO ? "Belum ada pengaduan yang diajukan oleh anggota tim." : "Anda belum mengajukan pengaduan."}
                    </p>
                </CardContent>
            </Card>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {grievances.map(g => (
                    <Card key={g.id}>
                        <CardHeader>
                            <CardTitle>{g.subject}</CardTitle>
                            <CardDescription>
                                {isCEO && `From: ${g.userEmail} | `}
                                Submitted on {format(g.createdAt as Date, 'MMM d, yyyy, HH:mm')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{g.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                             <Badge variant={g.status === 'Open' ? 'destructive' : 'default'}>{g.status}</Badge>
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

function AddGrievanceDialog({ isOpen, setIsOpen, onSubmit }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onSubmit: (data: GrievanceFormData) => Promise<void> }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceSchema),
  });

  const handleFormSubmit = async (data: GrievanceFormData) => {
    await onSubmit(data);
  };
  
  useEffect(() => {
    if (!isOpen) {
        reset();
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Buat Pengaduan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle>Buat Pengaduan Baru</DialogTitle>
            <DialogDescription>
              Jelaskan masalah atau masukan Anda. CEO akan meninjau semua pengaduan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subjek</Label>
              <Input id="subject" {...register('subject')} />
              {errors.subject && <p className="text-red-500 text-xs">{errors.subject.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" {...register('description')} className="min-h-[120px]" />
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="file">Lampiran (Opsional)</Label>
                <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <Input id="file" type="file" {...register('file')} />
                </div>
                {errors.file && <p className="text-red-500 text-xs">{typeof errors.file.message === 'string' ? errors.file.message : 'Invalid file'}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Batal</Button>
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
