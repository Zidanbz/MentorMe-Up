'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseError } from 'firebase/app';
import { getUserProfile } from '@/services/userService';


const createFormSchema = (requiredDomain: string, domainErrorMessage: string) => z.object({
  email: z.string().email({ message: 'Invalid email address.' }).refine(
    (email) => email.endsWith(`@${requiredDomain}`),
    { message: domainErrorMessage }
  ),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function LoginForm({ 
    placeholderEmail = 'name@example.com', 
    workspaceId,
    requiredDomain
}: { 
    placeholderEmail?: string, 
    workspaceId: string | null,
    requiredDomain: string
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { checkUserWorkspace } = useAuth();
  
  const domainErrorMessage = `Only @${requiredDomain} emails are allowed for this workspace.`;
  
  const formSchema = useMemo(() => createFormSchema(requiredDomain, domainErrorMessage), [requiredDomain, domainErrorMessage]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!workspaceId) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Workspace not selected. Please go back and select a workspace.',
      });
      return;
    }
    setLoading(true);
    try {
      // First, try to sign in the user.
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // After sign-in, check if they belong to the selected workspace.
      const profile = await getUserProfile(user.uid);
      if (profile && profile.workspaceId === workspaceId) {
        router.push('/dashboard');
      } else {
        // If profile exists but workspace doesn't match, deny access.
        await auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: `You are not a member of the ${localStorage.getItem('workspaceName') || 'selected'} workspace.`,
        });
      }
    } catch (error: any) {
      if (error instanceof FirebaseError && error.code === 'auth/user-not-found') {
        // If the user doesn't exist, create a new account for them in the selected workspace.
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
          // The onAuthStateChanged listener in useAuth will handle profile creation.
          router.push('/dashboard');
        } catch (creationError: any) {
          toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: creationError.message,
          });
        }
      } else {
        // Handle other errors like wrong password.
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Invalid email or password.',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder={placeholderEmail} {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} disabled={loading} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
    </Form>
  );
}
