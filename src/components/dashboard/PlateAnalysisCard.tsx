
// src/components/dashboard/PlateAnalysisCard.tsx
'use client';

import type { AnalyzePlateOutput } from '@/ai/flows/analyze-plate';
import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Percent, BarChartBig, Sparkles, UploadCloud, FileImage, Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GlassCard } from '@/components/shared/GlassCard';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface PlateAnalysisCardProps {
  handlePlateAnalysis: (photoDataUri: string) => Promise<AnalyzePlateOutput>;
  onAnalysisComplete?: (analysis: AnalyzePlateOutput) => void;
  showCameraOption?: boolean; // Added to control camera button visibility
}

export function PlateAnalysisCard({ handlePlateAnalysis, onAnalysisComplete, showCameraOption = true }: PlateAnalysisCardProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePlateOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null); // null means permission not yet requested/determined
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (showLiveCamera) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions to use this feature.',
          });
          setShowLiveCamera(false); // Hide camera view if permission denied
        }
      }
    };

    getCameraPermission();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Also ensure to stop tracks if srcObject was set directly
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null; // Important to release the camera
      }
    };
  }, [showLiveCamera, toast]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setAnalysisResult(null);
      setShowLiveCamera(false); // Hide camera if file is uploaded
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
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
        setFile(null); // Clear any selected file if image is captured
        setShowLiveCamera(false); // Hide camera view after capture
        
        // Convert data URI to File object (optional, but good practice if 'file' state is primary)
        fetch(dataUri)
          .then(res => res.blob())
          .then(blob => {
            const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
            setFile(capturedFile); // Set the captured image as a file
          });
      }
    }
  };


  const handleSubmit = async () => {
    if (!imagePreview && !file) { // Check if either imagePreview (from capture) or file (from upload) exists
      setError('Please select an image file or capture from camera.');
      return;
    }
    if (!imagePreview) { // Ensure imagePreview has data before sending to analysis
        setError('No image data available to analyze.');
        return;
    }


    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await handlePlateAnalysis(imagePreview); // Pass imagePreview which holds the data URI
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete!",
        description: `Your plate scored ${result.plateHealthScore}/100.`,
        action: <CheckCircle2 className="text-green-500" />,
      });
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Plate analysis failed:', err);
      setError('Failed to analyze plate. Please try again.');
      toast({
        title: "Analysis Failed",
        description: "Something went wrong. Please try another image or try again later.",
        variant: "destructive",
        action: <AlertCircle className="text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary">
          <Sparkles className="mr-2 h-6 w-6" />
          AI Plate Analyzer
        </CardTitle>
        <CardDescription>Upload a photo of your meal for AI-powered nutritional insights.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow flex flex-col">

        {showLiveCamera ? (
          <div className="space-y-2 flex flex-col items-center">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
            {hasCameraPermission === false && ( // Only show if permission explicitly denied
              <Alert variant="destructive" className="w-full">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use this feature. You might need to refresh the page after granting permissions.
                </AlertDescription>
              </Alert>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2 mt-2">
              <Button onClick={handleCaptureImage} disabled={!hasCameraPermission || hasCameraPermission === null} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Camera className="mr-2 h-4 w-4" /> Capture
              </Button>
              <Button variant="outline" onClick={() => setShowLiveCamera(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            {imagePreview && (
              <div className="mb-2 flex justify-center">
                <Image src={imagePreview} alt="Meal preview" width={200} height={150} className="mx-auto max-h-40 w-auto rounded-md object-contain" data-ai-hint="healthy meal"/>
              </div>
            )}
            <div className="flex-grow flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border p-4 hover:border-primary transition-colors min-h-[150px]">
              <div className="space-y-1 text-center flex flex-col justify-center items-center">
                {!imagePreview && <FileImage className="mx-auto h-10 w-10 text-muted-foreground" />}
                <div className="flex text-sm text-muted-foreground">
                  <Label
                    htmlFor="plate-image-input-analyzer" // Ensure this ID is unique if multiple instances are on a page.
                    className="relative cursor-pointer rounded-md bg-background font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  >
                    <span>{imagePreview ? 'Change image' : 'Upload a file'}</span>
                    <Input id="plate-image-input-analyzer" name="plate-image-input-analyzer" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
                  </Label>
                  {!imagePreview && <p className="pl-1">or drag and drop</p>}
                </div>
                {!imagePreview && <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>}
              </div>
            </div>
            {showCameraOption && (
              <Button variant="outline" onClick={() => { setShowLiveCamera(true); setImagePreview(null); setFile(null); setAnalysisResult(null); setError(null); }} className="w-full mt-2">
                <Camera className="mr-2 h-4 w-4" /> Use Camera
              </Button>
            )}
          </>
        )}


        {isLoading && (
          <div className="space-y-1 pt-2">
            <Progress value={undefined} className="w-full animate-pulse h-2" /> {/* Changed to indeterminate */}
            <p className="text-xs text-muted-foreground text-center">Analyzing your plate...</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center pt-2"><AlertCircle className="mr-1 h-4 w-4" /> {error}</p>
        )}

        {analysisResult && !isLoading && (
          <GlassCard className="p-3 rounded-lg mt-2">
            <h3 className="text-md font-semibold text-primary mb-2">Analysis Results:</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground flex items-center"><BarChartBig className="mr-1 h-3 w-3 text-primary/80" />Calorie Estimate:</span>
                <span className="font-semibold text-primary">{analysisResult.calorieEstimate.toLocaleString()} kcal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground flex items-center"><Percent className="mr-1 h-3 w-3 text-primary/80" />Plate Health Score:</span>
                <span className="font-semibold text-primary">{analysisResult.plateHealthScore} / 100</span>
              </div>
              <div>
                <span className="font-medium text-foreground block mb-1">Nutritional Content:</span>
                {/* Added text-wrap and break-words for better text flow */}
                <p className="text-sm text-foreground/90 bg-background/60 p-2 rounded-md text-wrap break-words leading-relaxed shadow-inner">
                  {analysisResult.nutritionalContent}
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </CardContent>
      <CardFooter className="mt-auto pt-2">
        <Button onClick={handleSubmit} disabled={(!file && !imagePreview) || isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {isLoading ? 'Analyzing...' : 'Analyze Plate'}
        </Button>
      </CardFooter>
    </Card>
  );
}
