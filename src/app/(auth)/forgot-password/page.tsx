// src/app/(auth)/forgot-password/page.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { sendPasswordResetEmailAction } from '@/lib/actions';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await sendPasswordResetEmailAction(values.email);
    setIsLoading(false);

    if (result.error) {
      toast({
        title: 'Error Sending Email',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setEmailSent(true);
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists for this email, you will receive instructions to reset your password shortly.',
      });
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl glassmorphic">
      <CardHeader className="text-center">
        <KeyRound className="h-12 w-12 text-primary mx-auto mb-4" />
        <CardTitle className="text-2xl font-bold">Forgot Your Password?</CardTitle>
        <CardDescription>
          {emailSent 
            ? "Check your inbox (and spam folder) for the reset link."
            : "No worries! Enter your email address below and we'll send you a link to reset your password."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {emailSent ? (
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              If you don't receive an email within a few minutes, please check your spam folder or try again.
            </p>
            <Button variant="outline" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </Form>
        )}
        {!emailSent && (
          <p className="mt-6 text-center text-sm">
            <Link href="/login" passHref>
              <Button variant="link" className="text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-1 h-3 w-3" /> Back to Login
              </Button>
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
