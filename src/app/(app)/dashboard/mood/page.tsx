
'use client';

import { MoodTrackingCard, type MoodLog as MoodLogTypeFromCard } from '@/components/dashboard/MoodTrackingCard';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { submitMoodLog as submitMoodLogAction, fetchMoodLogs as fetchMoodLogsAction } from '@/lib/actions'; 
import { useFoodLog } from '@/contexts/FoodLogContext'; 
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';


export type DisplayMoodLog = MoodLogTypeFromCard & { id: string };

export default function TrackMoodPage() {
  const [pageMoodLogs, setPageMoodLogs] = useState<DisplayMoodLog[]>([]);
  const { currentUser, isLoadingAuth } = useFoodLog();
  const { toast } = useToast();
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const router = useRouter();


  const loadRecentMoodLogs = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingLogs(true);
    try {
      const logs = await fetchMoodLogsAction(currentUser.uid, 5); 
      setPageMoodLogs(logs.map(log => ({...log, id: log.id || Date.now().toString(), mood: log.mood, intensity: log.intensity, timestamp: log.timestamp })));
    } catch (error) {
      console.error("Error fetching recent mood logs:", error);
      toast({ title: "Error", description: "Could not load recent mood logs.", variant: "destructive" });
    } finally {
      setIsLoadingLogs(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      loadRecentMoodLogs();
    }
  }, [currentUser, isLoadingAuth, loadRecentMoodLogs]);

  const addMoodLogEntry = async (logEntry: Omit<MoodLogTypeFromCard, 'id'>) => {
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to save your mood.", variant: "destructive" });
      return;
    }

    const newLogForFirestore: Omit<MoodLogTypeFromCard, 'id'> = { 
        ...logEntry, 
        timestamp: new Date(logEntry.timestamp || Date.now()).toISOString() 
    };

    try {
      const newLogId = await submitMoodLogAction(currentUser.uid, newLogForFirestore);
      if (newLogId) {
        const newLogForDisplay: DisplayMoodLog = { ...newLogForFirestore, id: newLogId, mood: newLogForFirestore.mood, intensity: newLogForFirestore.intensity, timestamp: newLogForFirestore.timestamp };
        setPageMoodLogs((prev) => [newLogForDisplay, ...prev].slice(0,5));
        toast({ title: "Mood Logged!", description: `Feeling ${logEntry.mood.toLowerCase()}.`});
      } else {
        toast({ title: "Error", description: "Failed to save mood log.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving mood log:", error);
      toast({ title: "Error", description: "Could not save mood log.", variant: "destructive" });
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="w-full space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold">Authentication Required</h2>
        <p className="text-muted-foreground">
          Please log in to track your mood.
        </p>
        <Button onClick={() => router.push('/login')} className="mt-6">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <MoodTrackingCard addMoodLog={addMoodLogEntry} />

      {isLoadingLogs && <div className="flex justify-center mt-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Loading recent logs...</span></div>}
      
      {!isLoadingLogs && pageMoodLogs.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Mood Logs (Last 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {pageMoodLogs.map(log => (
                <li key={log.id} className="text-sm p-2 border rounded-md bg-muted/50">
                  {new Date(log.timestamp).toLocaleTimeString([], { day: 'numeric', month:'short', hour: '2-digit', minute: '2-digit' })}: {log.mood} (Intensity: {log.intensity})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
       {!isLoadingLogs && pageMoodLogs.length === 0 && !isLoadingAuth && currentUser && (
         <Card className="mt-8">
            <CardHeader>
                <CardTitle>Recent Mood Logs</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No mood logs recorded yet for this session. Start tracking to see your history!</p>
            </CardContent>
         </Card>
        )}
    </div>
  );
}
