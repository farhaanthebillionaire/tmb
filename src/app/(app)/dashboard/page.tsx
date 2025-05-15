// src/app/(app)/dashboard/page.tsx
'use client';

import { PlateAnalysisCard } from '@/components/dashboard/PlateAnalysisCard';
import { FoodLoggingCard } from '@/components/dashboard/FoodLoggingCard';
import { MoodTrackingCard, type MoodLog } from '@/components/dashboard/MoodTrackingCard';
import { CalorieForecastCard } from '@/components/dashboard/CalorieForecastCard';
import { handlePlateAnalysis, submitMoodLog as submitMoodLogAction } from '@/lib/actions';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, Lightbulb, UserCheck, HelpCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFoodLog, type FullFoodLog } from '@/contexts/FoodLogContext';
import { Skeleton } from '@/components/ui/skeleton';

const motivationalQuotes = [
  "Every bite is a new opportunity to nourish your body.",
  "Mindful eating is a journey, not a destination. Enjoy each step!",
  "Small changes can lead to big results. Keep tracking!",
  "You're taking control of your health, one meal at a time. Great job!",
  "Listen to your body; it knows what it needs."
];

export default function DashboardPage() {
  const [pageMoodLogs, setPageMoodLogs] = useState<MoodLog[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const {
    foodLogs: contextFoodLogs,
    addFoodLog: addGlobalFoodLog,
    currentCaloriesToday,
    currentUser,
    isLoadingAuth, // Primary flag for auth and initial profile loading
    userProfile,
  } = useFoodLog();

  const [showMotivationalToast, setShowMotivationalToast] = useState(false);

  useEffect(() => {
    setShowMotivationalToast(true);
  }, []);

  useEffect(() => {
    let toastTimerId: NodeJS.Timeout | undefined;
    if (showMotivationalToast && currentUser && !isLoadingAuth) { // Ensure auth is resolved and user exists
      const triggerToast = () => {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        toast({
          title: "Friendly Reminder",
          description: (
            <div className="flex items-start">
              <Lightbulb className="h-5 w-5 mr-2 mt-1 text-yellow-400" />
              <span>{motivationalQuotes[randomIndex]}</span>
            </div>
          ),
          duration: 7000,
        });
      };
      toastTimerId = setTimeout(triggerToast, 3000); // Slightly delay toast
    }
    return () => {
      if (toastTimerId) {
        clearTimeout(toastTimerId);
      }
    };
  }, [showMotivationalToast, currentUser, isLoadingAuth, toast]);

  const handleAddMoodLogEntry = async (logEntry: Omit<MoodLog, 'id'>) => {
    if (!currentUser?.uid) {
      toast({ title: "Not Logged In", description: "Please log in to save your mood.", variant: "destructive" });
      return;
    }
    const newLogForFirestore: Omit<MoodLog, 'id'> = {
      ...logEntry,
      timestamp: new Date(logEntry.timestamp || Date.now()).toISOString(),
    };

    const newLogId = await submitMoodLogAction(currentUser.uid, newLogForFirestore);
    if (newLogId) {
      const newLogForDisplay: MoodLog = { ...newLogForFirestore, id: newLogId, mood: newLogForFirestore.mood, intensity: newLogForFirestore.intensity, timestamp: newLogForFirestore.timestamp };
      setPageMoodLogs((prev) => [newLogForDisplay, ...prev].slice(0, 5));
      toast({ title: "Mood Logged!", description: `Feeling ${logEntry.mood.toLowerCase()}.` });
    } else {
      toast({ title: "Error", description: "Failed to save mood log.", variant: "destructive" });
    }
  };

  const dailyCalorieGoal = userProfile?.plan ?
    (userProfile.plan === 'weight_loss' ? 1600 :
     userProfile.plan === 'muscle_gain' ? 2400 : 2000)
    : 2000;

  const navigateToInsightsPage = () => {
    if (contextFoodLogs.length === 0) {
       toast({
        title: "Log Data First",
        description: "Please log some meals today to get the most out of the insights page.",
        variant: "default",
      });
    }
    router.push('/dashboard/insights');
  };

  // Primary loading state: covers Firebase auth initialization and initial profile fetch
  if (isLoadingAuth) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 space-y-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  // After loading, if no user is authenticated, show "Auth Required"
  if (!currentUser) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
            <HelpCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">
            Please log in to access your dashboard.
            </p>
            <Button onClick={() => router.push('/login')} className="mt-6">
            Go to Login
            </Button>
        </div>
    );
  }

  // At this point, isLoadingAuth is false AND currentUser is present.
  // Determine if profile is incomplete.
  const profileIncomplete = !userProfile || userProfile.isProfileComplete === false;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
      {profileIncomplete && (
        <Alert className="mb-6 border-primary bg-primary/5 hover:shadow-md transition-shadow">
          <UserCheck className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold text-primary">Complete Your Profile!</AlertTitle>
          <AlertDescription className="text-primary/80">
            Help us personalize your experience. Please complete your profile to unlock all features and get more accurate insights.
            <Button
              variant="link"
              onClick={() => router.push('/dashboard/settings')}
              className="p-0 h-auto text-primary font-semibold hover:underline ml-2"
            >
              Go to Settings
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6 flex flex-col">
          <FoodLoggingCard addFoodLog={addGlobalFoodLog} handlePlateAnalysis={handlePlateAnalysis} />
          <MoodTrackingCard addMoodLog={handleAddMoodLogEntry} />
        </div>

        <div className="space-y-6 flex flex-col">
          <CalorieForecastCard currentCalories={currentCaloriesToday} dailyGoal={dailyCalorieGoal} foodLogs={contextFoodLogs} />
          <PlateAnalysisCard
            handlePlateAnalysis={handlePlateAnalysis}
            onAnalysisComplete={(analysis) => {
              toast({ title: "Plate Analyzed!", description: `Estimated ${analysis.calorieEstimate} calories. Health Score: ${analysis.plateHealthScore}/100.` });
            }}
            showCameraOption={true}
          />
        </div>
      </div>

      <div className="mt-8 mb-6 flex justify-center">
        <Button
          onClick={navigateToInsightsPage}
          className="w-auto bg-accent text-accent-foreground hover:bg-accent/90 py-6 px-8 text-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <Brain className="mr-2 h-5 w-5" />
          View Mood-Food Insights
        </Button>
      </div>
    </div>
  );
}
