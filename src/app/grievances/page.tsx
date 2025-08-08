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

    if (user) {
      fetchGrievances();
    }
  }, [user, toast]);

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
