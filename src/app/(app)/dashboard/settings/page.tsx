// src/app/(app)/dashboard/settings/page.tsx
'use client';

import { useState, ChangeEvent, useEffect, useCallback } from 'react';
// Image component is no longer needed here for profile pic display in form
// import Image from 'next/image'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, UserCircle, Edit3, Save, AlertTriangle, Loader2 } from 'lucide-react'; // Removed UploadCloud
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
import { updateUserProfileDetailsAction, type UserProfileData } from '@/lib/actions'; // No longer need updateUserProfileWithPic
import { useFoodLog } from '@/contexts/FoodLogContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/init'; 
import { updateProfile } from 'firebase/auth';


const initialFormUserDataState: Pick<UserProfileData, 'name' | 'weight' | 'height' | 'plan' | 'goal'> = {
  name: '',
  // profilePicUrl removed
  weight: '',
  height: '',
  plan: 'mindful_eating',
  goal: '',
};

export default function SettingsPage() {
  const [userData, setUserData] = useState(initialFormUserDataState);
  // profilePicFile and profilePicPreview states removed
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [moodRemindersEnabled, setMoodRemindersEnabled] = useState(false);

  const { toast } = useToast();
  const { currentUser, isLoadingAuth, userProfile, fetchCurrentUserProfile } = useFoodLog();
  const router = useRouter();

  useEffect(() => {
    console.log("[SettingsPage] Profile Data Effect: isLoadingAuth:", isLoadingAuth, "currentUser:", !!currentUser, "context.userProfile:", userProfile);
    if (!isLoadingAuth && currentUser) {
      if (userProfile) {
        console.log("[SettingsPage] Hydrating from context.userProfile:", userProfile);
        setUserData({
          name: userProfile.name || currentUser.displayName || '',
          // profilePicUrl removed from here
          weight: userProfile.weight || '',
          height: userProfile.height || '',
          plan: userProfile.plan || 'mindful_eating',
          goal: userProfile.goal || '',
        });
        // setProfilePicPreview removed
        setIsProfileLoading(false);
      } else {
        console.log("[SettingsPage] currentUser exists, but context.userProfile is null. Triggering fetchCurrentUserProfile.");
        setIsProfileLoading(true); 
        fetchCurrentUserProfile();
      }
    } else if (!isLoadingAuth && !currentUser) {
      setIsProfileLoading(false); 
    }
  }, [isLoadingAuth, currentUser, userProfile, fetchCurrentUserProfile]);


  useEffect(() => {
    const currentThemeIsDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(currentThemeIsDark);
    
    const themeObserver = new MutationObserver(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const savedMoodReminders = localStorage.getItem('moodRemindersEnabled');
    if (savedMoodReminders) {
      setMoodRemindersEnabled(savedMoodReminders === 'true');
    }
    
    return () => themeObserver.disconnect();
  }, []);

  const toggleDarkMode = () => {
    const newModeIsDark = !document.documentElement.classList.contains('dark');
    if (newModeIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setIsDarkMode(newModeIsDark); 
  };

  const handleMoodRemindersToggle = (checked: boolean) => {
    setMoodRemindersEnabled(checked);
    localStorage.setItem('moodRemindersEnabled', checked.toString());
    toast({
      title: `Mood Reminders ${checked ? 'Enabled' : 'Disabled'}`,
      description: `You will now be reminded to log your mood.`,
    });
  };


  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanChange = (value: string) => {
    setUserData(prev => ({ ...prev, plan: value as UserProfileData['plan'] }));
  };

  // handleProfilePicChange function removed

  const handleProfileUpdate = async () => {
    if (!currentUser || !auth.currentUser) { 
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    setIsSaving(true);

    const profileDetailsForAction: UserProfileData = { // Using UserProfileData as the action expects specific fields
      uid: currentUser.uid, // Not strictly needed by updateUserProfileDetailsAction, but good for consistency
      name: userData.name || '',
      email: currentUser.email, // Not updated by this action, but part of UserProfileData
      weight: userData.weight || '',
      height: userData.height || '',
      plan: userData.plan || 'mindful_eating',
      goal: userData.goal || '',
      isProfileComplete: true, // Assuming saving settings completes the profile
      // profilePicUrl is not part of this update anymore
    };
    
    // We will call updateUserProfileDetailsAction now, which doesn't handle pictures
    const result = await updateUserProfileDetailsAction(currentUser.uid, {
        name: profileDetailsForAction.name,
        weight: profileDetailsForAction.weight,
        height: profileDetailsForAction.height,
        plan: profileDetailsForAction.plan as UserProfileData['plan'], // Ensure type casting if needed
        goal: profileDetailsForAction.goal
    });


    if (result.success) {
      // Update Firebase Auth user's displayName if it changed
      const currentAuthDisplayName = auth.currentUser.displayName;    
      if (profileDetailsForAction.name && profileDetailsForAction.name !== currentAuthDisplayName) {
         try {
           if (auth.currentUser) {
             await updateProfile(auth.currentUser, { displayName: profileDetailsForAction.name });
             console.log("[SettingsPage] Client-side Firebase Auth displayName updated to:", profileDetailsForAction.name);
           }
         } catch (authError) {
          console.error("[SettingsPage] Error updating client-side Firebase Auth displayName:", authError);
         }
      }
      
      toast({
        title: 'Profile Updated!',
        description: 'Your profile information has been successfully updated.',
      });
      
      await fetchCurrentUserProfile(); 
      
      setIsEditingProfile(false);
      // setProfilePicFile(null); // No longer needed

    } else {
      toast({
        title: 'Update Failed',
        description: result.error || 'Could not update profile. Please try again.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  if (isLoadingAuth || isProfileLoading) {
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
                {/* Skeleton for profile picture area can be removed or simplified */}
                <Skeleton className="h-16 w-16 rounded-full" /> 
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

            {/* Profile Picture Display and Upload UI Removed */}
            {/* The sidebar will display the default avatar or whatever is on Firebase Auth user.photoURL */}

            <div className="space-y-4 w-full pt-4"> {/* Added pt-4 for spacing if profile pic UI was above */}
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={userData.name || ''} onChange={handleInputChange} disabled={!isEditingProfile || isSaving} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={currentUser?.email || ''} disabled className="mt-1 bg-muted/50" />
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
                    Get reminders to log your mood.
                  </span>
                </Label>
                <Switch 
                  id="mood-reminders" 
                  checked={moodRemindersEnabled}
                  onCheckedChange={handleMoodRemindersToggle}
                />
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
