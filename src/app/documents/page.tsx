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
import { Download, Eye, FileUp, MoreVertical, Trash } from 'lucide-react';
import type { Document } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { useState } from 'react';
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

const documentSchema = z.object({
    name: z.string().min(1, 'File name is required'),
    category: z.enum(['Legal', 'Finance', 'Operations', 'Reports']),
    file: z.any().refine(files => files?.length === 1, 'File is required.'),
});

const initialDocuments: Document[] = [
    { id: '1', name: 'Q2 Financials.pdf', type: 'PDF', category: 'Finance', createdAt: new Date('2023-06-15'), url: '#' },
    { id: '2', name: 'MSA_ClientA.docx', type: 'Word', category: 'Legal', createdAt: new Date('2023-06-12'), url: '#' },
    { id: '3', name: 'Marketing_Budget.xlsx', type: 'Excel', category: 'Finance', createdAt: new Date('2023-06-10'), url: '#' },
    { id: '4', name: 'Ops_Checklist.pdf', type: 'PDF', category: 'Operations', createdAt: new Date('2023-06-08'), url: '#' },
    { id: '5', name: 'Annual_Report_2022.pdf', type: 'PDF', category: 'Reports', createdAt: new Date('2023-05-20'), url: '#' },
    { id: '6', name: 'NDA_Template.docx', type: 'Word', category: 'Legal', createdAt: new Date('2023-05-18'), url: '#' },
];

const categories: Document['category'][] = ['Legal', 'Finance', 'Operations', 'Reports'];
const getFileType = (fileName: string): Document['type'] => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'PDF';
    if (extension === 'docx' || extension === 'doc') return 'Word';
    if (extension === 'xlsx' || extension === 'xls') return 'Excel';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) return 'Image';
    return 'Other';
};


export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleAddDocument = (data: z.infer<typeof documentSchema>) => {
        const newDocument: Document = {
            id: Date.now().toString(),
            name: data.file[0].name,
            type: getFileType(data.file[0].name),
            category: data.category,
            createdAt: new Date(),
            url: URL.createObjectURL(data.file[0]),
        };
        setDocuments(prev => [newDocument, ...prev]);
        toast({ title: 'Success', description: 'Document uploaded successfully.' });
        setIsDialogOpen(false);
    };

    const handleDeleteDocument = (id: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        toast({ title: 'Success', description: 'Document deleted successfully.' });
    };

    return (
        <AppLayout>
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Documents</h1>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Document
                </Button>
            </div>
            
            <UploadDocumentDialog 
                isOpen={isDialogOpen} 
                setIsOpen={setIsDialogOpen} 
                onAddDocument={handleAddDocument}
            />

            <Tabs defaultValue="all">
            <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map(cat => <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>)}
            </TabsList>

            <TabsContent value="all">
                <DocumentTable documents={documents} onDelete={handleDeleteDocument} />
            </TabsContent>
            {categories.map(cat => (
                <TabsContent key={cat} value={cat}>
                    <DocumentTable documents={documents.filter(d => d.category === cat)} onDelete={handleDeleteDocument} />
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
    onAddDocument: (data: z.infer<typeof documentSchema>) => void;
}

function UploadDocumentDialog({ isOpen, setIsOpen, onAddDocument }: UploadDocumentDialogProps) {
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof documentSchema>>({
        resolver: zodResolver(documentSchema)
    });

    const onSubmit = (data: z.infer<typeof documentSchema>) => {
        onAddDocument(data);
        reset();
    };

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
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit">Upload</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DocumentTable({ documents, onDelete }: { documents: Document[], onDelete: (id: string) => void }) {
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
                    {documents.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">No documents found.</TableCell>
                        </TableRow>
                    )}
                    {documents.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.name}</TableCell>
                            <TableCell>{doc.type}</TableCell>
                            <TableCell>{doc.category}</TableCell>
                            <TableCell>{format(doc.createdAt, 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild><a href={doc.url} target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4" />Preview</a></DropdownMenuItem>
                                        <DropdownMenuItem asChild><a href={doc.url} download={doc.name}><Download className="mr-2 h-4 w-4" />Download</a></DropdownMenuItem>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}><Trash className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the document.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}

// A wrapper card for the table to provide a consistent border/shadow
function Card({children}: {children: React.ReactNode}) {
    return <div className="rounded-lg border bg-card text-card-foreground shadow-sm">{children}</div>
}

    