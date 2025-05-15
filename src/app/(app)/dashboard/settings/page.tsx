// src/app/(app)/dashboard/settings/page.tsx
'use client';

import { useState, ChangeEvent, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, UserCircle, UploadCloud, Edit3, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserProfileWithPic, type UserProfileData } from '@/lib/actions'; 
import { useFoodLog } from '@/contexts/FoodLogContext'; 
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

// Adjusted initialUserDataState to match UserProfileData structure used in the form more closely.
// Email is from currentUser, uid/createdAt/updatedAt are managed by Firestore/Auth.
const initialFormUserDataState: Pick<UserProfileData, 'name' | 'profilePicUrl' | 'weight' | 'height' | 'plan' | 'goal'> = {
  name: '',
  profilePicUrl: '',
  weight: '', 
  height: '', 
  plan: 'mindful_eating', 
  goal: '', 
};

export default function SettingsPage() {
  const [userData, setUserData] = useState(initialFormUserDataState);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const { currentUser, isLoadingAuth, userProfile, fetchCurrentUserProfile } = useFoodLog(); 
  const router = useRouter();

  const loadProfileData = useCallback(() => {
    if (userProfile) { 
      setUserData({
        name: userProfile.name || currentUser?.displayName || '',
        profilePicUrl: userProfile.profilePicUrl || currentUser?.photoURL || '',
        weight: userProfile.weight || '',
        height: userProfile.height || '',
        plan: userProfile.plan || 'mindful_eating',
        goal: userProfile.goal || '',
      });
      setProfilePicPreview(userProfile.profilePicUrl || currentUser?.photoURL || null);
      setIsProfileLoading(false);
    } else if (currentUser && !isLoadingAuth) { // If userProfile is not yet available but auth is resolved
       setUserData({
        name: currentUser.displayName || '',
        profilePicUrl: currentUser.photoURL || '',
        weight: '', // Default to empty if no Firestore profile yet
        height: '', 
        plan: 'mindful_eating', 
        goal: '',
      });
      setProfilePicPreview(currentUser.photoURL || null);
      setIsProfileLoading(false); // No Firestore profile to load, or already attempted
    } else if (!isLoadingAuth && !currentUser) {
      // No user, nothing to load, stop loading state
      setIsProfileLoading(false); 
    }
    // If isLoadingAuth is true, or currentUser is null but isLoadingAuth is still true, isProfileLoading remains true.
  }, [currentUser, userProfile, isLoadingAuth]);

  useEffect(() => {
    // This effect ensures profile data is loaded or defaults are set when auth state is resolved.
    if (!isLoadingAuth) {
        if (currentUser && !userProfile) { 
            // Attempt to fetch profile if auth user exists but context profile is missing
            // This will trigger a re-render and loadProfileData will run again.
            fetchCurrentUserProfile(); 
        }
        loadProfileData(); // Load data based on current context state
    }
  }, [isLoadingAuth, currentUser, userProfile, loadProfileData, fetchCurrentUserProfile]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (typeof window !== 'undefined') {
        if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      }
      return newMode;
    });
  };


  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanChange = (value: string) => {
    setUserData(prev => ({ ...prev, plan: value as UserProfileData['plan'] }));
  };

  const handleProfilePicChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (!currentUser) {
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    
    const profileDataForAction: Pick<UserProfileData, 'name' | 'weight' | 'height' | 'plan' | 'goal'> = {
      name: userData.name || '', // Ensure name is always a string
      weight: userData.weight || '',
      height: userData.height || '',
      plan: userData.plan || 'mindful_eating',
      goal: userData.goal || '',
    };

    const result = await updateUserProfileWithPic(
      currentUser.uid, 
      currentUser.displayName, 
      currentUser.photoURL,    
      profileDataForAction, 
      profilePicFile
    );

    setIsSaving(false);

    if (result.success) {
      toast({
        title: 'Profile Updated!',
        description: 'Your profile information has been successfully updated.',
      });
      // Update local state with the new profile picture URL if it was changed
      // and potentially other fields if the action returns the full updated profile.
      if (result.profilePicUrl) {
        setProfilePicPreview(result.profilePicUrl);
        // Optionally, update userData.profilePicUrl if it's part of UserProfileData state
         setUserData(prev => ({ ...prev, profilePicUrl: result.profilePicUrl! })); 
      }
      // Re-fetch the profile from Firestore to update the context and local state thoroughly
      await fetchCurrentUserProfile(); 
      setIsEditingProfile(false); // Exit editing mode

    } else {
      toast({
        title: 'Update Failed',
        description: result.error || 'Could not update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (isLoadingAuth || (isProfileLoading && currentUser) ) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4 p-6 border rounded-lg shadow-sm">
              <Skeleton className="h-6 w-1/4 mb-4" />
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-grow space-y-4 w-full">
                  <div>
                    <Skeleton className="h-4 w-1/6 mb-1" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-1/6 mb-1" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            </div>
             <div className="space-y-4 p-6 border rounded-lg shadow-sm">
              <Skeleton className="h-6 w-1/4 mb-4" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full mb-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If auth is resolved and there's no current user, show "Not Authenticated"
  if (!currentUser && !isLoadingAuth) { 
    return (
        <div className="max-w-5xl mx-auto space-y-8 flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4 md:p-6 lg:p-8">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold">Not Authenticated</h2>
            <p className="text-muted-foreground">Please log in to manage your settings.</p>
            <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
        </div>
    );
  }


  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-primary">
            <UserCircle className="mr-3 h-7 w-7" />
            Your Profile
          </CardTitle>
          <CardDescription>Manage your personal information and preferences. Your data is saved securely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4 p-6 border rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Personal Information</h3>
              <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(!isEditingProfile)} disabled={isSaving}>
                {isEditingProfile ? <Save className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
                {isEditingProfile ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
              </Button>
            </div>

            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <Image
                  src={profilePicPreview || 'https://placehold.co/100x100.png'}
                  alt="Profile Picture"
                  width={100}
                  height={100}
                  className="rounded-full object-cover h-24 w-24 border-2 border-primary"
                  data-ai-hint="user avatar"
                  key={profilePicPreview || currentUser?.uid || 'default-avatar'} 
                />
                {isEditingProfile && (
                  <Label
                    htmlFor="profilePic"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90"
                    title="Change profile picture"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <Input id="profilePic" type="file" className="sr-only" accept="image/*" onChange={handleProfilePicChange} disabled={isSaving} />
                  </Label>
                )}
              </div>
              <div className="flex-grow space-y-4 w-full">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" value={userData.name || ''} onChange={handleInputChange} disabled={!isEditingProfile || isSaving} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={currentUser?.email || ''} disabled className="mt-1 bg-muted/50" />
                </div>
              </div>
            </div>

            {isEditingProfile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input id="weight" name="weight" type="number" value={userData.weight || ''} onChange={handleInputChange} placeholder="e.g., 70" className="mt-1" disabled={isSaving} />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input id="height" name="height" type="number" value={userData.height || ''} onChange={handleInputChange} placeholder="e.g., 175" className="mt-1" disabled={isSaving} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="plan">Primary Goal</Label>
                   <Select name="plan" value={userData.plan || 'mindful_eating'} onValueChange={handlePlanChange} disabled={!isEditingProfile || isSaving}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select your primary goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="maintenance">Weight Maintenance</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                       <SelectItem value="mindful_eating">Mindful Eating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="goal">Specific Goal Details</Label>
                  <Textarea id="goal" name="goal" value={userData.goal || ''} onChange={handleInputChange} placeholder="e.g., Eat more vegetables, reduce sugar intake" className="mt-1" disabled={isSaving} />
                </div>
              </div>
            )}
             {isEditingProfile && (
              <Button onClick={handleProfileUpdate} className="w-full sm:w-auto mt-6 bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            )}
          </div>

          <div className="space-y-4 p-6 border rounded-lg shadow-sm">
             <h3 className="text-xl font-semibold flex items-center"><SettingsIcon className="mr-2 h-5 w-5" />App Settings</h3>
            <div className="space-y-2">
              <h4 className="text-md font-medium">Notification Preferences</h4>
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                <Label htmlFor="daily-summary" className="flex flex-col space-y-1 text-sm">
                  <span>Daily Summary</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                    Receive a daily summary of your logs and insights. (Feature not implemented)
                  </span>
                </Label>
                <Switch id="daily-summary" defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                <Label htmlFor="mood-reminders" className="flex flex-col space-y-1 text-sm">
                  <span>Mood Reminders</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                    Get reminders to log your mood. (Feature not implemented)
                  </span>
                </Label>
                <Switch id="mood-reminders" disabled/>
              </div>
               <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                <Label htmlFor="insight-notifications" className="flex flex-col space-y-1 text-sm">
                  <span>New Insight Alerts</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                    Notify me when new AI insights are available. (Feature not implemented)
                  </span>
                </Label>
                <Switch id="insight-notifications" defaultChecked disabled/>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-md font-medium">Theme</h4>
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                <Label htmlFor="dark-mode" className="flex flex-col space-y-1 text-sm">
                  <span>Dark Mode</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                    Enable dark theme for the application.
                  </span>
                </Label>
                <Switch 
                  id="dark-mode" 
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h4 className="text-md font-medium">Account Actions</h4>
              <Button variant="destructive" className="w-full sm:w-auto" disabled>Delete Account (Not Implemented)</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

