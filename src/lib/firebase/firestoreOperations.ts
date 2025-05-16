
// src/lib/firebase/firestoreOperations.ts
import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/init';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { USERS_COLLECTION, FOODLOGS_COLLECTION, MOODLOGS_COLLECTION, METADATA_COLLECTION } from './constants';
import type { UserProfileData, UserProfileDetails, UserProfileDataPlan } from '@/lib/actions';
import type { FullFoodLog, BaseFoodLog } from '@/contexts/FoodLogContext';
import type { MoodLog as MoodLogTypeFromCard } from '@/components/dashboard/MoodTrackingCard';

type MoodLog = MoodLogTypeFromCard & { id: string };


// Helper to convert Firestore Timestamps to JS Dates
const fromFirestoreTimestampToDate = (timestamp: FirestoreTimestamp | Date | undefined | null): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : undefined;
};

// Helper to prepare data for Firestore, converting dates to Firestore Timestamps
// and ensuring other values are directly assignable.
const toFirestoreCompatibleData = (data: Record<string, any>): Record<string, any> => {
  const firestoreData: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value instanceof Date) {
        firestoreData[key] = Timestamp.fromDate(value);
      } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value) && (key === 'timestamp' || key === 'createdAt' || key === 'updatedAt')) {
        // If it's an ISO string for known timestamp keys, convert it to a Firestore Timestamp
        firestoreData[key] = Timestamp.fromDate(new Date(value));
      }
      else if (value === undefined) {
        // Firestore doesn't store undefined. To remove a field, use deleteField() or ensure it's not included.
        // Here, we simply don't add it.
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively process nested objects if they are plain objects (not arrays or special types)
        let isPlainObject = true;
        if (value.constructor !== Object) {
            isPlainObject = false; // Not a plain object like {a:1}
        }
        if(isPlainObject){
            firestoreData[key] = toFirestoreCompatibleData(value);
        } else {
            firestoreData[key] = value; // Assign as-is if not a plain object we want to recurse into
        }

      } else {
        firestoreData[key] = value;
      }
    }
  }
  return firestoreData;
};


// --- User Profile Functions ---
export const createUserProfileDocument = async (
    userId: string,
    data: { email: string | null; name: string | null }
  ): Promise<void> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const profileData: UserProfileData = {
    uid: userId,
    email: data.email || null,
    name: data.name || 'New User',
    profilePicUrl: null, // Explicitly null
    weight: '',
    height: '',
    plan: 'mindful_eating',
    goal: '',
    isProfileComplete: false,
    createdAt: new Date(), // Will be converted by toFirestoreCompatibleData
    updatedAt: new Date(), // Will be converted by toFirestoreCompatibleData
  };
  await setDoc(userDocRef, toFirestoreCompatibleData(profileData));
  console.log(`[FirestoreOps] Basic profile created for UID: ${userId}`);
};

export const updateUserProfileDetailsInFirestore = async (userId: string, details: UserProfileDetails): Promise<void> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const dataToUpdate: Partial<UserProfileData> & { updatedAt: Date, isProfileComplete: boolean } = {
    name: details.name,
    weight: details.weight || '',
    height: details.height || '',
    plan: details.plan || 'mindful_eating',
    goal: details.goal || '',
    isProfileComplete: true,
    updatedAt: new Date(), // Will be converted by toFirestoreCompatibleData
  };
  await updateDoc(userDocRef, toFirestoreCompatibleData(dataToUpdate));
  console.log(`[FirestoreOps] Profile details updated for UID: ${userId}`);
};

export const getUserProfile = async (userId: string): Promise<UserProfileData | null> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      name: data.name || '',
      email: data.email || null,
      profilePicUrl: data.profilePicUrl || null,
      weight: data.weight || '',
      height: data.height || '',
      plan: data.plan || 'mindful_eating',
      goal: data.goal || '',
      isProfileComplete: data.isProfileComplete || false,
      createdAt: fromFirestoreTimestampToDate(data.createdAt as FirestoreTimestamp | Date),
      updatedAt: fromFirestoreTimestampToDate(data.updatedAt as FirestoreTimestamp | Date),
    } as UserProfileData;
  }
  return null;
};

export const updateUserProfileInFirestore = async (userId: string, updates: Partial<UserProfileData>): Promise<void> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const dataToUpdate: Partial<UserProfileData> & { updatedAt: Date } = {
    ...updates,
    updatedAt: new Date(), // Will be converted by toFirestoreCompatibleData
  };
  if (updates.hasOwnProperty('profilePicUrl') && !updates.profilePicUrl) {
    dataToUpdate.profilePicUrl = null;
  }
  await updateDoc(userDocRef, toFirestoreCompatibleData(dataToUpdate));
  console.log(`[FirestoreOps] Generic profile update for UID: ${userId}`);
};


// --- Food Log Functions ---
export const addFoodLogToFirestore = async (userId: string, foodLogData: Omit<FullFoodLog, 'id'>): Promise<string> => {
  const foodLogsColRef = collection(db, USERS_COLLECTION, userId, FOODLOGS_COLLECTION);
  const dataToSave: BaseFoodLog = {
    ...foodLogData,
    timestamp: foodLogData.timestamp ? new Date(foodLogData.timestamp).toISOString() : new Date().toISOString(),
    mealType: foodLogData.mealType || 'random',
  };
  dataToSave.analysis = foodLogData.analysis ? { ...foodLogData.analysis } : undefined;

  const docRef = await addDoc(foodLogsColRef, toFirestoreCompatibleData(dataToSave));
  console.log(`[FirestoreOps] Food log added with ID: ${docRef.id} for user UID: ${userId}`);
  return docRef.id;
};

export const getFoodLogsFromFirestore = async (userId: string, date?: Date, limitCount?: number): Promise<FullFoodLog[]> => {
  const foodLogsColRef = collection(db, USERS_COLLECTION, userId, FOODLOGS_COLLECTION);
  let q;

  const queryConstraints: any[] = [orderBy('timestamp', 'desc')];
  if (limitCount) {
    queryConstraints.push(limit(limitCount));
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    q = query(
      foodLogsColRef,
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)), // Compare with Firestore Timestamps
      where('timestamp', '<=', Timestamp.fromDate(endOfDay)),   // Compare with Firestore Timestamps
      ...queryConstraints
    );
  } else {
    q = query(foodLogsColRef, ...queryConstraints);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    const firestoreTimestamp = data.timestamp as FirestoreTimestamp | string;
    let isoTimestamp: string;

    if (typeof firestoreTimestamp === 'string') {
      // If it's already an ISO string (likely from our addFoodLogToFirestore)
      isoTimestamp = firestoreTimestamp;
    } else if (firestoreTimestamp && typeof (firestoreTimestamp as FirestoreTimestamp).toDate === 'function') {
      // If it's a Firestore Timestamp object
      isoTimestamp = (firestoreTimestamp as FirestoreTimestamp).toDate().toISOString();
    } else if (firestoreTimestamp instanceof Date) {
      // If it's somehow a JS Date object already
      isoTimestamp = firestoreTimestamp.toISOString();
    } else {
      // Fallback for unexpected format
      console.warn(`[FirestoreOps] Food log ${docSnap.id} has an invalid timestamp format:`, firestoreTimestamp);
      isoTimestamp = new Date().toISOString(); // Default to now, or handle error appropriately
    }

    return {
      id: docSnap.id,
      timestamp: isoTimestamp, // Use the converted ISO string
      foodItems: data.foodItems as string[],
      calories: data.calories as number | undefined,
      method: data.method as 'text' | 'image',
      mealType: data.mealType as string | undefined,
      analysis: data.analysis,
    } as FullFoodLog;
  });
};


// --- Mood Log Functions ---
export const addMoodLogToFirestore = async (userId: string, moodLogData: Omit<MoodLogTypeFromCard, 'id'>): Promise<string> => {
  const moodLogsColRef = collection(db, USERS_COLLECTION, userId, MOODLOGS_COLLECTION);
  const dataToSave = {
    ...moodLogData,
    timestamp: moodLogData.timestamp ? new Date(moodLogData.timestamp).toISOString() : new Date().toISOString(),
  };
  const docRef = await addDoc(moodLogsColRef, toFirestoreCompatibleData(dataToSave));
  console.log(`[FirestoreOps] Mood log added with ID: ${docRef.id} for user UID: ${userId}`);
  return docRef.id;
};

export const getMoodLogsFromFirestore = async (userId: string, limitCount: number = 20): Promise<MoodLog[]> => {
  const moodLogsColRef = collection(db, USERS_COLLECTION, userId, MOODLOGS_COLLECTION);
  const q = query(moodLogsColRef, orderBy('timestamp', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    const firestoreTimestamp = data.timestamp as FirestoreTimestamp | string;
    let isoTimestamp: string;

    if (typeof firestoreTimestamp === 'string') {
      // If it's already an ISO string (likely from our addMoodLogToFirestore)
      isoTimestamp = firestoreTimestamp;
    } else if (firestoreTimestamp && typeof (firestoreTimestamp as FirestoreTimestamp).toDate === 'function') {
      // If it's a Firestore Timestamp object
      isoTimestamp = (firestoreTimestamp as FirestoreTimestamp).toDate().toISOString();
    } else if (firestoreTimestamp instanceof Date) {
      // If it's somehow a JS Date object already
      isoTimestamp = firestoreTimestamp.toISOString();
    } else {
      // Fallback for unexpected format
      console.warn(`[FirestoreOps] Mood log ${docSnap.id} has an invalid timestamp format:`, firestoreTimestamp);
      isoTimestamp = new Date().toISOString(); // Default to now, or handle error appropriately
    }

    return {
      id: docSnap.id,
      timestamp: isoTimestamp, // Use the converted ISO string
      intensity: data.intensity as number,
      mood: data.mood as string,
    } as MoodLog;
  });
};

// --- Leaderboard Specific Functions ---
export const getAllUsersWithProfiles = async (): Promise<UserProfileData[]> => {
  const usersColRef = collection(db, USERS_COLLECTION);
  // Ensure you only fetch profiles that are complete for leaderboard
  const q = query(usersColRef, where('isProfileComplete', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      name: data.name || '',
      email: data.email || null,
      profilePicUrl: data.profilePicUrl || null,
      weight: data.weight || '',
      height: data.height || '',
      plan: data.plan || 'mindful_eating',
      goal: data.goal || '',
      isProfileComplete: data.isProfileComplete || false,
      createdAt: fromFirestoreTimestampToDate(data.createdAt as FirestoreTimestamp | Date),
      updatedAt: fromFirestoreTimestampToDate(data.updatedAt as FirestoreTimestamp | Date),
    } as UserProfileData;
  });
};

// --- Initialization and Seeding ---
const SEEDING_STATUS_DOC_ID = 'appSeedingStatusTrackMyBite';

export const initializeAndSeedFirestore = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'development') {
    console.log('[FirestoreOps] Skipping Firestore seeding in non-development environment.');
    return;
  }

  const seedingStatusRef = doc(db, METADATA_COLLECTION, SEEDING_STATUS_DOC_ID);
  try {
    const statusSnap = await getDoc(seedingStatusRef);
    if (statusSnap.exists() && statusSnap.data()?.seeded) {
      console.log('[FirestoreOps] Firestore already seeded for TrackMyBite (based on flag).');
      return;
    }

    const usersQuery = query(collection(db, USERS_COLLECTION), limit(1));
    const usersSnapshot = await getDocs(usersQuery);
    if (!usersSnapshot.empty) {
        console.log('[FirestoreOps] Users collection is not empty. Assuming already seeded or has data. Setting seeding flag.');
        await setDoc(seedingStatusRef, { seeded: true, lastSeeded: serverTimestamp() }, { merge: true });
        return;
    }

    console.log('[FirestoreOps] TrackMyBite: No seeding flag found and users collection is empty. Proceeding with initial seeding (basic flag set).');
    const batch = writeBatch(db);
    batch.set(seedingStatusRef, { seeded: true, lastSeeded: serverTimestamp() });
    await batch.commit();
    console.log('[FirestoreOps] Firestore seeding flag set for Track My Bite.');

  } catch (error) {
    console.error('[FirestoreOps] Error during Firestore initialization/seeding for Track My Bite:', error);
  }
};
// Call this function at an appropriate place if you want to trigger seeding during development,
// e.g., in a development-only script or a specific admin action.
// initializeAndSeedFirestore();

    