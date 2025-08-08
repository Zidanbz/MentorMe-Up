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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Eye, FileUp, MoreVertical, Trash, Loader2 } from 'lucide-react';
import type { Document } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
  } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';
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
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { getDocuments, addDocument, deleteDocument } from '@/services/documentService';

const documentSchema = z.object({
    category: z.enum(['Legal', 'Finance', 'Operations', 'Reports']),
    file: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList)).refine(files => files?.length > 0, 'File is required.'),
});

type DocumentFormData = z.infer<typeof documentSchema>;


const categories: Document['category'][] = ['Legal', 'Finance', 'Operations', 'Reports'];

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const { toast } = useToast();

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await getDocuments();
            setDocuments(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch documents.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleAddDocument = async (data: DocumentFormData) => {
        try {
            await addDocument(data.file[0], data.category);
            toast({ title: 'Success', description: 'Document uploaded successfully.' });
            fetchDocuments();
            setIsUploadDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload document.' });
        }
    };

    const handleDeleteDocument = async (doc: Document) => {
        try {
            await deleteDocument(doc);
            toast({ title: 'Success', description: 'Document deleted successfully.' });
            fetchDocuments();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete document.' });
        }
    };

    return (
        <AppLayout>
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Documents</h1>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Document
                </Button>
            </div>
            
            <UploadDocumentDialog 
                isOpen={isUploadDialogOpen} 
                setIsOpen={setIsUploadDialogOpen} 
                onAddDocument={handleAddDocument}
            />

            <Tabs defaultValue="all">
            <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map(cat => <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>)}
            </TabsList>

            <TabsContent value="all">
                <DocumentTable documents={documents} onDelete={handleDeleteDocument} loading={loading} />
            </TabsContent>
            {categories.map(cat => (
                <TabsContent key={cat} value={cat}>
                    <DocumentTable documents={documents.filter(d => d.category === cat)} onDelete={handleDeleteDocument} loading={loading} />
                </TabsContent>
            ))}
            </Tabs>
        </div>
        </AppLayout>
    );
}

type UploadDocumentDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onAddDocument: (data: DocumentFormData) => void;
}

function UploadDocumentDialog({ isOpen, setIsOpen, onAddDocument }: UploadDocumentDialogProps) {
    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<DocumentFormData>({
        resolver: zodResolver(documentSchema),
        defaultValues: { category: 'Finance' }
    });

    const onSubmit = (data: DocumentFormData) => {
        onAddDocument(data);
    };

    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Upload New Document</DialogTitle>
                        <DialogDescription>
                            Select a file and categorize it for your workspace.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="file" className="text-right">File</Label>
                            <Input id="file" type="file" className="col-span-3" {...register('file')} />
                             {errors.file && <p className="col-span-4 text-right text-red-500 text-xs">{errors.file.message?.toString()}</p>}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.category && <p className="col-span-4 text-right text-red-500 text-xs">{errors.category.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DocumentTable({ documents, onDelete, loading }: { documents: Document[], onDelete: (doc: Document) => void, loading: boolean }) {
    
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                            </TableCell>
                        </TableRow>
                    ) : documents.length === 0 ? (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">No documents found.</TableCell>
                        </TableRow>
                    ) : (
                        documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">{doc.name}</TableCell>
                                <TableCell>{doc.type}</TableCell>
                                <TableCell>{doc.category}</TableCell>
                                <TableCell>{format(doc.createdAt.toDate(), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4" />Preview
                                                </a>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <a href={doc.url} download={doc.name} className="flex items-center cursor-pointer">
                                                    <Download className="mr-2 h-4 w-4" />Download
                                                </a>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DeleteDocumentMenuItem doc={doc} onDelete={onDelete} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}

function DeleteDocumentMenuItem({ doc, onDelete }: { doc: Document, onDelete: (doc: Document) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-red-600">
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the document from storage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(doc)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


// A wrapper card for the table to provide a consistent border/shadow
function Card({children}: {children: React.ReactNode}) {
    return <div className="rounded-lg border bg-card text-card-foreground shadow-sm">{children}</div>
}
