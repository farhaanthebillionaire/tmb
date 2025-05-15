// src/components/dashboard/CalorieForecastCard.tsx
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { FullFoodLog } from '@/contexts/FoodLogContext';
import { useMemo } from 'react';
import { subDays, startOfDay, isSameDay, parseISO, isValid, format } from 'date-fns';

interface CalorieForecastCardProps {
  currentCalories: number;
  dailyGoal: number;
  foodLogs: FullFoodLog[];
}

export function CalorieForecastCard({ currentCalories, dailyGoal, foodLogs }: CalorieForecastCardProps) {
  const percentage = dailyGoal > 0 ? Math.min((currentCalories / dailyGoal) * 100, 100) : 0;
  const caloriesRemaining = Math.max(0, dailyGoal - currentCalories);

  const todayData = [
    { name: 'Today', calories: currentCalories, goal: dailyGoal },
  ];

  const averageDailyCaloriesLast7Days = useMemo(() => {
    const last7Days: Date[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 7; i++) {
      last7Days.push(subDays(today, i));
    }

    let totalCalories = 0;
    let daysWithLogs = 0;

    last7Days.forEach(day => {
      const logsForDay = foodLogs.filter(log => {
        try {
          return log.timestamp && isValid(parseISO(log.timestamp)) && isSameDay(parseISO(log.timestamp), day);
        } catch { return false; }
      });

      if (logsForDay.length > 0) {
        const caloriesForDay = logsForDay.reduce((sum, logItem) => sum + (logItem.analysis?.calorieEstimate || logItem.calories || 0), 0);
        totalCalories += caloriesForDay;
        daysWithLogs++;
      }
    });
    return daysWithLogs > 0 ? Math.round(totalCalories / daysWithLogs) : 0;
  }, [foodLogs]);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary">
            <TrendingUp className="mr-2 h-6 w-6" />
            Daily Calorie Tracker
        </CardTitle>
        <CardDescription>Your progress towards your daily calorie goal and recent habits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow flex flex-col">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{currentCalories.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">calories consumed today</p>
        </div>
        
        <div className="flex-grow w-full min-h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={todayData} layout="vertical" margin={{ right: 30, left: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, dailyGoal > 0 ? Math.max(dailyGoal, currentCalories) : 2500]} hide />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-1 gap-1.5">
                           <span className="text-sm font-semibold">
                              {payload[0].payload.calories.toLocaleString()} kcal consumed
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Goal: {payload[0].payload.goal.toLocaleString()} kcal
                            </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="goal" layout="vertical" stackId="a" fill="hsl(var(--muted) / 0.5)" radius={[0, 4, 4, 0]} barSize={25} />
              <Bar dataKey="calories" layout="vertical" stackId="a" fill="hsl(var(--primary))" radius={[4, 0, 0, 4]} barSize={25}>
                {todayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.calories > entry.goal ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-center mt-auto pt-2">
          {currentCalories <= dailyGoal ? (
            <p className="text-lg text-foreground">
              <span className="font-semibold text-green-600">{caloriesRemaining.toLocaleString()}</span> calories remaining.
            </p>
          ) : (
            <p className="text-lg text-destructive font-semibold">
              {(currentCalories - dailyGoal).toLocaleString()} calories over goal.
            </p>
          )}
          <p className="text-xs text-muted-foreground">Daily goal: {dailyGoal.toLocaleString()} kcal</p>
          {foodLogs && foodLogs.length > 0 && averageDailyCaloriesLast7Days > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Your 7-day average: {averageDailyCaloriesLast7Days.toLocaleString()} kcal/day
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
