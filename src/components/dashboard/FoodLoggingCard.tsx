// src/components/dashboard/FoodLoggingCard.tsx
'use client';

import type { AnalyzePlateOutput } from '@/ai/flows/analyze-plate';
import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Utensils, Camera as CameraIcon, FileImage, PlusCircle, AlertCircle, Loader2, Video, XCircle, ImageDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFoodLog, type FullFoodLog } from '@/contexts/FoodLogContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FoodLoggingCardProps {
  addFoodLog: (log: Omit<FullFoodLog, 'id'>) => Promise<FullFoodLog | null>;
  handlePlateAnalysis: (photoDataUri: string) => Promise<AnalyzePlateOutput>;
}

const mealTypes = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "random", label: "Random/Other" },
];

export function FoodLoggingCard({ addFoodLog, handlePlateAnalysis }: FoodLoggingCardProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [mealType, setMealType] = useState<string>(mealTypes[0].value);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useFoodLog(); // Use context to get auth state

  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraStream = async () => {
      if (showLiveCamera) {
        try {
          // First, try to get the back camera
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          console.log("Using environment (back) camera.");
        } catch (errEnvironment) {
          console.warn('Failed to get environment (back) camera, trying default:', errEnvironment);
          // If back camera fails, try to get any camera (likely front)
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            console.log("Using default (front or other) camera.");
          } catch (errDefault) {
            console.error('Error accessing any camera:', errDefault);
            setHasCameraPermission(false);
            let description = 'Please enable camera permissions in your browser settings to use this app.';
            if ((errEnvironment as Error).name === 'NotFoundError' || (errEnvironment as Error).name === 'DevicesNotFoundError') {
                description = 'Could not find a suitable camera. Please ensure one is connected and enabled.';
            } else if ((errEnvironment as Error).name === 'NotAllowedError' || (errEnvironment as Error).name === 'PermissionDeniedError') {
                description = 'Camera access was denied. Please enable camera permissions in your browser settings.';
            }
            toast({
              variant: 'destructive',
              title: 'Camera Access Issue',
              description: description,
            });
            setShowLiveCamera(false); 
          }
        }
      }
    };

    getCameraStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [showLiveCamera, toast]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowLiveCamera(false); 
    }
  };

  const openCamera = () => {
    setImageFile(null);
    setImagePreview(null);
    setShowLiveCamera(true);
    setHasCameraPermission(null); 
  };

  const closeCamera = () => {
    setShowLiveCamera(false);
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
  };

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUri);
        fetch(dataUri)
          .then(res => res.blob())
          .then(blob => {
            const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
            setImageFile(capturedFile);
          });
      }
      closeCamera(); 
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
      mealType: mealType,
    };
    const loggedItem = await addFoodLog(newLogData);
    if (loggedItem) {
      setTextInput('');
      setCaloriesInput('');
      toast({ title: "Food Logged!", description: `${loggedItem.foodItems.join(', ')} (${loggedItem.mealType || 'Meal'}) added.` });
    } else {
      toast({ title: "Failed to Log", description: "Could not save your food log.", variant: "destructive" });
    }
  };

  const logFoodByImageOrCamera = async () => {
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to analyze and add meals.", variant: "destructive" });
      return;
    }
    if (!imageFile && !imagePreview) { // Check both: imageFile for uploads, imagePreview for captures
      toast({ title: "No Image", description: "Please upload an image or capture one with your camera.", variant: "destructive" });
      return;
    }
    if (!imagePreview) { // Ensure imagePreview has data for analysis
        toast({ title: "No Image Data", description: "Image data is missing for analysis.", variant: "destructive" });
        return;
    }

    setIsAnalyzing(true);
    try {
      const analysisResult = await handlePlateAnalysis(imagePreview);
      const foodDescription = analysisResult.nutritionalContent.split('.')[0].trim() || 'Analyzed Meal';
      
      const newLogData: Omit<FullFoodLog, 'id'> = {
        timestamp: new Date().toISOString(),
        foodItems: [foodDescription], 
        calories: analysisResult.calorieEstimate,
        method: 'image', 
        mealType: mealType,
        analysis: analysisResult,
      };
      const loggedItem = await addFoodLog(newLogData);
      if (loggedItem) {
        setImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        toast({ title: "Meal Analyzed & Logged!", description: `${foodDescription} (${loggedItem.mealType || 'Meal'}) - Estimated ${analysisResult.calorieEstimate} calories.` });
      } else {
        toast({ title: "Failed to Log", description: "Could not save your analyzed meal log.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error analyzing or logging image:", error);
      let errorMessage = "Could not analyze or log image. Please try again.";
       if (error.message && (error.message.includes("AI plate analysis failed") || error.message.toLowerCase().includes("model not found"))) {
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
        <CardDescription>Add food items, select meal type, and log using text, image upload, or your camera.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="mb-4">
          <Label htmlFor="meal-type">Meal Type</Label>
          <Select value={mealType} onValueChange={setMealType} disabled={isSubmitDisabled}>
            <SelectTrigger id="meal-type" className="w-full mt-1">
              <SelectValue placeholder="Select meal type" />
            </SelectTrigger>
            <SelectContent>
              {mealTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="text"><Utensils className="mr-1 h-4 w-4 sm:mr-2" />Text</TabsTrigger>
            <TabsTrigger value="upload"><ImageDown className="mr-1 h-4 w-4 sm:mr-2" />Upload</TabsTrigger>
            <TabsTrigger value="camera"><CameraIcon className="mr-1 h-4 w-4 sm:mr-2" />Camera</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-3 flex-grow flex flex-col">
            <div className="flex-grow space-y-3">
              <div>
                <Label htmlFor="food-text">Food Items (comma-separated)</Label>
                <Textarea
                  id="food-text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g., Apple, Banana, Chicken Salad"
                  className="mt-1 min-h-[70px] resize-none"
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
              {isSubmitDisabled && !currentUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitDisabled && !currentUser ? 'Loading...' : 'Log with Text'}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3 flex-grow flex flex-col justify-between">
            <div className="mt-1 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border px-4 py-6 hover:border-primary transition-colors min-h-[150px] flex-grow">
              <div className="space-y-1 text-center">
                <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="flex text-sm text-muted-foreground">
                  <Label
                    htmlFor="food-image-input-upload"
                    className={`relative cursor-pointer rounded-md bg-background font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${isSubmitDisabled || isAnalyzing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <span>Upload meal photo</span>
                    <Input id="food-image-input-upload" name="food-image-input-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={isAnalyzing || isSubmitDisabled} ref={fileInputRef} />
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="camera" className="space-y-3 flex-grow flex flex-col items-center justify-between">
            <canvas ref={canvasRef} className="hidden" /> 
            {!showLiveCamera && !imagePreview && (
              <Button onClick={openCamera} variant="outline" className="w-full py-8 text-lg border-dashed border-2 hover:border-primary flex-grow flex items-center justify-center" disabled={isSubmitDisabled}>
                <Video className="mr-2 h-6 w-6" /> Open Camera
              </Button>
            )}
            {showLiveCamera && (
              <div className="w-full space-y-2 flex flex-col items-center">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted border" autoPlay muted playsInline />
                {hasCameraPermission === false && ( // Show this only if permission explicitly denied or no camera found
                  <Alert variant="destructive" className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Camera Access Issue</AlertTitle>
                    <AlertDescription>Could not access camera. Please ensure it's enabled and permissions are granted.</AlertDescription>
                  </Alert>
                )}
                 {hasCameraPermission === null && ( // Show this while waiting for permission
                  <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting camera access...
                  </div>
                )}
                <div className="flex gap-2 mt-2 w-full">
                  <Button onClick={handleCaptureImage} disabled={!hasCameraPermission || isSubmitDisabled || isAnalyzing} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    <CameraIcon className="mr-2 h-4 w-4" /> Capture
                  </Button>
                  <Button variant="outline" onClick={closeCamera} className="flex-1">
                     <XCircle className="mr-2 h-4 w-4" /> Close Camera
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {imagePreview && (activeTab === 'upload' || activeTab === 'camera') && (
          <div className="mt-4 p-2 border rounded-md bg-muted/30">
            <Label className="text-sm font-medium text-primary">Image Preview:</Label>
            <Image src={imagePreview} alt="Meal preview" width={200} height={150} className="mt-1 mx-auto max-h-40 w-auto rounded-md object-contain border" data-ai-hint="food meal" />
             <Button 
                variant="link" 
                size="sm" 
                className="text-destructive hover:text-destructive/80 w-full mt-1"
                onClick={() => { setImagePreview(null); setImageFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                disabled={isAnalyzing}
              >
                Clear Image
              </Button>
          </div>
        )}
        
        {(activeTab === 'upload' || activeTab === 'camera') && (
            <Button 
              onClick={logFoodByImageOrCamera} 
              disabled={isSubmitDisabled || (!imageFile && !imagePreview) || isAnalyzing} // check imagePreview as well for captured images
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mt-4"
            >
              {isAnalyzing || (isSubmitDisabled && !currentUser) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {(isSubmitDisabled && !currentUser) ? 'Loading...' : (isAnalyzing ? 'Analyzing...' : 'Analyze & Log Meal')}
            </Button>
        )}

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
