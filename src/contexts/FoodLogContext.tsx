// src/contexts/FoodLogContext.tsx
'use client';

import type { AnalyzePlateOutput } from '@/ai/flows/analyze-plate';
import { auth } from '@/lib/firebase/init';
import {
  fetchFoodLogs,
  submitFoodLog,
  fetchUserProfile as fetchUserProfileAction,
  type UserProfileData,
  fetchMoodLogs as fetchMoodLogsAction, // Import the mood log fetching action
  submitMoodLog as submitMoodLogAction // Import the mood log submission action
} from '@/lib/actions';
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useRef } from 'react';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, type User as FirebaseUserType } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import type { MoodLog as MoodLogTypeFromCard } from '@/components/dashboard/MoodTrackingCard'; // For MoodLog type

export interface BaseFoodLog {
  timestamp: string;
  foodItems: string[];
  calories?: number;
  method: 'text' | 'image';
  mealType?: string;
  analysis?: AnalyzePlateOutput;
}
export type FullFoodLog = BaseFoodLog & { id: string };

export type ExtendedUser = FirebaseUserType;

// Define MoodLog type for context, consistent with what will be stored/fetched
export type ContextMoodLog = MoodLogTypeFromCard & { id: string };


interface FoodLogContextType {
  foodLogs: FullFoodLog[];
  addFoodLog: (logData: Omit<FullFoodLog, "id">) => Promise<FullFoodLog | null>;
  currentCaloriesToday: number;
  todaysFoodLogs: FullFoodLog[];
  currentUser: ExtendedUser | null;
  isLoadingAuth: boolean;
  userProfile: UserProfileData | null;
  fetchCurrentUserProfile: () => Promise<void>;
  isLoadingLogs: boolean;
  // Add mood log related properties to context type
  moodLogs: ContextMoodLog[];
  addMoodLogToContext: (logData: Omit<ContextMoodLog, "id">) => Promise<ContextMoodLog | null>;
  isLoadingMoodLogs: boolean;
}

const FoodLogContext = createContext<FoodLogContextType | undefined>(undefined);

export const FoodLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [foodLogs, setFoodLogs] = useState<FullFoodLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [moodLogs, setMoodLogs] = useState<ContextMoodLog[]>([]); // State for mood logs
  const [isLoadingMoodLogs, setIsLoadingMoodLogs] = useState(false); // Loading state for mood logs
  const { toast } = useToast();
  const initialAuthCheckCompletedRef = useRef(false);

  const fetchCurrentUserProfileData = useCallback(async (firebaseUser: ExtendedUser | null): Promise<UserProfileData | null> => {
    if (!firebaseUser?.uid) {
      console.log("[FoodLogContext] fetchCurrentUserProfileData: No Firebase user UID. Clearing profile and current user.");
      setUserProfile(null);
      setCurrentUser(null);
      setFoodLogs([]);
      setMoodLogs([]);
      return null;
    }
    console.log("[FoodLogContext] fetchCurrentUserProfileData: Fetching Firestore profile for UID:", firebaseUser.uid);
    try {
      const profile = await fetchUserProfileAction(firebaseUser.uid);
      setUserProfile(profile);
      console.log("[FoodLogContext] fetchCurrentUserProfileData: Firestore profile fetched:", profile ? { name: profile.name, isComplete: profile.isProfileComplete, pic: !!profile.profilePicUrl } : null);
      
      setCurrentUser(prevUser => {
        const baseUser = prevUser || firebaseUser;
        return {
          ...baseUser,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: profile?.name || baseUser.displayName,
          photoURL: profile?.profilePicUrl || baseUser.photoURL,
        } as ExtendedUser;
      });
      return profile;
    } catch (profileError) {
      console.error("[FoodLogContext] fetchCurrentUserProfileData: Error fetching Firestore profile:", profileError);
      setUserProfile(null);
      setCurrentUser(firebaseUser); // Keep Firebase user if profile fetch fails
      return null;
    }
  }, []);

  useEffect(() => {
    console.log("[FoodLogContext] Initializing with Firebase app: projectID='%s', authDomain='%s', appName='%s'",
      auth.app.options.projectId, auth.app.options.authDomain, auth.app.name
    );

    let unsubscribe: (() => void) | undefined;

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("[FoodLogContext] Firebase auth persistence set to browserLocalPersistence.");
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("[FoodLogContext] onAuthStateChanged fired. User from Firebase SDK:", firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName } : null);
          if (firebaseUser) {
            await fetchCurrentUserProfileData(firebaseUser as ExtendedUser);
          } else {
            setCurrentUser(null);
            setUserProfile(null);
            setFoodLogs([]);
            setMoodLogs([]); // Clear mood logs on logout
          }
          if (!initialAuthCheckCompletedRef.current) {
            setIsLoadingAuth(false);
            initialAuthCheckCompletedRef.current = true;
            console.log("[FoodLogContext] onAuthStateChanged: Initial auth check complete. isLoadingAuth set to false.");
          }
        }, (error) => {
          console.error("[FoodLogContext] onAuthStateChanged listener ERROR:", error);
          setCurrentUser(null);
          setUserProfile(null);
          setFoodLogs([]);
          setMoodLogs([]);
          if (!initialAuthCheckCompletedRef.current) {
            setIsLoadingAuth(false);
            initialAuthCheckCompletedRef.current = true;
          }
        });
      })
      .catch((error) => {
        console.error("[FoodLogContext] Error setting Firebase auth persistence:", error);
        setCurrentUser(null);
        setUserProfile(null);
        setFoodLogs([]);
        setMoodLogs([]);
        if (!initialAuthCheckCompletedRef.current) {
            setIsLoadingAuth(false);
            initialAuthCheckCompletedRef.current = true;
        }
      });

    return () => {
      if (unsubscribe) {
        console.log("[FoodLogContext] Cleaning up onAuthStateChanged listener.");
        unsubscribe();
      }
    };
  }, [fetchCurrentUserProfileData]);

  const loadFoodLogsFromContext = useCallback(async (user: ExtendedUser | null) => {
    if (isLoadingAuth) {
      console.log("[FoodLogContext] loadFoodLogs: Auth still loading, deferring food log fetch.");
      return;
    }
    if (!user?.uid) {
      setFoodLogs([]);
      setIsLoadingLogs(false);
      return;
    }
    setIsLoadingLogs(true);
    try {
      const logs = await fetchFoodLogs(user.uid);
      setFoodLogs(logs);
    } catch (error) {
      console.error("[FoodLogContext] loadFoodLogs: Error loading food logs:", error);
      toast({ title: "Error loading food logs", description: "Could not retrieve your food history.", variant: "destructive" });
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast, isLoadingAuth]);

  const loadMoodLogsFromContext = useCallback(async (user: ExtendedUser | null) => {
    if (isLoadingAuth) {
      console.log("[FoodLogContext] loadMoodLogs: Auth still loading, deferring mood log fetch.");
      return;
    }
    if (!user?.uid) {
      setMoodLogs([]);
      setIsLoadingMoodLogs(false);
      return;
    }
    setIsLoadingMoodLogs(true);
    try {
      const logs = await fetchMoodLogsAction(user.uid, 50); // Fetch a reasonable number
      setMoodLogs(logs.map(log => ({...log, id: log.id || Date.now().toString() })));
    } catch (error) {
      console.error("[FoodLogContext] loadMoodLogs: Error loading mood logs:", error);
      toast({ title: "Error loading mood logs", description: "Could not retrieve your mood history.", variant: "destructive" });
    } finally {
      setIsLoadingMoodLogs(false);
    }
  }, [toast, isLoadingAuth]);


  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      loadFoodLogsFromContext(currentUser);
      loadMoodLogsFromContext(currentUser); // Load mood logs when user changes
    } else if (!isLoadingAuth && !currentUser) {
      // User signed out, ensure logs are cleared
      setFoodLogs([]);
      setMoodLogs([]);
      setIsLoadingLogs(false);
      setIsLoadingMoodLogs(false);
    }
  }, [currentUser, isLoadingAuth, loadFoodLogsFromContext, loadMoodLogsFromContext]);


  const addFoodLogToContext = useCallback(async (logData: Omit<FullFoodLog, "id">): Promise<FullFoodLog | null> => {
    if (!currentUser?.uid) {
      toast({ title: "Authentication Required", description: "You must be logged in to add food items.", variant: "destructive" });
      return null;
    }
    try {
      const newLogId = await submitFoodLog(currentUser.uid, logData);
      if (newLogId) {
        const newFullLog: FullFoodLog = { ...logData, id: newLogId, timestamp: new Date(logData.timestamp || Date.now()).toISOString() };
        setFoodLogs((prevLogs) => [newFullLog, ...prevLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        return newFullLog;
      } else {
        toast({ title: "Log Error", description: "Could not save your food log (no ID returned).", variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error("[FoodLogContext] addFoodLog: Error submitting food log:", error);
      toast({ title: "Log Error", description: `Could not save your food log: ${(error as Error).message}`, variant: "destructive" });
      return null;
    }
  }, [currentUser, toast]);
  
  const addMoodLogToContext = useCallback(async (logData: Omit<ContextMoodLog, "id">): Promise<ContextMoodLog | null> => {
    if (!currentUser?.uid) {
      toast({ title: "Authentication Required", description: "You must be logged in to add mood logs.", variant: "destructive" });
      return null;
    }
    try {
      const newLogId = await submitMoodLogAction(currentUser.uid, logData);
      if (newLogId) {
        const newFullLog: ContextMoodLog = { ...logData, id: newLogId, timestamp: new Date(logData.timestamp || Date.now()).toISOString() };
        setMoodLogs((prevLogs) => [newFullLog, ...prevLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50)); // Keep recent
        return newFullLog;
      } else {
        toast({ title: "Log Error", description: "Could not save your mood log (no ID returned).", variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error("[FoodLogContext] addMoodLog: Error submitting mood log:", error);
      toast({ title: "Log Error", description: `Could not save your mood log: ${(error as Error).message}`, variant: "destructive" });
      return null;
    }
  }, [currentUser, toast]);


  const currentCaloriesToday = React.useMemo(() => {
    const today = new Date().toDateString();
    return foodLogs
      .filter(log => new Date(log.timestamp).toDateString() === today)
      .reduce((sum, log) => sum + (log.analysis?.calorieEstimate || log.calories || 0), 0);
  }, [foodLogs]);

  const todaysFoodLogs = React.useMemo(() => {
    const today = new Date().toDateString();
    return foodLogs.filter(log => new Date(log.timestamp).toDateString() === today);
  }, [foodLogs]);

  const manualRefreshUserProfile = useCallback(async () => {
    const firebaseUserFromAuth = auth.currentUser;
    console.log("[FoodLogContext] Manual fetchCurrentUserProfile called. Live Firebase auth user:", firebaseUserFromAuth ? {uid: firebaseUserFromAuth.uid, email: firebaseUserFromAuth.email} : 'null');
    
    // Set loading true for the duration of this manual refresh
    setIsLoadingAuth(true); 
    initialAuthCheckCompletedRef.current = false; // Allow isLoadingAuth to be properly reset by onAuthStateChanged logic

    if (firebaseUserFromAuth) {
      await fetchCurrentUserProfileData(firebaseUserFromAuth as ExtendedUser);
    } else {
      setCurrentUser(null);
      setUserProfile(null);
      setFoodLogs([]);
      setMoodLogs([]);
    }
    // If onAuthStateChanged doesn't fire immediately due to this manual intervention, 
    // ensure isLoadingAuth is reset. This might also be handled by onAuthStateChanged if it does fire.
    if (!initialAuthCheckCompletedRef.current) { // Redundant if onAuthStateChanged always fires, but safe
        initialAuthCheckCompletedRef.current = true; // Mark as complete
        setIsLoadingAuth(false); 
        console.log("[FoodLogContext] Manual fetchCurrentUserProfile: isLoadingAuth set to false after processing.");
    }

  }, [fetchCurrentUserProfileData]);


  return (
    <FoodLogContext.Provider value={{
      foodLogs,
      addFoodLog: addFoodLogToContext,
      currentCaloriesToday,
      todaysFoodLogs,
      currentUser,
      isLoadingAuth,
      userProfile,
      fetchCurrentUserProfile: manualRefreshUserProfile,
      isLoadingLogs,
      moodLogs,
      addMoodLogToContext,
      isLoadingMoodLogs,
    }}>
      {children}
    </FoodLogContext.Provider>
  );
};

export const useFoodLog = (): FoodLogContextType => {
  const context = useContext(FoodLogContext);
  if (context === undefined) {
    throw new Error('useFoodLog must be used within a FoodLogProvider');
  }
  return context;
};
