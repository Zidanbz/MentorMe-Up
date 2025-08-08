import { Layers3 } from 'lucide-react';
import { SignUpForm } from '@/components/auth/signup-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Layers3 className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">Create an Account</CardTitle>
            <CardDescription>Join InSync Hub to manage your business.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
