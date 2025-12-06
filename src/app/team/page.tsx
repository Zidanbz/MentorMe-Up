'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getUsers } from '@/services/userService';
import type { UserProfile } from '@/types';
import Loading from './loading';

const roleDisplay: Record<UserProfile['role'], string> = {
    CEO: 'CEO',
    CFO: 'CFO',
    COO: 'COO',
    CTO: 'CTO',
    CMO: 'CMO',
    CHRO: 'CHRO',
    CDO: 'CDO',
    Member: 'Member',
};

const workspaceDisplay: Record<string, { name: string, color: string }> = {
    'mentorme': { name: 'MentorMe Up', color: 'bg-blue-200 text-blue-800' },
    'homeworkers': { name: 'Home Workers Up', color: 'bg-green-200 text-green-800' },
    'neo': { name: 'Neo Up', color: 'bg-purple-200 text-purple-800' },
};


export default function TeamPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedWorkspace, setSelectedWorkspace] = useState('all');

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const allUsers = await getUsers();
            setUsers(allUsers);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = selectedRole === 'all' || user.role === selectedRole;
            const matchesWorkspace = selectedWorkspace === 'all' || user.workspaceId === selectedWorkspace;
            return matchesSearch && matchesRole && matchesWorkspace;
        });
    }, [users, searchTerm, selectedRole, selectedWorkspace]);

    const roles = useMemo(() => ['all', ...Object.keys(roleDisplay)], []);
    const workspaces = useMemo(() => ['all', ...[...new Set(users.map(u => u.workspaceId).filter(Boolean))]], [users]);


    if (loading) {
        return <Loading />;
    }

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <h1 className="text-3xl font-bold">Team Members</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or email..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by role..." />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role} value={role}>
                                    {role === 'all' ? 'All Roles' : roleDisplay[role as UserProfile['role']]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by workspace..." />
                        </SelectTrigger>
                        <SelectContent>
                           {workspaces.map(ws => (
                                <SelectItem key={ws} value={ws}>
                                    {ws === 'all' ? 'All Workspaces' : (workspaceDisplay[ws]?.name || ws)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredUsers.map(user => (
                        <Card key={user.uid}>
                            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                                <Avatar className="h-20 w-20 border">
                                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                                    <AvatarFallback className="text-2xl">{user.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{user.displayName}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-center">
                                    <Badge variant="secondary">{user.role}</Badge>
                                    <Badge className={cn('font-normal', workspaceDisplay[user.workspaceId]?.color || 'bg-gray-200 text-gray-800')}>
                                      {workspaceDisplay[user.workspaceId]?.name || user.workspaceId}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 {filteredUsers.length === 0 && (
                    <div className="text-center py-12 col-span-full">
                        <p className="text-muted-foreground">No team members found matching your criteria.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
