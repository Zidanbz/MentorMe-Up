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
import { Download, Eye, FileUp, MoreVertical, Trash, Loader2, Search, Trash2 } from 'lucide-react';
import type { Document } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
  } from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo, useCallback } from 'react';
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
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { getDocuments, addDocument, deleteDocument, deleteDocuments } from '@/services/documentService';
import { useAuth } from '@/hooks/useAuth';
import { Pagination } from '@/components/shared/Pagination';
import { Checkbox } from '@/components/ui/checkbox';


const documentSchema = z.object({
    category: z.enum(['Legal', 'Finance', 'Operations', 'Reports', 'HR', 'Product & Development', 'Marketing & Sales', 'Investor & Fundraising', 'Research & Insights', 'Template']),
    file: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList)).refine(files => files?.length > 0, 'File is required.'),
});

type DocumentFormData = z.infer<typeof documentSchema>;


const allCategories: Document['category'][] = ['Legal', 'Finance', 'Operations', 'Reports', 'HR', 'Product & Development', 'Marketing & Sales', 'Investor & Fundraising', 'Research & Insights', 'Template'];

const rolePermissions: Record<string, Document['category'][]> = {
    'CEO': ['Legal', 'Finance', 'Operations', 'Reports', 'HR', 'Product & Development', 'Marketing & Sales', 'Investor & Fundraising', 'Research & Insights', 'Template'],
    'CFO': ['Finance', 'Investor & Fundraising'],
    'COO': ['Operations', 'Legal'],
    'CTO': ['Product & Development'],
    'CDO': ['Research & Insights'],
    'CMO': ['Marketing & Sales'],
    'CHRO': ['HR'],
    'Member': [],
};


export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const { toast } = useToast();
    const { user, userProfile, loading: authLoading } = useAuth();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const itemsPerPage = 10;

    const userRole = userProfile?.role || 'Member';
    const userAllowedCategories = rolePermissions[userRole] || [];
    const canUpload = userAllowedCategories.length > 0;

    const fetchDocuments = useCallback(async (workspaceId: string) => {
        setLoading(true);
        try {
            const data = await getDocuments(workspaceId);
            setDocuments(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch documents.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (userProfile?.workspaceId) {
            fetchDocuments(userProfile.workspaceId);
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [userProfile, authLoading, fetchDocuments]);
    
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [activeTab, searchTerm]);

    const handleAddDocument = async (data: DocumentFormData) => {
        if (!userProfile?.workspaceId) return false;
        try {
            await addDocument(userProfile.workspaceId, data.file[0], data.category);
            toast({ title: 'Success', description: 'Document uploaded successfully.' });
            fetchDocuments(userProfile.workspaceId);
            setIsUploadDialogOpen(false);
            return true;
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload document.' });
            return false;
        }
    };

    const handleDeleteDocument = async (doc: Document) => {
        if (!userProfile?.workspaceId) return;
        setDeletingId(doc.id);
        try {
            await deleteDocument(userProfile.workspaceId, doc);
            toast({ title: 'Success', description: 'Document deleted successfully.' });
            fetchDocuments(userProfile.workspaceId);
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete document.' });
        } finally {
            setDeletingId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (!userProfile?.workspaceId) return;
        setIsBulkDeleting(true);
        try {
            const documentsToDelete = documents.filter(doc => selectedIds.includes(doc.id));
            await deleteDocuments(userProfile.workspaceId, documentsToDelete);
            toast({ title: 'Success', description: `${selectedIds.length} documents deleted.` });
            setSelectedIds([]);
            fetchDocuments(userProfile.workspaceId);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete selected documents.' });
        } finally {
            setIsBulkDeleting(false);
        }
    };
    
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesCategory = activeTab === 'all' || doc.category === activeTab;
            const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [documents, activeTab, searchTerm]);

    const paginatedDocuments = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDocuments.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDocuments, currentPage, itemsPerPage]);

     const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(paginatedDocuments.map(d => d.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id));
        }
    };
    
    if (authLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Documents</h1>
                <Button onClick={() => setIsUploadDialogOpen(true)} disabled={!canUpload} title={!canUpload ? 'Your role cannot upload documents' : ''}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Document
                </Button>
            </div>
            
            <UploadDocumentDialog 
                isOpen={isUploadDialogOpen} 
                setIsOpen={setIsUploadDialogOpen} 
                onAddDocument={handleAddDocument}
                allowedCategories={userAllowedCategories}
            />
            
             <div className="flex justify-between items-center gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search documents by name..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {selectedIds.length > 0 && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isBulkDeleting}>
                                {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete ({selectedIds.length})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete {selectedIds.length} document(s). This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                {allCategories.map(cat => (
                    <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                ))}
            </TabsList>
            
            <TabsContent value={activeTab} forceMount>
                 <DocumentTable 
                    documents={paginatedDocuments} 
                    onDelete={handleDeleteDocument} 
                    loading={loading}
                    userRole={userRole}
                    allowedCategories={userAllowedCategories} 
                    deletingId={deletingId}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                />
            </TabsContent>
            </Tabs>

             <Pagination
                currentPage={currentPage}
                totalItems={filteredDocuments.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />
        </div>
        </AppLayout>
    );
}

type UploadDocumentDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onAddDocument: (data: DocumentFormData) => Promise<boolean>;
    allowedCategories: Document['category'][];
}

function UploadDocumentDialog({ isOpen, setIsOpen, onAddDocument, allowedCategories }: UploadDocumentDialogProps) {
    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<DocumentFormData>({
        resolver: zodResolver(documentSchema),
        defaultValues: { category: allowedCategories[0] }
    });

    const onSubmit = async (data: DocumentFormData) => {
        const success = await onAddDocument(data);
        if (success) {
            reset();
            setIsOpen(false);
        }
    };

    useEffect(() => {
        if (isOpen && allowedCategories.length > 0) {
             reset({ category: allowedCategories[0], file: undefined });
        }
    }, [isOpen, reset, allowedCategories]);

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
                            <Input id="file" type="file" className="col-span-3" {...register('file')} disabled={isSubmitting} />
                             {errors.file && <p className="col-span-4 text-right text-red-500 text-xs">{errors.file.message?.toString()}</p>}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                     <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allowedCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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

function DocumentTable({ documents, onDelete, loading, userRole, allowedCategories, deletingId, selectedIds, onSelectAll, onSelectOne }: { 
    documents: Document[], 
    onDelete: (doc: Document) => void, 
    loading: boolean, 
    userRole: string,
    allowedCategories: Document['category'][], 
    deletingId: string | null,
    selectedIds: string[],
    onSelectAll: (checked: boolean) => void,
    onSelectOne: (id: string, checked: boolean) => void,
}) {
    
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                             <Checkbox
                                checked={selectedIds.length > 0 && selectedIds.length === documents.length && documents.length > 0}
                                onCheckedChange={(checked) => onSelectAll(!!checked)}
                                aria-label="Select all"
                                disabled={documents.length === 0}
                            />
                        </TableHead>
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
                            <TableCell colSpan={6} className="text-center h-24">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                            </TableCell>
                        </TableRow>
                    ) : documents.length === 0 ? (
                         <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">No documents found.</TableCell>
                        </TableRow>
                    ) : (
                        documents.map((doc) => {
                            const canDelete = allowedCategories.includes(doc.category) || userRole === 'CEO';
                            return (
                                <TableRow key={doc.id} data-state={selectedIds.includes(doc.id) && "selected"}>
                                    <TableCell>
                                         <Checkbox
                                            checked={selectedIds.includes(doc.id)}
                                            onCheckedChange={(checked) => onSelectOne(doc.id, !!checked)}
                                            aria-label="Select row"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{doc.name}</TableCell>
                                    <TableCell>{doc.type}</TableCell>
                                    <TableCell>{doc.category}</TableCell>
                                    <TableCell>{format(doc.createdAt.toDate(), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={deletingId === doc.id}>
                                                   {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
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
                                                {canDelete && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DeleteDocumentMenuItem doc={doc} onDelete={onDelete} />
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function DeleteDocumentMenuItem({ doc, onDelete }: { doc: Document, onDelete: (doc: Document) => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(doc);
    // No need to set isDeleting to false as the component will be unmounted.
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem 
            onSelect={(e) => e.preventDefault()}
            className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the document from storage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
