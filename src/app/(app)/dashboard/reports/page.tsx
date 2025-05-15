// src/app/(app)/dashboard/reports/page.tsx
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp, Smile, PieChart as PieChartIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useFoodLog } from '@/contexts/FoodLogContext'; 
import type { MoodLog as MoodLogTypeFromCard } from '@/components/dashboard/MoodTrackingCard';
import { fetchMoodLogs as fetchMoodLogsAction } from '@/lib/actions';
import { subDays, format, startOfDay, isSameDay, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
];

type MoodLog = MoodLogTypeFromCard & { id: string };


export default function ReportsPage() {
  const { foodLogs: contextFoodLogs, currentUser, isLoadingAuth, userProfile } = useFoodLog();
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]); 
  const [isLoadingMoodLogs, setIsLoadingMoodLogs] = useState(false);
  const router = useRouter();
  
  const { toast } = useToast();
  // Use dailyCalorieGoal from userProfile if available, else default
  const dailyCalorieGoal = useMemo(() => {
    if (userProfile && userProfile.plan) {
        // Basic mapping, can be more sophisticated
        switch(userProfile.plan) {
            case 'weight_loss': return 1600;
            case 'maintenance': return 2000;
            case 'muscle_gain': return 2400;
            case 'mindful_eating': return 2000; // Default for mindful eating
            default: return 2000;
        }
    }
    return 2000;
  }, [userProfile]);

  const loadMoodLogs = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingMoodLogs(true);
    try {
      const fetchedLogs = await fetchMoodLogsAction(currentUser.uid, 50); // Fetch more to ensure coverage
      const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
      const recentLogs = fetchedLogs.filter(log => {
         try {
            return log.timestamp && parseISO(log.timestamp) >= sevenDaysAgo;
        } catch { return false; }
      }).map(log => ({...log, id: log.id || Date.now().toString(), mood: log.mood, intensity: log.intensity, timestamp: log.timestamp }));
      setMoodLogs(recentLogs);

    } catch (error) {
      console.error("Error fetching mood logs for reports:", error);
      toast({ title: "Error", description: "Could not load mood data.", variant: "destructive" });
    } finally {
      setIsLoadingMoodLogs(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      loadMoodLogs();
    }
  }, [currentUser, isLoadingAuth, loadMoodLogs]);


  const weeklyCalorieData = useMemo(() => {
    const data = [];
    const today = startOfDay(new Date());
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dailyLogs = contextFoodLogs.filter(log => {
        try {
          return log.timestamp && isValid(parseISO(log.timestamp)) && isSameDay(parseISO(log.timestamp), day);
        } catch (e) {
          return false;
        }
      });
      const totalCalories = dailyLogs.reduce((sum, log) => sum + (log.analysis?.calorieEstimate || log.calories || 0), 0);
      data.push({
        date: format(day, 'MMM d'),
        shortDate: format(day, 'E'), 
        calories: totalCalories,
        goal: dailyCalorieGoal,
      });
    }
    return data;
  }, [contextFoodLogs, dailyCalorieGoal]);

   const moodTrendData = useMemo(() => {
    if (moodLogs.length === 0) { 
        const data = [];
        const today = startOfDay(new Date());
        for (let i = 6; i >= 0; i--) {
            const day = subDays(today, i);
            data.push({ date: format(day, 'MMM d'), shortDate: format(day, 'E'), intensity: null });
        }
        return data;
    }
    const data = [];
    const today = startOfDay(new Date());
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dailyMoodLogs = moodLogs.filter(log => {
        try {
          return log.timestamp && isValid(parseISO(log.timestamp)) && isSameDay(parseISO(log.timestamp), day);
        } catch (e) {
          return false;
        }
      });
      if (dailyMoodLogs.length > 0) {
        const avgIntensity = dailyMoodLogs.reduce((sum, log) => sum + log.intensity, 0) / dailyMoodLogs.length;
        data.push({
          date: format(day, 'MMM d'),
          shortDate: format(day, 'E'),
          intensity: parseFloat(avgIntensity.toFixed(1)),
        });
      } else {
         data.push({
          date: format(day, 'MMM d'),
          shortDate: format(day, 'E'),
          intensity: null, 
        });
      }
    }
    return data;
  }, [moodLogs]);

  const moodDistributionData = useMemo(() => {
    if (moodLogs.length === 0) return [];
    const counts: { [key: string]: number } = {};
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
    
    moodLogs
      .filter(log => {
        try {
          return log.timestamp && isValid(parseISO(log.timestamp)) && parseISO(log.timestamp) >= sevenDaysAgo;
        } catch { return false; }
      })
      .forEach(log => {
        counts[log.mood] = (counts[log.mood] || 0) + 1;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [moodLogs]);


  const averageWeeklyCalories = useMemo(() => {
    const totalCalories = weeklyCalorieData.reduce((sum, day) => sum + day.calories, 0);
    const daysWithLoggedCalories = weeklyCalorieData.filter(d => d.calories > 0).length;
    return daysWithLoggedCalories > 0 ? Math.round(totalCalories / daysWithLoggedCalories) : 0;
  }, [weeklyCalorieData]);


  if (isLoadingAuth || isLoadingMoodLogs) {
    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                    <Skeleton className="h-10 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
            <Skeleton className="h-72 w-full mb-6" /> 
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-72 w-full lg:col-span-2" /> 
                <Skeleton className="h-72 w-full" /> 
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
            Please log in to view your reports.
            </p>
            <Button onClick={() => router.push('/login')} className="mt-6">
            Go to Login
            </Button>
        </div>
    );
  }

  if (contextFoodLogs.length === 0 && moodLogs.length === 0 && !isLoadingAuth && !isLoadingMoodLogs) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
        <BarChart3 className="h-24 w-24 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">No Data for Reports</h2>
        <p className="text-muted-foreground">
          Start logging your meals and moods to see your personalized reports here. Data from the last 7 days will be shown.
        </p>
         <Button onClick={() => router.push('/dashboard/log-food')} className="mt-6 mr-2">Log Meal</Button>
         <Button onClick={() => router.push('/dashboard/mood')} className="mt-6" variant="outline">Track Mood</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
            <h1 className="text-3xl font-bold text-primary flex items-center">
            <BarChart3 className="mr-3 h-8 w-8" />
            Your Reports
            </h1>
            <p className="text-muted-foreground mt-1">
            Visualize your calorie intake and mood trends over the past week.
            </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Weekly Calorie Intake
          </CardTitle>
          <CardDescription>
            Your daily calorie consumption over the last 7 days compared to your goal of {dailyCalorieGoal.toLocaleString()} kcal.
            Average daily intake (on logged days): {averageWeeklyCalories.toLocaleString()} kcal/day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyCalorieData.some(d => d.calories > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={weeklyCalorieData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shortDate" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => value.toLocaleString()} tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  formatter={(value, name) => [`${(value as number).toLocaleString()} kcal`, name === 'calories' ? 'Consumed' : 'Goal']}
                />
                <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
                <Bar dataKey="calories" fill="hsl(var(--primary))" name="Consumed" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="goal" fill="hsl(var(--muted))" name="Daily Goal" radius={[4, 4, 0, 0]} barSize={30} />
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No calorie data logged for the last 7 days.</p>
              <p className="text-sm text-muted-foreground">Keep logging your meals to see this chart!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold">
              <Smile className="mr-2 h-5 w-5 text-primary" />
              Weekly Mood Trend
            </CardTitle>
            <CardDescription>Your average mood intensity over the last 7 days (1-5 scale).</CardDescription>
          </CardHeader>
          <CardContent>
             {moodTrendData.some(d => d.intensity !== null) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" tick={{ fontSize: 12 }} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(value) => ['VU', 'U', 'N', 'H', 'VH'][value-1]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                        formatter={(value, name, props) => {
                            const moodLabelsShort = ['Very Unhappy', 'Unhappy', 'Neutral', 'Happy', 'Very Happy'];
                            const numValue = value as number;
                            const labelIndex = Math.max(0, Math.min(moodLabelsShort.length - 1, Math.round(numValue) - 1));
                            return [`${value} (${moodLabelsShort[labelIndex] || 'N/A'})`, 'Avg. Intensity'];
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="intensity" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 6 }} name="Avg. Mood Intensity" connectNulls={true} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Not enough mood data for the last 7 days.</p>
                    <p className="text-sm text-muted-foreground">Remember to track your mood regularly!</p>
                </div>
             )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold">
              <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
              Mood Distribution
            </CardTitle>
            <CardDescription>Breakdown of your logged moods (last 7 days).</CardDescription>
          </CardHeader>
          <CardContent>
            {moodDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={moodDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="hsl(var(--chart-3))"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      nameKey="name"
                    >
                      {moodDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        formatter={(value, name) => [`${value} logs`, name]}
                    />
                     <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} layout="horizontal" verticalAlign="bottom" align="center" />
                  </RechartsPieChart>
                </ResponsiveContainer>
             ) : (
                 <div className="flex flex-col items-center justify-center h-48 text-center">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No mood distribution data available for the last 7 days.</p>
                 </div>
             )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8 bg-secondary/30">
        <CardHeader>
          <CardTitle className="text-lg">Understanding Your Reports</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-secondary-foreground space-y-2">
          <p>These reports provide a snapshot of your eating and mood patterns based on the data you've logged in the last 7 days. Use them to identify trends and make informed decisions about your health.</p>
          <p><strong className="text-primary">Remember:</strong> These are tools to aid your journey. For personalized medical or nutritional advice, always consult with a qualified healthcare professional.</p>
          <p className="text-xs italic">Reports show data from the last 7 days. If data is sparse, charts may appear empty or simplified.</p>
        </CardContent>
      </Card>

    </div>
  );
}
