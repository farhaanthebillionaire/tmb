// src/components/dashboard/FoodLoggingCard.tsx
'use client';

import type { AnalyzePlateOutput } from '@/ai/flows/analyze-plate';
import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Utensils, Camera, FileImage, PlusCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFoodLog, type FullFoodLog } from '@/contexts/FoodLogContext';

interface FoodLoggingCardProps {
  addFoodLog: (log: Omit<FullFoodLog, 'id'>) => Promise<FullFoodLog | null>; // Updated prop type
  handlePlateAnalysis: (photoDataUri: string) => Promise<AnalyzePlateOutput>;
}

export function FoodLoggingCard({ addFoodLog, handlePlateAnalysis }: FoodLoggingCardProps) {
  const [textInput, setTextInput] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useFoodLog();

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const logFoodByText = async () => {
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to add food items.", variant: "destructive" });
      return;
    }
    if (!textInput.trim()) {
      toast({ title: "Empty Input", description: "Please enter food items.", variant: "destructive" });
      return;
    }
    const newLogData: Omit<FullFoodLog, 'id'> = {
      timestamp: new Date().toISOString(),
      foodItems: textInput.split(',').map(item => item.trim()),
      calories: caloriesInput ? parseInt(caloriesInput, 10) : undefined,
      method: 'text',
    };
    const loggedItem = await addFoodLog(newLogData);
    if (loggedItem) {
      setTextInput('');
      setCaloriesInput('');
      toast({ title: "Food Logged!", description: `${loggedItem.foodItems.join(', ')} added.` });
    } else {
      toast({ title: "Failed to Log", description: "Could not save your food log.", variant: "destructive" });
    }
  };

  const logFoodByImage = async () => {
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to analyze and add meals.", variant: "destructive" });
      return;
    }
    if (!imageFile || !imagePreview) {
      toast({ title: "No Image", description: "Please upload an image of your meal.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const analysisResult = await handlePlateAnalysis(imagePreview);
      const newLogData: Omit<FullFoodLog, 'id'> = {
        timestamp: new Date().toISOString(),
        foodItems: [analysisResult.nutritionalContent.split('.')[0] || 'Analyzed Meal'], 
        calories: analysisResult.calorieEstimate,
        method: 'image',
        analysis: analysisResult,
      };
      const loggedItem = await addFoodLog(newLogData);
      if (loggedItem) {
        setImageFile(null);
        setImagePreview(null);
        toast({ title: "Meal Analyzed & Logged!", description: `Estimated ${analysisResult.calorieEstimate} calories.` });
      } else {
        toast({ title: "Failed to Log", description: "Could not save your analyzed meal log.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error analyzing or logging image:", error);
      let errorMessage = "Could not analyze or log image. Please try again.";
      if (error.message && error.message.includes("AI plate analysis failed")) {
        errorMessage = error.message; 
      }
      toast({ title: "Operation Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const isSubmitDisabled = isLoadingAuth || !currentUser;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary">
            <PlusCircle className="mr-2 h-6 w-6" />
            Meal Entry
        </CardTitle>
        <CardDescription>Add food items you've consumed using text or image.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <Tabs defaultValue="text" className="w-full flex flex-col flex-grow">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="text"><Utensils className="mr-1 h-4 w-4 sm:mr-2" />Text</TabsTrigger>
            <TabsTrigger value="image"><Camera className="mr-1 h-4 w-4 sm:mr-2" />Image</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-2 flex-grow flex flex-col">
            <div className="flex-grow space-y-2">
              <div>
                <Label htmlFor="food-text">Food Items (comma-separated)</Label>
                <Textarea
                  id="food-text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g., Apple, Banana, Chicken Salad"
                  className="mt-1 min-h-[60px] resize-none"
                  disabled={isSubmitDisabled}
                />
              </div>
              <div>
                <Label htmlFor="calories-text">Calories (optional)</Label>
                <Input
                  id="calories-text"
                  type="number"
                  value={caloriesInput}
                  onChange={(e) => setCaloriesInput(e.target.value)}
                  placeholder="e.g., 350"
                  className="mt-1"
                  disabled={isSubmitDisabled}
                />
              </div>
            </div>
            <Button 
              onClick={logFoodByText} 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-auto"
              disabled={isSubmitDisabled || !textInput.trim()}
            >
              {isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoadingAuth ? 'Loading...' : 'Log with Text'}
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-2 flex-grow flex flex-col">
            <div className="mt-1 flex flex-grow justify-center rounded-md border-2 border-dashed border-border px-4 py-3 hover:border-primary transition-colors min-h-[120px]">
            <div className="space-y-1 text-center flex flex-col justify-center items-center">
              {imagePreview ? (
                <Image src={imagePreview} alt="Meal preview" width={150} height={75} className="mx-auto max-h-24 w-auto rounded-md object-contain" data-ai-hint="food meal" />
              ) : (
                <FileImage className="mx-auto h-10 w-10 text-muted-foreground" />
              )}
              <div className="flex text-sm text-muted-foreground">
                <Label
                  htmlFor="food-image-input"
                  className={`relative cursor-pointer rounded-md bg-background font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${isSubmitDisabled || isAnalyzing ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span>Upload meal photo</span>
                  <Input id="food-image-input" name="food-image-input" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={isAnalyzing || isSubmitDisabled} />
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
            <Button 
              onClick={logFoodByImage} 
              disabled={isSubmitDisabled || !imageFile || isAnalyzing} 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-auto"
            >
              {isAnalyzing || isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoadingAuth ? 'Loading...' : (isAnalyzing ? 'Analyzing & Logging...' : 'Analyze & Log Image')}
            </Button>
          </TabsContent>
        </Tabs>
        {isSubmitDisabled && !isLoadingAuth && (
            <Alert variant="default" className="mt-4 text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                Please log in to log your meals.
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}

