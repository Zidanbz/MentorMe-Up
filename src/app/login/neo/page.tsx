'use client';

import { Layers } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect } from 'react';

export default function NeoLoginPage() {

  useEffect(() => {
    // Set workspace details in localStorage when the component mounts
    localStorage.setItem('workspaceId', 'neo');
    localStorage.setItem('workspaceName', 'Neo Up');
    localStorage.setItem('workspaceIcon', 'Layers');
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Layers className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">Neo Up</CardTitle>
            <CardDescription>Welcome! Please sign in to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm 
              placeholderEmail="name@neo.com" 
              requiredDomain="neo.com"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
