// src/app/(auth)/login/page.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';

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
import { UtensilsCrossed, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { useFoodLog } from '@/contexts/FoodLogContext';
import { auth } from '@/lib/firebase/init';
import { signInWithEmailAndPassword, type UserCredential } from 'firebase/auth';
import { handleUserSessionUpdate, type UserSessionUpdateResult } from '@/lib/actions'; // Import UserSessionUpdateResult
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { fetchCurrentUserProfile, currentUser, isLoadingAuth, userProfile } = useFoodLog();
  const [isPageLoading, setIsPageLoading] = useState(true);

  const checkAuthStateAndRedirects = useCallback(async () => {
    if (isLoadingAuth) {
      setIsPageLoading(true);
      return;
    }

    if (currentUser) {
      if (!userProfile) {
        console.log("[LoginPage] Auth user exists, but userProfile context is null. Attempting to fetch profile...");
        await fetchCurrentUserProfile(); 
        setIsPageLoading(true); 
        return;
      }
      console.log("[LoginPage] useEffect: User authenticated. Profile complete:", userProfile.isProfileComplete);
      if (userProfile.isProfileComplete) {
        router.replace('/dashboard');
      } else {
        router.replace('/complete-profile');
      }
      return; 
    }
    
    setIsPageLoading(false);
  }, [isLoadingAuth, currentUser, userProfile, router, fetchCurrentUserProfile]);

  useEffect(() => {
    if (!isSubmitting) {
      checkAuthStateAndRedirects();
    }
  }, [isLoadingAuth, currentUser, userProfile, isSubmitting, checkAuthStateAndRedirects]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Declare sessionUpdateResult here to make it accessible in the catch/finally if needed,
    // though current logic only sets isSubmitting to false in catch.
    let sessionUpdateResult: UserSessionUpdateResult | undefined = undefined; 

    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      console.log("[LoginPage] Client-side Firebase Auth successful for:", user.email);

      sessionUpdateResult = await handleUserSessionUpdate({
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        isNewUser: false, 
      });
      console.log("[LoginPage] Server action handleUserSessionUpdate result:", sessionUpdateResult);

      if (sessionUpdateResult.success) {
        toast({
          title: 'Login Successful!',
          description: `Welcome back, ${sessionUpdateResult.name || sessionUpdateResult.email}!`,
        });
        
        // Perform navigation immediately based on server action result
        if (sessionUpdateResult.isProfileComplete) {
          console.log("[LoginPage] onSubmit: Navigating to /dashboard");
          router.push('/dashboard');
        } else {
          console.log("[LoginPage] onSubmit: Navigating to /complete-profile");
          router.push('/complete-profile');
        }
        
        // Update context in the background.
        fetchCurrentUserProfile();

      } else {
        throw new Error(sessionUpdateResult.error || "Failed to update user session on server.");
      }

    } catch (error: any) {
      console.error('[LoginPage] Error during login process:', error);
      let errorMessage = 'Login Failed. Please check your credentials and try again.';
      if (error.code) { 
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': 
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else if (error.message) { 
        errorMessage = error.message;
      }
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsSubmitting(false); // Only set submitting to false on error
    }
  }
  
  if (isPageLoading && !isSubmitting) { 
    return (
        <Card className="w-full max-w-md shadow-2xl glassmorphic">
            <CardHeader className="text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4 bg-primary/20" />
                <Skeleton className="h-7 w-3/4 mx-auto bg-muted" />
                <Skeleton className="h-5 w-1/2 mx-auto mt-1 bg-muted" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div><Skeleton className="h-4 w-1/4 mb-1 bg-muted" /><Skeleton className="h-10 w-full bg-muted" /></div>
                <div><Skeleton className="h-4 w-1/4 mb-1 bg-muted" /><Skeleton className="h-10 w-full bg-muted" /></div>
                <Skeleton className="h-10 w-full bg-primary/50" />
                <div className="text-center"><Skeleton className="h-4 w-1/3 mx-auto bg-muted" /></div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl glassmorphic">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <UtensilsCrossed className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
        <CardDescription>Log in to continue tracking your bites.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} />
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
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="••••••••" 
                        {...field} 
                        className="pr-10"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3 flex items-center text-muted-foreground hover:text-primary"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={isSubmitting}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-right">
              <Link href="/forgot-password" className="px-0 text-sm text-primary hover:underline" tabIndex={isSubmitting ? -1 : 0}>
                Forgot Password?
              </Link>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline" tabIndex={isSubmitting ? -1 : 0}>
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
