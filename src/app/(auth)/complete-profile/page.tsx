// src/app/(auth)/complete-profile/page.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, AlertTriangle } from 'lucide-react';
import { updateUserProfileDetailsAction } from '@/lib/actions';
import { useFoodLog } from '@/contexts/FoodLogContext';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  weight: z.string().min(1, "Weight is required.").regex(/^\d+(\.\d{1,2})?$/, "Must be a valid weight (e.g., 70 or 70.5)."),
  height: z.string().min(1, "Height is required.").regex(/^\d+$/, "Must be a valid height in cm (e.g., 175)."),
  plan: z.string().min(1, "Please select a primary goal."),
  goal: z.string().min(5, "Goal details must be at least 5 characters.").max(200, "Goal details cannot exceed 200 characters.").optional().or(z.literal('')),
});

export default function CompleteProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth, userProfile, fetchCurrentUserProfile } = useFoodLog();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weight: '',
      height: '',
      plan: 'mindful_eating',
      goal: '',
    },
  });

  const checkAuthStateAndHandleRedirects = useCallback(async () => {
    console.log("[CompleteProfilePage] Checking auth state. isLoadingAuth:", isLoadingAuth);
    if (isLoadingAuth) {
      setIsPageLoading(true);
      return;
    }

    if (!currentUser) {
      console.log("[CompleteProfilePage] No currentUser. Redirecting to /login.");
      router.replace('/login');
      return;
    }

    // currentUser exists. If userProfile isn't loaded yet, fetch it.
    if (!userProfile) {
      console.log("[CompleteProfilePage] currentUser exists, but userProfile is null in context. Attempting to fetch...");
      await fetchCurrentUserProfile();
      // After fetchCurrentUserProfile, this effect will re-run because userProfile in context will change.
      // Keep isPageLoading true until the re-run with populated userProfile.
      setIsPageLoading(true); 
      return;
    }
    
    // At this point, currentUser exists and userProfile is loaded from context
    if (userProfile.isProfileComplete) {
      console.log("[CompleteProfilePage] User profile IS complete. Redirecting to /dashboard.");
      toast({ title: "Profile Already Complete", description: "Redirecting to dashboard." });
      router.replace('/dashboard');
      return;
    }

    // User exists, profile is loaded, and profile is NOT complete. Ready to show form.
    console.log("[CompleteProfilePage] Auth resolved, currentUser exists, profile incomplete. Rendering form.");
    // Pre-fill form if some details exist but profile isn't complete (e.g., from partial previous attempt)
    form.reset({
        weight: userProfile.weight || '',
        height: userProfile.height || '',
        plan: userProfile.plan || 'mindful_eating',
        goal: userProfile.goal || '',
    });
    setIsPageLoading(false);

  }, [isLoadingAuth, currentUser, userProfile, router, toast, fetchCurrentUserProfile, form]);

  useEffect(() => {
    checkAuthStateAndHandleRedirects();
  }, [isLoadingAuth, currentUser, userProfile, checkAuthStateAndHandleRedirects]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({ title: "Error", description: "No authenticated user found. Please log in again.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsSubmitting(true);
    const result = await updateUserProfileDetailsAction(currentUser.uid, values);

    if (result.error) {
      toast({
        title: 'Profile Update Failed',
        description: result.error,
        variant: 'destructive',
      });
       setIsSubmitting(false);
    } else {
      toast({
        title: 'Profile Complete!',
        description: 'Your details have been saved. Welcome to TrackMyBite!',
      });
      await fetchCurrentUserProfile(); // Refresh user profile in context
      setIsSubmitting(false);
      router.push('/dashboard');
    }
  }

  if (isPageLoading) {
    return (
      <Card className="w-full max-w-lg shadow-2xl glassmorphic">
        <CardHeader className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <Skeleton className="h-7 w-3/4 mx-auto" />
          <Skeleton className="h-5 w-1/2 mx-auto mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full" /></div>
            <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full" /></div>
          </div>
          <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full" /></div>
          <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-20 w-full" /></div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // Fallback if somehow isPageLoading is false but currentUser is gone (should be caught by useEffect)
  if (!currentUser) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold">Authentication Error</h2>
            <p className="text-muted-foreground mb-6">Could not verify user. Please try logging in.</p>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
    );
  }


  return (
    <Card className="w-full max-w-lg shadow-2xl glassmorphic">
      <CardHeader className="text-center">
        <UserCheck className="h-12 w-12 text-primary mx-auto mb-4" />
        <CardTitle className="text-2xl font-bold">Complete Your Profile (Step 2 of 2)</CardTitle>
        <CardDescription>Tell us a bit more about yourself to personalize your experience.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 70" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 175" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Goal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="maintenance">Weight Maintenance</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="mindful_eating">Mindful Eating</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specific Goal Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Eat more vegetables, reduce sugar intake" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    Share any specific health or dietary goals you have.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Saving Profile...' : 'Finish Setup & Go to Dashboard'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
