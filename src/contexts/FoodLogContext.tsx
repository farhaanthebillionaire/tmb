
// src/contexts/FoodLogContext.tsx
'use client';

import type { AnalyzePlateOutput } from '@/ai/flows/analyze-plate';
import { auth } from '@/lib/firebase/init';
import {
  fetchFoodLogs,
  submitFoodLog,
  fetchUserProfile as fetchUserProfileAction,
  type UserProfileData,
} from '@/lib/actions';
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useRef } from 'react';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, type User as FirebaseUserType } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export interface BaseFoodLog {
  timestamp: string;
  foodItems: string[];
  calories?: number;
  method: 'text' | 'image';
  mealType?: string;
  analysis?: AnalyzePlateOutput;
}
export type FullFoodLog = BaseFoodLog & { id: string };

// Using FirebaseUserType directly for currentUser
export type ExtendedUser = FirebaseUserType;

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
}

const FoodLogContext = createContext<FoodLogContextType | undefined>(undefined);

export const FoodLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [foodLogs, setFoodLogs] = useState<FullFoodLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false); // Default to false, true when loading
  const { toast } = useToast();
  const initialAuthCheckCompletedRef = useRef(false);

  const fetchCurrentUserProfileData = useCallback(async (firebaseUser: ExtendedUser | null): Promise<UserProfileData | null> => {
    if (!firebaseUser?.uid) {
      console.log("[FoodLogContext] fetchCurrentUserProfileData: No Firebase user UID, cannot fetch profile. Clearing profile and current user.");
      setUserProfile(null);
      setCurrentUser(null); // Ensure currentUser is also null if no UID
      return null;
    }
    console.log("[FoodLogContext] fetchCurrentUserProfileData: Fetching Firestore profile for UID:", firebaseUser.uid);
    try {
      const profile = await fetchUserProfileAction(firebaseUser.uid);
      setUserProfile(profile);
      console.log("[FoodLogContext] fetchCurrentUserProfileData: Firestore profile fetched:", profile ? { name: profile.name, isComplete: profile.isProfileComplete } : null);

      // Ensure currentUser in context reflects the latest fetched display name and photo URL from Firestore
      setCurrentUser(prevUser => {
        const baseUser = prevUser || firebaseUser; // Use prevUser to maintain other FirebaseUserType props
        return {
          ...baseUser, // Spread properties from existing firebaseUser object
          uid: firebaseUser.uid, // Ensure UID from firebaseUser is prioritized
          email: firebaseUser.email,
          displayName: profile?.name || baseUser.displayName, // Prioritize Firestore name
          photoURL: profile?.profilePicUrl || baseUser.photoURL, // Prioritize Firestore pic
        } as ExtendedUser;
      });
      return profile;
    } catch (profileError) {
      console.error("[FoodLogContext] fetchCurrentUserProfileData: Error fetching Firestore profile:", profileError);
      setUserProfile(null);
      // If profile fetch fails, ensure currentUser still reflects the Firebase Auth user if one exists
      setCurrentUser(firebaseUser);
      return null;
    }
  }, []);


  useEffect(() => {
    console.log("[FoodLogContext] Setting up onAuthStateChanged listener. Auth instance app name:", auth.app.name);
    console.log("[FoodLogContext] Initializing with Firebase app: projectID='%s', authDomain='%s', appName='%s'",
      auth.app.options.projectId, auth.app.options.authDomain, auth.app.name
    );

    let unsubscribe: (() => void) | undefined;

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("[FoodLogContext] Firebase auth persistence set to browserLocalPersistence.");
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("[FoodLogContext] onAuthStateChanged fired. User from Firebase SDK:", firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName, photoURL: firebaseUser.photoURL } : null);
          if (firebaseUser) {
            // User is signed in or session restored
            setCurrentUser(firebaseUser as ExtendedUser); // Set current user from Firebase
            await fetchCurrentUserProfileData(firebaseUser as ExtendedUser); // Fetch/update full profile
          } else {
            // User is signed out
            console.log("[FoodLogContext] onAuthStateChanged: User IS signed out. Clearing all user-related states.");
            setCurrentUser(null);
            setUserProfile(null);
            setFoodLogs([]); // Explicitly clear food logs
          }

          // This ensures isLoadingAuth is set to false only ONCE after the initial auth state is determined.
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
          if (!initialAuthCheckCompletedRef.current) {
            setIsLoadingAuth(false);
            initialAuthCheckCompletedRef.current = true;
          }
        });
      })
      .catch((error) => {
        console.error("[FoodLogContext] Error setting Firebase auth persistence:", error);
        // Fallback if persistence setting fails, though less ideal
        setCurrentUser(null);
        setUserProfile(null);
        setFoodLogs([]);
        if (!initialAuthCheckCompletedRef.current) {
            setIsLoadingAuth(false);
            initialAuthCheckCompletedRef.current = true;
            console.warn("[FoodLogContext] Initial auth check complete after persistence error. isLoadingAuth set to false.");
        }
      });

    return () => {
      if (unsubscribe) {
        console.log("[FoodLogContext] Cleaning up onAuthStateChanged listener.");
        unsubscribe();
      }
    };
  // fetchCurrentUserProfileData is memoized with useCallback, so it's stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCurrentUserProfileData]); // Dependency array is kept minimal, relying on useCallback for fetchCurrentUserProfileData stability


  const loadFoodLogsFromContext = useCallback(async (user: ExtendedUser | null) => {
    if (isLoadingAuth) { // Wait for auth to resolve before loading logs
      console.log("[FoodLogContext] loadFoodLogs: Auth still loading, deferring log fetch.");
      return;
    }
    if (!user?.uid) {
      setFoodLogs([]);
      setIsLoadingLogs(false);
      console.log("[FoodLogContext] loadFoodLogs: No user ID, logs cleared.");
      return;
    }
    console.log(`[FoodLogContext] loadFoodLogs: Attempting to fetch food logs for user: ${user.uid}`);
    setIsLoadingLogs(true);
    try {
      const logs = await fetchFoodLogs(user.uid);
      setFoodLogs(logs);
      console.log(`[FoodLogContext] loadFoodLogs: Successfully fetched ${logs.length} logs for user ${user.uid}.`);
    } catch (error) {
      console.error("[FoodLogContext] loadFoodLogs: Error loading food logs:", error);
      toast({ title: "Error loading logs", description: "Could not retrieve your food history.", variant: "destructive" });
      setFoodLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast, isLoadingAuth]); // Added isLoadingAuth to dependencies

  useEffect(() => {
    // This effect triggers loading food logs when currentUser changes OR when initial auth loading completes
    if (!isLoadingAuth) { // Only proceed if auth state is resolved
        loadFoodLogsFromContext(currentUser);
    }
  }, [currentUser, isLoadingAuth, loadFoodLogsFromContext]);


  const addFoodLogToContext = useCallback(async (logData: Omit<FullFoodLog, "id">): Promise<FullFoodLog | null> => {
    if (!currentUser?.uid) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add food items.",
        variant: "destructive",
      });
      console.error("[FoodLogContext] addFoodLog: User not authenticated.");
      return null;
    }
    try {
      const newLogId = await submitFoodLog(currentUser.uid, logData);
      if (newLogId) {
        const newFullLog: FullFoodLog = {
          ...logData,
          id: newLogId,
          timestamp: new Date(logData.timestamp || Date.now()).toISOString(),
        };
        setFoodLogs((prevLogs) => [newFullLog, ...prevLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        console.log("[FoodLogContext] addFoodLog: Food log added and local state updated:", newFullLog);
        return newFullLog;
      } else {
        console.error("[FoodLogContext] addFoodLog: submitFoodLog did not return an ID.");
        toast({ title: "Log Error", description: "Could not save your food log (no ID returned).", variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error("[FoodLogContext] addFoodLog: Error submitting food log:", error);
      toast({ title: "Log Error", description: `Could not save your food log: ${(error as Error).message}`, variant: "destructive" });
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

  // This function is called by components (e.g., after login/register) to force a profile refresh.
  const manualRefreshUserProfile = useCallback(async () => {
    const firebaseUserFromAuth = auth.currentUser; // Get the LATEST live user from Firebase Auth
    console.log("[FoodLogContext] Manual fetchCurrentUserProfile called. Live Firebase auth user:", firebaseUserFromAuth ? {uid: firebaseUserFromAuth.uid, email: firebaseUserFromAuth.email} : 'null');

    setIsLoadingAuth(true); // Indicate loading during this explicit profile refresh
    initialAuthCheckCompletedRef.current = false; // Allow isLoadingAuth to be set to false again after this refresh

    if (firebaseUserFromAuth) {
      await fetchCurrentUserProfileData(firebaseUserFromAuth as ExtendedUser);
    } else {
      // If Firebase Auth says no user, clear all local user state
      setCurrentUser(null);
      setUserProfile(null);
      setFoodLogs([]);
    }
    // Ensure isLoadingAuth is set to false after processing
    // This will also update the initialAuthCheckCompletedRef via the onAuthStateChanged logic if it was a new user
    // but for an existing user, we directly manage it here.
    if (!initialAuthCheckCompletedRef.current){
         initialAuthCheckCompletedRef.current = true;
    }
    setIsLoadingAuth(false);
    console.log("[FoodLogContext] Manual fetchCurrentUserProfile: isLoadingAuth set to false.");

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

