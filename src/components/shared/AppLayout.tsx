'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListTodo, ShieldAlert, Star, Home as HomeIcon } from 'lucide-react';
import { Home, FileText, Banknote, Settings, Layers3, LogOut, User, Loader2, KeyRound, BookUser } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { ChangePasswordForm } from '../auth/change-password-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { hasNewGrievances } from '@/services/grievanceService';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  notification?: boolean;
  allowedRoles?: string[];
};


type AppLayoutProps = {
  children: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/cash-flow', label: 'Cash Flow', icon: Banknote },
  { href: '/project-task', label: 'Project & Task', icon: ListTodo },
  { href: '/grievances', label: 'Pengaduan', icon: ShieldAlert, notification: true },
  { href: '/user-guide', label: 'User Guide', icon: BookUser },
];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('mentorme Up');
  const [workspaceIcon, setWorkspaceIcon] = useState(<Layers3 className="h-6 w-6" />);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const isCEO = user?.email === 'ceo@mentorme.com';
  const userEmail = user?.email || '';
  
  useEffect(() => {
    const name = localStorage.getItem('workspaceName') || 'mentorme Up';
    const iconName = localStorage.getItem('workspaceIcon') || 'Layers3';
    const id = localStorage.getItem('workspaceId');
    setWorkspaceName(name);
    setWorkspaceId(id);

    if (iconName === 'HomeIcon') {
      setWorkspaceIcon(<HomeIcon className="h-6 w-6" />);
    } else {
      setWorkspaceIcon(<Layers3 className="h-6 w-6" />);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (isCEO && pathname !== '/grievances' && workspaceId) {
        const checkGrievances = async () => {
            const hasNew = await hasNewGrievances(workspaceId);
            setShowNotification(hasNew);
        }
        checkGrievances();
        
        // Optional: Check periodically
        const interval = setInterval(checkGrievances, 60000); // every minute
        return () => clearInterval(interval);
    } else {
      setShowNotification(false);
    }
  }, [isCEO, pathname, workspaceId]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {workspaceIcon}
            </div>
            <span className="text-lg font-semibold">{workspaceName}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const isAllowed = !item.allowedRoles || item.allowedRoles.includes(userEmail);
              if (!isAllowed) return null;

              return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  className="relative"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                    {item.notification && showNotification && (
                       <Star className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 fill-amber-400 text-amber-500" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {/* Settings button removed from here */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-card px-4">
          <SidebarTrigger />
          <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('workspaceId');
    localStorage.removeItem('workspaceName');
    localStorage.removeItem('workspaceIcon');
    router.push('/');
  };
  
  return (
    <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              {user?.photoURL ? <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} /> : null}
              <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
           <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
            </DialogTrigger>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
          <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <ChangePasswordForm setDialogOpen={setIsChangePasswordOpen} />
      </DialogContent>
    </Dialog>
  );
}
