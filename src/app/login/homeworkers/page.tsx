'use client';

import { Home as HomeIcon } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect } from 'react';

export default function HomeWorkersLoginPage() {

  useEffect(() => {
    // Set workspace details in localStorage when the component mounts
    localStorage.setItem('workspaceId', 'homeworkers');
    localStorage.setItem('workspaceName', 'Home Workers Up');
    localStorage.setItem('workspaceIcon', 'HomeIcon');
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <HomeIcon className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">Home Workers Up</CardTitle>
            <CardDescription>Welcome! Please sign in to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm 
              placeholderEmail="name@howe.com" 
              requiredDomain="howe.com"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
