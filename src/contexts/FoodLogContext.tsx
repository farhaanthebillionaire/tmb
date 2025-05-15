// src/contexts/FoodLogContext.tsx
'use client';

import type { AnalyzePlateOutput } from '@/ai/flows/analyze-plate';
import { auth } from '@/lib/firebase/init'; // Main auth instance
import {
  fetchFoodLogs as fetchFoodLogsAction,
  submitFoodLog as submitFoodLogAction,
  fetchUserProfile, // Action to fetch Firestore profile
  type UserProfileData,
} from '@/lib/actions';
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useRef } from 'react';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, type User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export interface BaseFoodLog {
  timestamp: string;
  foodItems: string[];
  calories?: number;
  method: 'text' | 'image';
}
export type FullFoodLog = BaseFoodLog & { id: string; analysis?: AnalyzePlateOutput };

export interface ExtendedUser extends User {
  isProfileComplete?: boolean;
}
interface FoodLogContextType {
  foodLogs: FullFoodLog[];
  addFoodLog: (logData: Omit<FullFoodLog, "id">) => Promise<FullFoodLog | null>;
  currentCaloriesToday: number;
  todaysFoodLogs: FullFoodLog[];
  currentUser: ExtendedUser | null;
  isLoadingAuth: boolean;
  userProfile: UserProfileData | null;
  fetchCurrentUserProfile: () => Promise<void>;
}

const FoodLogContext = createContext<FoodLogContextType | undefined>(undefined);

export const FoodLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Start true
  const [foodLogs, setFoodLogs] = useState<FullFoodLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const { toast } = useToast();
  const initialAuthCheckCompletedRef = useRef(false); // Ref to track if first auth check is done

  const fetchFullUserProfile = useCallback(async (firebaseUser: User): Promise<void> => {
    console.log("[FoodLogContext] fetchFullUserProfile: Fetching Firestore profile for UID:", firebaseUser.uid);
    try {
      const profile = await fetchUserProfile(firebaseUser.uid);
      setUserProfile(profile);
      setCurrentUser({ ...firebaseUser, isProfileComplete: profile?.isProfileComplete || false });
      console.log("[FoodLogContext] fetchFullUserProfile: Profile fetched, currentUser updated. Profile:", profile);
    } catch (profileError) {
      console.error("[FoodLogContext] fetchFullUserProfile: Error fetching Firestore profile:", profileError);
      setUserProfile(null);
      setCurrentUser({ ...firebaseUser, isProfileComplete: false }); // Assume incomplete on error
    }
  }, []);


  useEffect(() => {
    console.log("[FoodLogContext] Main auth useEffect RUNNING. isLoadingAuth at start:", isLoadingAuth);
    if (!auth) {
      console.error("[FoodLogContext] Firebase auth instance MISSING. Cannot set up listener.");
      if (!initialAuthCheckCompletedRef.current) {
        setIsLoadingAuth(false);
        initialAuthCheckCompletedRef.current = true;
      }
      return;
    }

    let unsubscribe: (() => void) | undefined = undefined;

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("[FoodLogContext] Firebase auth persistence set successfully.");
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log("[FoodLogContext] onAuthStateChanged fired. User from Firebase SDK:", user ? { uid: user.uid, email: user.email } : null);
          if (user) {
            await fetchFullUserProfile(user);
          } else {
            setCurrentUser(null);
            setUserProfile(null);
            setFoodLogs([]);
            console.log("[FoodLogContext] No user found (signed out).");
          }
          if (!initialAuthCheckCompletedRef.current) {
            setIsLoadingAuth(false);
            initialAuthCheckCompletedRef.current = true;
            console.log("[FoodLogContext] Initial auth check complete. isLoadingAuth set to false.");
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
        if (!initialAuthCheckCompletedRef.current) {
          setIsLoadingAuth(false); // Resolve loading even if persistence fails
          initialAuthCheckCompletedRef.current = true;
        }
      });

    return () => {
      if (unsubscribe) {
        console.log("[FoodLogContext] Cleaning up onAuthStateChanged listener.");
        unsubscribe();
      }
    };
  }, [fetchFullUserProfile]); // fetchFullUserProfile is memoized

  const loadFoodLogs = useCallback(async (userId: string) => {
    if (isLoadingLogs) return;
    setIsLoadingLogs(true);
    console.log(`[FoodLogContext] Attempting to fetch food logs for user: ${userId}`);
    try {
      const logs = await fetchFoodLogsAction(userId);
      setFoodLogs(logs);
    } catch (error) {
      console.error("[FoodLogContext] Error loading food logs:", error);
      toast({ title: "Error loading logs", description: "Could not retrieve your food history.", variant: "destructive" });
      setFoodLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [isLoadingLogs, toast]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser?.uid) {
      console.log("[FoodLogContext] currentUser or isLoadingAuth changed, currentUser has UID. Fetching logs.");
      loadFoodLogs(currentUser.uid);
    } else if (!isLoadingAuth && !currentUser) {
      console.log("[FoodLogContext] User signed out (or auth loaded with no user), clearing food logs.");
      setFoodLogs([]);
    }
  }, [currentUser, isLoadingAuth, loadFoodLogs]);


  const addFoodLog = useCallback(async (logData: Omit<FullFoodLog, "id">): Promise<FullFoodLog | null> => {
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
      const newLogId = await submitFoodLogAction(currentUser.uid, logData);
      if (newLogId) {
        const newFullLog: FullFoodLog = {
          ...logData,
          id: newLogId,
          timestamp: new Date(logData.timestamp || Date.now()).toISOString(),
        };
        setFoodLogs((prevLogs) => [newFullLog, ...prevLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        return newFullLog;
      } else {
         console.error("[FoodLogContext] addFoodLog: submitFoodLogAction did not return an ID.");
        return null;
      }
    } catch (error) {
      console.error("[FoodLogContext] addFoodLog: Error submitting food log:", error);
      toast({ title: "Log Error", description: "Could not save your food log.", variant: "destructive" });
      return null;
    }
  }, [currentUser, toast]);

  const currentCaloriesToday = React.useMemo(() => {
    if (foodLogs.length === 0) return 0;
    const today = new Date().toDateString();
    return foodLogs
      .filter(log => new Date(log.timestamp).toDateString() === today)
      .reduce((sum, log) => sum + (log.analysis?.calorieEstimate || log.calories || 0), 0);
  }, [foodLogs]);

  const todaysFoodLogs = React.useMemo(() => {
    if (foodLogs.length === 0) return [];
    const today = new Date().toDateString();
    return foodLogs.filter(log => new Date(log.timestamp).toDateString() === today);
  }, [foodLogs]);

  const fetchCurrentUserProfile = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    console.log("[FoodLogContext] Manual fetchCurrentUserProfile called. Firebase user:", firebaseUser ? firebaseUser.uid : 'null');
    if (firebaseUser) {
      setIsLoadingAuth(true); // Indicate loading during manual refresh
      await fetchFullUserProfile(firebaseUser);
      setIsLoadingAuth(false);
    } else {
      // If no firebase user, ensure states are cleared (though onAuthStateChanged should also do this)
      setCurrentUser(null);
      setUserProfile(null);
      setFoodLogs([]);
      setIsLoadingAuth(false);
    }
  }, [fetchFullUserProfile]);


  return (
    <FoodLogContext.Provider value={{
      foodLogs,
      addFoodLog,
      currentCaloriesToday,
      todaysFoodLogs,
      currentUser,
      isLoadingAuth,
      userProfile,
      fetchCurrentUserProfile,
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
