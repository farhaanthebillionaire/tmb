
// src/app/(app)/dashboard/analyze-plate/page.tsx
'use client';

import { PlateAnalysisCard } from '@/components/dashboard/PlateAnalysisCard';
import { handlePlateAnalysis } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { useFoodLog } from '@/contexts/FoodLogContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyzePlatePage() {
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useFoodLog();
  const router = useRouter();

  if (isLoadingAuth) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-10 w-1/2 mb-2" />
          <Skeleton className="h-6 w-3/4 mb-6" />
          <Skeleton className="h-64 w-full" /> 
          <Skeleton className="h-10 w-full mt-4" />
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
          Please log in to use the AI Plate Analyzer.
        </p>
        <Button onClick={() => router.push('/login')} className="mt-6">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <PlateAnalysisCard
          handlePlateAnalysis={handlePlateAnalysis}
          onAnalysisComplete={(analysis) => {
            toast({
              title: 'Plate Analyzed!',
              description: `Estimated ${analysis.calorieEstimate} calories. Health Score: ${analysis.plateHealthScore}/100.`,
            });
          }}
          showCameraOption={true} 
        />
      </div>
    </div>
  );
}
