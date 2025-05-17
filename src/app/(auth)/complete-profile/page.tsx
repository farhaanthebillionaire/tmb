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
import { updateUserProfileDetailsAction, type UserProfileDetails } from '@/lib/actions'; 
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
      weight: userProfile?.weight || '',
      height: userProfile?.height || '',
      plan: userProfile?.plan || 'mindful_eating',
      goal: userProfile?.goal || '',
    },
  });
  
  const checkAuthStateAndHandleRedirects = useCallback(async () => {
    console.log("[CompleteProfilePage] checkAuthStateAndHandleRedirects called. isLoadingAuth:", isLoadingAuth, "isSubmitting:", isSubmitting);
    if (isLoadingAuth || isSubmitting) {
      setIsPageLoading(true); // Keep loading if auth is processing or form is submitting
      return;
    }

    if (!currentUser) {
      console.log("[CompleteProfilePage] No currentUser after initial check. Redirecting to /login.");
      router.replace('/login');
      return;
    }

    // currentUser exists, check profile status
    if (!userProfile) {
      console.log("[CompleteProfilePage] currentUser exists, but userProfile is null in context. Attempting to fetch...");
      setIsPageLoading(true); // Show loading while profile is fetched
      await fetchCurrentUserProfile();
      // After fetch, this effect will re-run, and userProfile should be populated.
      // No need to set isPageLoading to false here, let the next run of effect handle it.
      return; 
    }
    
    // At this point, currentUser and userProfile are available (or fetch was attempted)
    if (userProfile.isProfileComplete) {
      console.log("[CompleteProfilePage] User profile IS complete. Redirecting to /dashboard.");
      router.replace('/dashboard');
      return;
    }

    // If user is present, profile exists but is not complete, and not loading, render form
    console.log("[CompleteProfilePage] Auth resolved, currentUser exists, profile incomplete. Rendering form.");
    form.reset({
        weight: userProfile.weight || '',
        height: userProfile.height || '',
        plan: userProfile.plan || 'mindful_eating',
        goal: userProfile.goal || '',
    });
    setIsPageLoading(false); // Ready to show the form

  }, [isLoadingAuth, currentUser, userProfile, router, fetchCurrentUserProfile, form, isSubmitting]);

  useEffect(() => {
    checkAuthStateAndHandleRedirects();
  }, [checkAuthStateAndHandleRedirects]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({ title: "Error", description: "No authenticated user found. Please log in again.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsSubmitting(true);

    const profileDetailsToSend: UserProfileDetails = {
      name: currentUser.displayName || '',
      ...values,
      plan: values.plan as UserProfileDetails['plan'], 
    };

    const result = await updateUserProfileDetailsAction(currentUser.uid, profileDetailsToSend);

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
      // Prioritize navigation
      router.push('/dashboard');
      // Update context in the background; the dashboard will benefit from the updated context.
      fetchCurrentUserProfile(); 
      setIsSubmitting(false); // Set submitting to false after navigation is initiated
    }
  }

  if (isPageLoading) {
    return (
      <Card className="w-full max-w-lg shadow-2xl glassmorphic">
        <CardHeader className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4 bg-primary/20" />
          <Skeleton className="h-7 w-3/4 mx-auto bg-muted" />
          <Skeleton className="h-5 w-1/2 mx-auto mt-1 bg-muted" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Skeleton className="h-4 w-1/4 mb-1 bg-muted" /><Skeleton className="h-10 w-full bg-muted" /></div>
            <div><Skeleton className="h-4 w-1/4 mb-1 bg-muted" /><Skeleton className="h-10 w-full bg-muted" /></div>
          </div>
          <div><Skeleton className="h-4 w-1/4 mb-1 bg-muted" /><Skeleton className="h-10 w-full bg-muted" /></div>
          <div><Skeleton className="h-4 w-1/4 mb-1 bg-muted" /><Skeleton className="h-20 w-full bg-muted" /></div>
          <Skeleton className="h-10 w-full bg-primary/50" />
        </CardContent>
      </Card>
    );
  }
  
  // Defensive check, should be caught by useEffect guard.
  if (!currentUser && !isLoadingAuth) { 
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
