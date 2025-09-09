'use client';

import { Suspense } from 'react';
import { Layers3, Home as HomeIcon } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';


function LoginPageContent() {
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('mentorme Up');
  const [icon, setIcon] = useState(<Layers3 className="h-8 w-8" />);
  const [placeholderEmail, setPlaceholderEmail] = useState('name@mentorme.com');

  useEffect(() => {
    const workspace = searchParams.get('workspace');
    if (workspace === 'homeworkers') {
      setTitle('Home Workers Up');
      setIcon(<HomeIcon className="h-8 w-8" />);
      setPlaceholderEmail('name@example.com');
      localStorage.setItem('workspaceName', 'Home Workers Up');
      localStorage.setItem('workspaceIcon', 'HomeIcon');
    } else {
      setTitle('mentorme Up');
      setIcon(<Layers3 className="h-8 w-8" />);
      setPlaceholderEmail('name@mentorme.com');
      localStorage.setItem('workspaceName', 'mentorme Up');
      localStorage.setItem('workspaceIcon', 'Layers3');
    }
  }, [searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {icon}
            </div>
            <CardTitle className="text-3xl font-bold text-primary">{title}</CardTitle>
            <CardDescription>Welcome back! Please sign in to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm placeholderEmail={placeholderEmail} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    )
}
