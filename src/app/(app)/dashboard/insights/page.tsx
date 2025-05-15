
'use client';

import type { MoodFoodInsightsInput, MoodFoodInsightsOutput } from '@/ai/flows/mood-food-insights';
import { MoodFoodInsightsCard } from '@/components/dashboard/MoodFoodInsightsCard';
import { Button } from '@/components/ui/button';
import { handleMoodFoodInsights, fetchMoodLogs as fetchMoodLogsAction } from '@/lib/actions';
import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Lightbulb, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFoodLog } from '@/contexts/FoodLogContext';
import type { MoodLog as MoodLogTypeFromCard } from '@/components/dashboard/MoodTrackingCard';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type MoodLog = MoodLogTypeFromCard & { id: string };

export default function InsightsPage() {
  const [insights, setInsights] = useState<MoodFoodInsightsOutput | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const { toast } = useToast();
  const { foodLogs: contextFoodLogs, currentUser, isLoadingAuth } = useFoodLog();
  const [pageMoodLogs, setPageMoodLogs] = useState<MoodLog[]>([]);
  const [isLoadingMoodLogs, setIsLoadingMoodLogs] = useState(false);
  const router = useRouter();

  const loadMoodLogsForInsights = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingMoodLogs(true);
    try {
      const logs = await fetchMoodLogsAction(currentUser.uid, 100); 
      setPageMoodLogs(logs.map(log => ({...log, id: log.id || Date.now().toString(), mood: log.mood, intensity: log.intensity, timestamp: log.timestamp })));
    } catch (error) {
      console.error("Error fetching mood logs for insights:", error);
      toast({ title: "Error", description: "Could not load mood data for insights.", variant: "destructive" });
    } finally {
      setIsLoadingMoodLogs(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      loadMoodLogsForInsights();
    }
  }, [currentUser, isLoadingAuth, loadMoodLogsForInsights]);


  const onGetMoodFoodInsights = async () => {
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to generate insights.", variant: "destructive" });
      return;
    }
    setIsLoadingInsights(true);

    const formattedFoodLogs = contextFoodLogs.map(log => ({
      timestamp: log.timestamp,
      foodItems: log.foodItems,
    }));
    
    const formattedMoodLogs = pageMoodLogs.map(log => ({
      timestamp: log.timestamp,
      mood: log.mood,
    }));

    if (formattedFoodLogs.length === 0 || formattedMoodLogs.length === 0) {
      toast({
        title: "Insufficient Data",
        description: "Please log some meals and moods to generate insights. More data leads to better insights.",
        variant: "default",
      });
      setIsLoadingInsights(false);
      return; 
    }

    try {
      const insightInput: MoodFoodInsightsInput = {
        foodLogs: formattedFoodLogs,
        moodLogs: formattedMoodLogs,
      };
      const result = await handleMoodFoodInsights(insightInput);
      setInsights(result);
       if (result.patterns.length === 0 && result.suggestions.length === 0) {
        toast({
          title: "Insights Generated",
          description: "No specific patterns or suggestions found with current data. Keep logging!",
        });
      } else {
        toast({
          title: "Insights Ready!",
          description: "Check out your personalized mood-food analysis.",
        });
      }
    } catch (error) {
      console.error("Error fetching mood food insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingInsights(false);
    }
  };

  if (isLoadingAuth || isLoadingMoodLogs) { 
    return (
        <div className="w-full space-y-6 p-4 md:p-6 lg:p-8">
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-8 w-1/3 mb-6" />
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    );
  }

  if (!currentUser) {
     return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">
            Please log in to view your AI-powered insights.
            </p>
            <Button onClick={() => router.push('/login')} className="mt-6">
            Go to Login
            </Button>
        </div>
    );
  }

  return (
    <div className="w-full space-y-6"> 
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>AI Insights</AlertTitle>
        <AlertDescription>
          This page uses your logged food and mood data to generate AI-powered insights. 
          Click the button below to see your analysis. For more accurate insights, ensure you log your meals and moods regularly.
        </AlertDescription>
      </Alert>
      
      <Button 
        onClick={onGetMoodFoodInsights} 
        disabled={isLoadingInsights || contextFoodLogs.length === 0 || pageMoodLogs.length === 0} 
        className="w-full md:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {isLoadingInsights ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
        {isLoadingInsights ? 'Generating...' : 'Get Mood-Food Insights'}
      </Button>
      
      <MoodFoodInsightsCard insights={insights} />
    </div>
  );
}
