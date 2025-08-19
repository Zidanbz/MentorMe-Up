'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { KeyRound, Mail, User as UserIcon, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const roleMappings: { [key: string]: string } = {
  'ceo@mentorme.com': 'Chief Executive Officer',
  'cfo@mentorme.com': 'Chief Financial Officer',
  'coo@mentorme.com': 'Chief Operating Officer',
  'cto@mentorme.com': 'Chief Technology Officer',
  'cdo@mentorme.com': 'Chief Design Officer',
  'cmo@mentorme.com': 'Chief Marketing Officer',
  'chro@mentorme.com': 'Chief Human Resources Officer',
  'member@mentorme.com': 'Member',
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const userRole = user?.email ? roleMappings[user.email] || 'Member' : '...';
  const userInitial = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'

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
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? ''} />
                <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user?.displayName || 'User'}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Your personal information within the organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 mr-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{user?.displayName || 'Not Set'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Building2 className="h-5 w-5 mr-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{userRole}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <ChangePasswordForm setDialogOpen={setIsChangePasswordOpen} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
