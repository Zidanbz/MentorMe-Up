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
  DialogTrigger,
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
import { Download, Eye, FileUp, MoreVertical } from 'lucide-react';
import type { Document } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

const documents: Document[] = [
    { id: '1', name: 'Q2 Financials.pdf', type: 'PDF', category: 'Finance', createdAt: '2023-06-15', url: '#' },
    { id: '2', name: 'MSA_ClientA.docx', type: 'Word', category: 'Legal', createdAt: '2023-06-12', url: '#' },
    { id: '3', name: 'Marketing_Budget.xlsx', type: 'Excel', category: 'Finance', createdAt: '2023-06-10', url: '#' },
    { id: '4', name: 'Ops_Checklist.pdf', type: 'PDF', category: 'Operations', createdAt: '2023-06-08', url: '#' },
    { id: '5', name: 'Annual_Report_2022.pdf', type: 'PDF', category: 'Reports', createdAt: '2023-05-20', url: '#' },
    { id: '6', name: 'NDA_Template.docx', type: 'Word', category: 'Legal', createdAt: '2023-05-18', url: '#' },
];

const categories: Document['category'][] = ['Legal', 'Finance', 'Operations', 'Reports'];

export default function DocumentsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Documents</h1>
          <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Document
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload New Document</DialogTitle>
                    <DialogDescription>
                        Select a file and categorize it for your workspace.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="file" className="text-right">File</Label>
                        <Input id="file" type="file" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Category</Label>
                         <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Upload</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(cat => <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="all">
            <DocumentTable documents={documents} />
          </TabsContent>
          {categories.map(cat => (
            <TabsContent key={cat} value={cat}>
                <DocumentTable documents={documents.filter(d => d.category === cat)} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}


function DocumentTable({ documents }: { documents: Document[] }) {
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
                    {documents.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.name}</TableCell>
                            <TableCell>{doc.type}</TableCell>
                            <TableCell>{doc.category}</TableCell>
                            <TableCell>{doc.createdAt}</TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                                        <DropdownMenuItem><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
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
