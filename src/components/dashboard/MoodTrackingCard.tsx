// src/components/dashboard/MoodTrackingCard.tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider'; 
import { MessageSquareHeart, Smile, Meh, Frown, Laugh, Angry } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface MoodLog {
  id: string;
  timestamp: string;
  mood: string; 
  intensity: number; 
}

interface MoodTrackingCardProps {
  addMoodLog: (log: MoodLog) => void;
}

const moodOptions = [
  { value: 1, emoji: <Frown className="h-8 w-8 text-red-500" />, label: 'Very Unhappy' },
  { value: 2, emoji: <Meh className="h-8 w-8 text-orange-500" />, label: 'Unhappy' },
  { value: 3, emoji: <Smile className="h-8 w-8 text-yellow-500" />, label: 'Neutral' },
  { value: 4, emoji: <Smile className="h-8 w-8 text-lime-500" />, label: 'Happy' },
  { value: 5, emoji: <Laugh className="h-8 w-8 text-green-500" />, label: 'Very Happy' },
];


export function MoodTrackingCard({ addMoodLog }: MoodTrackingCardProps) {
  const [moodValue, setMoodValue] = useState<number[]>([3]); 
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const selectedMood = moodOptions.find(opt => opt.value === moodValue[0]) || moodOptions[2];

  const handleLogMood = () => {
    const newLog: MoodLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      mood: selectedMood.label,
      intensity: moodValue[0],
    };
    addMoodLog(newLog);
    setNotes(''); 
    toast({ title: "Mood Logged!", description: `You're feeling ${selectedMood.label.toLowerCase()}.` });
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary">
            <MessageSquareHeart className="mr-2 h-6 w-6" />
            Track Your Mood
        </CardTitle>
        <CardDescription>How are you feeling right now? Log your mood to see patterns.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow flex flex-col justify-center"> {/* Reduced space-y */}
        <div className="text-center">
          <div className="text-5xl mb-2 flex justify-center items-center"> {/* Reduced emoji size and mb */}
            {selectedMood.emoji}
          </div>
          <p className="text-md font-medium text-foreground">{selectedMood.label}</p> {/* Reduced text size */}
        </div>
        <div>
          <Label htmlFor="mood-slider" className="sr-only">Mood Slider</Label>
          <Slider
            id="mood-slider"
            min={1}
            max={5}
            step={1}
            value={moodValue}
            onValueChange={setMoodValue}
            className="my-2" // Reduced margin
          />
           <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>{moodOptions[0].label}</span>
            <span>{moodOptions[moodOptions.length -1].label}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2"> {/* Added pt-2 to ensure some padding */}
        <Button onClick={handleLogMood} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Log Mood</Button>
      </CardFooter>
    </Card>
  );
}
