// src/app/(app)/dashboard/log-food/page.tsx
'use client';

import { FoodLoggingCard } from '@/components/dashboard/FoodLoggingCard';
import { handlePlateAnalysis } from '@/lib/actions';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFoodLog, type FullFoodLog } from '@/contexts/FoodLogContext';

export default function LogFoodPage() {
  const [pageSpecificFoodLogs, setPageSpecificFoodLogs] = useState<FullFoodLog[]>([]);
  const { addFoodLog: addGlobalFoodLog } = useFoodLog(); // This is (logData: Omit<FullFoodLog, 'id'>) => Promise<FullFoodLog | null>

  // Updated to match the expected signature and handle the returned FullFoodLog
  const handleLogSubmission = async (logData: Omit<FullFoodLog, 'id'>): Promise<FullFoodLog | null> => { // Changed return type
    const newLogWithId = await addGlobalFoodLog(logData); 
    if (newLogWithId) {
      setPageSpecificFoodLogs((prev) => [newLogWithId, ...prev].slice(0,5)); // Keep last 5, newest first
    }
    return newLogWithId; // Return the result from addGlobalFoodLog
  };

  return (
    <div className="w-full">
      <FoodLoggingCard addFoodLog={handleLogSubmission} handlePlateAnalysis={handlePlateAnalysis} />
      
      {pageSpecificFoodLogs.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Logs on this Page (Last 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {pageSpecificFoodLogs.map(log => (
                <li key={log.id} className="text-sm p-2 border rounded-md bg-muted/50">
                  {log.foodItems.join(', ')} - {log.calories ? `${log.calories} kcal` : 'Calories N/A'} ({log.method})
                  {log.analysis && <span className="text-xs block text-muted-foreground">Health Score: {log.analysis.plateHealthScore}/100</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
