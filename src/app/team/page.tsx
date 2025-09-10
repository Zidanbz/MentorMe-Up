'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { getUsers } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Building2, Mail, Layers3, Home as HomeIcon, Layers, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const workspaceDisplay: Record<string, { name: string; icon: React.ElementType, color: string }> = {
    mentorme: { name: 'MentorMe Up', icon: Layers3, color: 'bg-blue-500' },
    homeworkers: { name: 'Home Workers', icon: HomeIcon, color: 'bg-green-500' },
    neo: { name: 'Neo Up', icon: Layers, color: 'bg-purple-500' },
};

export default function TeamPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All');
    const [selectedWorkspace, setSelectedWorkspace] = useState('All');
    const { toast } = useToast();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const allUsers = await getUsers();
            setUsers(allUsers);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch team members.',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const roles = ['All', ...Array.from(new Set(users.map(u => u.role)))];
    const workspaces = ['All', ...Array.from(new Set(users.map(u => u.workspaceId)))];

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'All' || user.role === selectedRole;
        const matchesWorkspace = selectedWorkspace === 'All' || user.workspaceId === selectedWorkspace;
        return matchesSearch && matchesRole && matchesWorkspace;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Team Members</h1>
                        <p className="text-muted-foreground">View all members across all workspaces.</p>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-auto"
                        />
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by workspace" />
                            </SelectTrigger>
                            <SelectContent>
                                {workspaces.map(ws => (
                                    <SelectItem key={ws} value={ws}>
                                        {workspaceDisplay[ws]?.name || 'All'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {filteredUsers.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredUsers.map(user => (
                            <Card key={user.uid} className="flex flex-col">
                                <CardHeader className="flex-row items-center gap-4">
                                    <Avatar className="h-16 w-16 border">
                                        <AvatarImage src={user.photoURL} alt={user.displayName} data-ai-hint="person portrait" />
                                        <AvatarFallback className="text-2xl">{user.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">{user.displayName}</CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                            {user.role}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Building2 className="h-4 w-4" />
                                        <span>{workspaceDisplay[user.workspaceId]?.name || 'Unknown'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 rounded-lg border-2 border-dashed">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No Members Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
