
// src/app/(auth)/login/page.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

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
import { UtensilsCrossed, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useFoodLog } from '@/contexts/FoodLogContext';

import { auth } from '@/lib/firebase/init'; // Import client-side auth
import { signInWithEmailAndPassword, type UserCredential } from 'firebase/auth';
import { handleUserSessionUpdate } from '@/lib/actions'; // Server action for Firestore profile

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
  const [initialCheckDone, setInitialCheckDone] = useState(false);


  useEffect(() => {
    // This effect handles redirection for already logged-in users
    // or users who land here with an incomplete profile.
    if (!isLoadingAuth) {
        if (currentUser && userProfile) { // User is logged in and profile is loaded
            if (userProfile.isProfileComplete) {
                router.replace('/dashboard');
            } else {
                router.replace('/complete-profile');
            }
        } else if (currentUser && !userProfile && !isLoadingAuth) {
            // User is authenticated via Firebase, but profile not yet loaded in context
            // This might happen if they refresh on complete-profile or are navigated from somewhere.
            fetchCurrentUserProfile(); // Trigger a fetch, and the effect will re-evaluate.
        }
        setInitialCheckDone(true); // Mark initial check as done to prevent premature form render
    }
  }, [currentUser, isLoadingAuth, userProfile, router, fetchCurrentUserProfile]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Step 1: Client-side Firebase Authentication
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Step 2: Call server action to check/update Firestore profile status
      // Pass isNewUser as false since this is a login
      const sessionUpdateResult = await handleUserSessionUpdate({
        uid: user.uid,
        email: user.email,
        name: user.displayName, 
        isNewUser: false, 
      });

      if (sessionUpdateResult.success) {
        await fetchCurrentUserProfile(); // Ensure context is updated with latest profile
        
        toast({
          title: 'Login Successful!',
          description: `Welcome back, ${user.displayName || user.email}!`,
        });

        // Navigate based on profile completion status from server action
        if (sessionUpdateResult.isProfileComplete) {
          router.push('/dashboard');
        } else {
          router.push('/complete-profile');
        }
      } else {
        // This case means Firestore profile interaction failed after successful Firebase Auth
        throw new Error(sessionUpdateResult.error || "Failed to update user session on server.");
      }

    } catch (error: any) {
      console.error('[LoginPage] Error during login process:', error);
      let errorMessage = 'Login Failed. Please check your credentials and try again.';
      if (error.code) { // Firebase auth errors often have a code
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // Generic credential error
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          // Add other specific Firebase error codes as needed
        }
      } else if (error.message) { // For errors from handleUserSessionUpdate or other issues
        errorMessage = error.message;
      }
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Show loading screen until initial auth check is done
  if (isLoadingAuth || !initialCheckDone) {
    return (
        <Card className="w-full max-w-md shadow-2xl glassmorphic">
            <CardHeader className="text-center">
                <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
                <CardDescription>Checking your session.</CardDescription>
            </CardHeader>
            <CardContent><div className="h-48"></div></CardContent>
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
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
