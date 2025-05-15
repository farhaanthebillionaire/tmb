// src/components/dashboard/MoodFoodInsightsCard.tsx
'use client';

import type { MoodFoodInsightsOutput } from '@/ai/flows/mood-food-insights';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/shared/GlassCard';
import { Brain, Zap, Lightbulb } from 'lucide-react';

interface MoodFoodInsightsCardProps {
  insights: MoodFoodInsightsOutput | null;
}

export function MoodFoodInsightsCard({ insights }: MoodFoodInsightsCardProps) {
  if (!insights) {
    return (
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-primary">
            <Brain className="mr-2 h-6 w-6" />
            Mood-Food Insights
          </CardTitle>
          <CardDescription>AI-powered analysis of your eating habits and mood patterns.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground text-center">Log some meals and moods, then click "Get Mood-Food Insights" to see your personalized analysis here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center text-2xl font-bold text-primary">
          <Brain className="mr-3 h-7 w-7" />
          Your Personalized Insights
        </CardTitle>
        <CardDescription className="text-base">Discover connections between what you eat and how you feel.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6 flex-grow overflow-y-auto">
        {insights.patterns.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
              <Zap className="mr-2 h-5 w-5 text-accent" />
              Identified Patterns
            </h3>
            <ul className="space-y-3">
              {insights.patterns.map((pattern, index) => (
                <li key={index}>
                  <GlassCard className="p-4 rounded-lg text-sm">
                    <p className="text-foreground">{pattern}</p>
                  </GlassCard>
                </li>
              ))}
            </ul>
          </div>
        )}

        {insights.suggestions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-accent" />
              AI Suggestions for Healthier Habits
            </h3>
            <ul className="space-y-3">
              {insights.suggestions.map((suggestion, index) => (
                <li key={index}>
                   <GlassCard className="p-4 rounded-lg text-sm">
                    <p className="text-foreground">{suggestion}</p>
                  </GlassCard>
                </li>
              ))}
            </ul>
          </div>
        )}

        {insights.patterns.length === 0 && insights.suggestions.length === 0 && (
           <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground text-center py-4">No specific patterns or suggestions could be identified with the current data. Keep logging consistently for better insights!</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
