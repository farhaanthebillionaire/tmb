
// src/app/(app)/dashboard/log-food/page.tsx
'use client';

import { FoodLoggingCard } from '@/components/dashboard/FoodLoggingCard';
import { handlePlateAnalysis } from '@/lib/actions';
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFoodLog, type FullFoodLog } from '@/contexts/FoodLogContext';
import { Utensils, AlertTriangle, Loader2, CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isSameDay, startOfDay, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LogFoodPage() {
  const { 
    foodLogs: globalFoodLogs, 
    addFoodLog: addGlobalFoodLog,
    currentUser,
    isLoadingAuth,
    isLoadingLogs 
  } = useFoodLog(); 
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()));

  const handleLogSubmission = async (logData: Omit<FullFoodLog, 'id'>): Promise<FullFoodLog | null> => {
    const newLog = await addGlobalFoodLog(logData);
    if (newLog && isSameDay(new Date(newLog.timestamp), selectedDate || new Date())) {
      // If a new log is added for the currently selected date, ensure UI updates
      // This is implicitly handled by globalFoodLogs update from context.
    }
    if (newLog && !isSameDay(new Date(newLog.timestamp), selectedDate || new Date())) {
      // If log is for a different day, switch selectedDate to that log's day
      setSelectedDate(startOfDay(new Date(newLog.timestamp)));
    } else if (!selectedDate) {
      // If no date was selected, and a log is added, select today
      setSelectedDate(startOfDay(new Date()));
    }
    return newLog;
  };

  const fourteenDaysAgo = useMemo(() => subDays(startOfDay(new Date()), 13), []); // 13 days ago to make it total 14 days including today

  const logsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return globalFoodLogs
      .filter(log => isSameDay(new Date(log.timestamp), selectedDate))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [globalFoodLogs, selectedDate]);

  const displayTitle = useMemo(() => {
    if (!selectedDate) return "Your Recent Meals";
    if (isSameDay(selectedDate, startOfDay(new Date()))) return "Today's Meals";
    return `Meals for ${format(selectedDate, 'PPP')}`;
  }, [selectedDate]);

  if (isLoadingAuth) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-96 w-full mb-4" /> 
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-64 w-full" /> 
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold">Authentication Required</h2>
        <p className="text-muted-foreground">
          Please log in to log your meals and view your history.
        </p>
        <Button onClick={() => router.push('/login')} className="mt-6">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <FoodLoggingCard addFoodLog={handleLogSubmission} handlePlateAnalysis={handlePlateAnalysis} />
      
      <Card className="mt-8 shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-lg flex items-center">
              <Utensils className="mr-2 h-5 w-5 text-primary" />
              {displayTitle}
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date ? startOfDay(date) : undefined)}
                  disabled={(date) =>
                    date > new Date() || date < fourteenDaysAgo
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLogs && logsForSelectedDate.length === 0 && (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoadingLogs && logsForSelectedDate.length > 0 && (
            <ul className="space-y-3">
              {logsForSelectedDate.map(log => (
                <li key={log.id} className="text-sm p-3 border rounded-lg bg-muted/50 shadow-sm">
                  <div className="font-semibold text-primary-foreground bg-primary/80 px-2 py-1 rounded-t-md -mx-3 -mt-3 mb-2 flex justify-between items-center">
                    <span>{log.mealType ? log.mealType.charAt(0).toUpperCase() + log.mealType.slice(1) : 'Meal'}</span>
                    <span className="text-xs font-normal">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="font-medium">{log.foodItems.join(', ')}</p>
                  {log.calories !== undefined && <p className="text-xs text-muted-foreground">{log.calories} kcal</p>}
                  {log.analysis && <p className="text-xs text-muted-foreground">Health Score: {log.analysis.plateHealthScore}/100</p>}
                  <p className="text-xs text-muted-foreground mt-1">Method: {log.method}</p>
                </li>
              ))}
            </ul>
          )}

          {!isLoadingLogs && logsForSelectedDate.length === 0 && selectedDate && (
            <p className="text-muted-foreground text-center py-4">No meals logged for {format(selectedDate, "PPP")}.</p>
          )}
          {!isLoadingLogs && logsForSelectedDate.length === 0 && !selectedDate && globalFoodLogs.length > 0 && (
             <p className="text-muted-foreground text-center py-4">Please select a date to view meals.</p>
          )}
           {!isLoadingLogs && globalFoodLogs.length === 0 && currentUser && (
             <p className="text-muted-foreground text-center py-4">No meals logged yet. Start logging to see your history here!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
