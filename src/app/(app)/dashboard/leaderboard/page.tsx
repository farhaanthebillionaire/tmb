// src/app/(app)/dashboard/leaderboard/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Users, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchAllUsersForLeaderboard, fetchFoodLogs, type UserProfileData } from '@/lib/actions';
import type { FullFoodLog } from '@/contexts/FoodLogContext'; 
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isValid } from 'date-fns';
import { useFoodLog } from '@/contexts/FoodLogContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardUser extends UserProfileData {
  id: string; 
  rank: number;
  averageDailyCalories: number;
  daysLoggedThisWeek: number;
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useFoodLog();
  const router = useRouter();

  const calculateAverageDailyCalories = (foodLogs: FullFoodLog[], weekStart: Date, weekEnd: Date): { average: number, daysLogged: number } => {
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    let totalCalories = 0;
    let daysWithLogs = 0;

    weekDays.forEach(day => {
      const logsForDay = foodLogs.filter(log => {
        const logDate = parseISO(log.timestamp);
        return isValid(logDate) && isSameDay(logDate, day);
      });
      
      if (logsForDay.length > 0) {
        daysWithLogs++;
        totalCalories += logsForDay.reduce((sum, log) => sum + (log.analysis?.calorieEstimate || log.calories || 0), 0);
      }
    });
    return { average: daysWithLogs > 0 ? Math.round(totalCalories / daysWithLogs) : 0, daysLogged: daysWithLogs};
  };

  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const users = await fetchAllUsersForLeaderboard();
      if (!users || users.length === 0) {
        setLeaderboardData([]);
        setIsLoadingData(false);
        return;
      }

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); 
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      const usersWithCalorieData = await Promise.all(
        users.map(async (user) => {
          if (!user.uid) return null;
          const foodLogs = await fetchFoodLogs(user.uid); 
          const relevantLogs = foodLogs.filter(log => {
            const logDate = parseISO(log.timestamp);
            return isValid(logDate) && logDate >= weekStart && logDate <= weekEnd;
          });
          const { average, daysLogged } = calculateAverageDailyCalories(relevantLogs, weekStart, weekEnd);
          return { ...user, id: user.uid, averageDailyCalories: average, daysLoggedThisWeek: daysLogged };
        })
      );
      
      const validUsers = usersWithCalorieData.filter(u => u !== null && u.daysLoggedThisWeek > 0) as (UserProfileData & {id:string, averageDailyCalories: number, daysLoggedThisWeek: number})[];

      const sortedLeaderboard = validUsers
        .sort((a, b) => a.averageDailyCalories - b.averageDailyCalories) 
        .map((user, index) => ({
          ...user,
          rank: index + 1,
        }));

      setLeaderboardData(sortedLeaderboard as LeaderboardUser[]);

    } catch (error) {
      console.error("Failed to fetch leaderboard data:", error);
      toast({
        title: "Error Loading Leaderboard",
        description: "Could not retrieve leaderboard data. Please try again later.",
        variant: "destructive",
      });
      setLeaderboardData([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
        fetchLeaderboard();
    } else if (!isLoadingAuth && !currentUser) {
        setIsLoadingData(false); 
    }
  }, [isLoadingAuth, currentUser, fetchLeaderboard]);


  if (isLoadingAuth || (!currentUser && isLoadingData)) {
     return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4 mb-2"/>
                    <Skeleton className="h-4 w-1/2"/>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col justify-center items-center h-64">
                        <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
                        <p className="mt-4 text-lg text-muted-foreground">Loading leaderboard...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">
            Please log in to view the leaderboard.
            </p>
            <Button onClick={() => router.push('/login')} className="mt-6">
            Go to Login
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-primary">
            <Trophy className="mr-3 h-7 w-7 text-yellow-500" />
            Weekly Calorie Champions
          </CardTitle>
          <CardDescription className="text-base">
            Users with the lowest average daily calorie intake this week (min. 1 day logged).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="flex flex-col justify-center items-center h-64">
              <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
              <p className="mt-4 text-lg text-muted-foreground">Loading leaderboard data...</p>
            </div>
          ) : leaderboardData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Avg. Daily Calories (This Week)</TableHead>
                   <TableHead className="text-center">Days Logged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((user) => (
                  <TableRow key={user.id} className={user.rank <= 3 ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium text-lg">
                      {user.rank === 1 && <Trophy className="inline-block h-5 w-5 text-yellow-400 mr-1" />}
                      {user.rank === 2 && <Trophy className="inline-block h-5 w-5 text-slate-400 mr-1" />}
                      {user.rank === 3 && <Trophy className="inline-block h-5 w-5 text-orange-400 mr-1" />}
                      {user.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.name}.png?size=40`} alt={user.name || 'User'} data-ai-hint="user avatar"/>
                          <AvatarFallback>{(user.name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {user.averageDailyCalories.toLocaleString()} kcal
                      {user.averageDailyCalories > 0 && user.averageDailyCalories < 1500 && <TrendingDown className="inline-block h-4 w-4 text-green-500 ml-2" />}
                    </TableCell>
                     <TableCell className="text-center">{user.daysLoggedThisWeek}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No Leaderboard Data</p>
              <p className="text-sm text-muted-foreground mt-2">
                No users have logged meals this week, or data might still be loading.
                Start logging your meals to appear on the leaderboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
       <Card className="mt-8 bg-secondary/30">
          <CardHeader>
            <CardTitle className="text-lg">How the Leaderboard Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-secondary-foreground space-y-2">
            <p>This leaderboard shows registered users ranked by their average daily calorie intake for the current week (Monday to Sunday).</p>
            <p>Users must have logged meals on at least one day this week and completed their profile to appear. The aim is to encourage mindful eating, not extreme restriction. Always consult a healthcare professional for personalized dietary advice.</p>
          </CardContent>
        </Card>
    </div>
  );
}
