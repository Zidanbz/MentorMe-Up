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
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { KeyRound, Mail, User as UserIcon, Building2, Phone, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '@/services/userService';
import type { UserProfile } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';


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
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEditPhoneOpen, setIsEditPhoneOpen] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        setProfileLoading(true);
        try {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error("Failed to fetch user profile", error);
        } finally {
          setProfileLoading(false);
        }
      }
    }
    fetchProfile();
  }, [user]);

  const userRole = user?.email ? roleMappings[user.email] || 'Member' : '...';
  const userInitial = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'

  const loading = authLoading || profileLoading;

  if (loading) {
    return (
        <AppLayout>
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        </AppLayout>
    )
  }
  
  const handlePhoneUpdate = (newPhone: string) => {
    if (profile) {
        setProfile({...profile, phone: newPhone});
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
              <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? ''} />
              <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{profile?.displayName || 'User'}</CardTitle>
            <CardDescription>{profile?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <ChangePasswordForm setDialogOpen={setIsChangePasswordOpen} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Profile Details</CardTitle>
                 <Dialog open={isEditPhoneOpen} onOpenChange={setIsEditPhoneOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <EditPhoneDialog 
                        currentPhone={profile?.phone}
                        onPhoneUpdate={handlePhoneUpdate}
                        setDialogOpen={setIsEditPhoneOpen}
                    />
                </Dialog>
            </div>
            <CardDescription>Your personal information within the organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 mr-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{profile?.displayName || 'Not Set'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
            </div>
             <div className="flex items-center">
                <Phone className="h-5 w-5 mr-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{profile?.phone || 'Not Set'}</p>
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
    </AppLayout>
  );
}


function EditPhoneDialog({ currentPhone, onPhoneUpdate, setDialogOpen }: { currentPhone?: string, onPhoneUpdate: (phone: string) => void, setDialogOpen: (open: boolean) => void }) {
    const { user } = useAuth();
    const [phone, setPhone] = useState(currentPhone || '');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated.' });
            return;
        }
        if (!phone || !/^(08|628)\d{8,12}$/.test(phone)) {
            toast({ variant: 'destructive', title: 'Invalid Phone Number', description: 'Please enter a valid Indonesian phone number (e.g., 08123456789 or 628123456789).' });
            return;
        }

        setLoading(true);
        try {
            await updateUserProfile(user.uid, { phone });
            onPhoneUpdate(phone);
            toast({ title: 'Success', description: 'Phone number updated successfully.' });
            setDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update phone number.' });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Phone Number</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                    id="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="e.g. 081234567890"
                    disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Enter your WhatsApp number. Start with 08 or 628.</p>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={loading}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}
