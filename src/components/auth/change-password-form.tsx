'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type ChangePasswordFormProps = {
    setDialogOpen: (open: boolean) => void;
}

export function ChangePasswordForm({ setDialogOpen }: ChangePasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
        try {
            await updatePassword(user, values.password);
            toast({
                title: 'Success',
                description: 'Your password has been changed successfully.',
            });
            setDialogOpen(false);
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to change password. Please try again later.',
            });
        } finally {
            setLoading(false);
        }
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No user is signed in.',
        });
        setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                 <div className="relative">
                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...field} disabled={loading} />
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                    >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </Button>
                 </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Change Password
        </Button>
      </form>
    </Form>
  );
}
