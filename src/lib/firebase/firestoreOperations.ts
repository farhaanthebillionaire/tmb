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
  deleteDoc,
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
import type { UserProfileData, UserProfileDetails } from '@/lib/actions'; // UserProfileDetails will be new
import type { FullFoodLog } from '@/contexts/FoodLogContext';
import type { MoodLog as MoodLogTypeFromCard } from '@/components/dashboard/MoodTrackingCard';

type MoodLog = MoodLogTypeFromCard & { id: string };


// Helper to convert Firestore Timestamps to Dates and vice-versa if needed
const fromFirestoreTimestamp = (timestamp: FirestoreTimestamp | Date | undefined | null): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : undefined;
};

// Helper to prepare data for Firestore, converting dates to Timestamps
const toFirestoreCompatibleData = (data: Record<string, any>): Record<string, any> => {
  const firestoreData: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value instanceof Date) {
        firestoreData[key] = Timestamp.fromDate(value);
      } else if (value === undefined) {
        // Firestore doesn't store undefined. To remove a field, use deleteField() from firebase/firestore,
        // or ensure it's not included in the object sent to Firestore.
        // For simplicity here, we just won't add it.
      } else if (value === null) {
        firestoreData[key] = null; // Null is acceptable
      }
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively process nested objects but not arrays
        firestoreData[key] = toFirestoreCompatibleData(value);
      }
       else {
        firestoreData[key] = value;
      }
    }
  }
  return firestoreData;
};


// --- User Profile Functions ---
export const createUserProfileDocument = async (
    userId: string, 
    data: Pick<UserProfileData, 'email' | 'name'>
  ): Promise<void> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const profileData: UserProfileData = {
    ...data, // name, email
    uid: userId,
    profilePicUrl: '', // Initial empty value
    // These will be filled in the next step
    weight: '', 
    height: '', 
    plan: 'mindful_eating', 
    goal: '', 
    isProfileComplete: false, // New flag
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await setDoc(userDocRef, toFirestoreCompatibleData(profileData));
  console.log(`[FirestoreOps] Basic profile created for UID: ${userId}`);
};

export const updateUserProfileDetailsInFirestore = async (userId: string, details: UserProfileDetails): Promise<void> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const dataToUpdate = {
    ...details,
    isProfileComplete: true,
    updatedAt: new Date(),
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
      ...data,
      uid: docSnap.id,
      createdAt: fromFirestoreTimestamp(data.createdAt as FirestoreTimestamp | Date),
      updatedAt: fromFirestoreTimestamp(data.updatedAt as FirestoreTimestamp | Date),
      isProfileComplete: data.isProfileComplete || false,
    } as UserProfileData;
  }
  return null;
};

export const updateUserProfileInFirestore = async (userId: string, updates: Partial<UserProfileData>): Promise<void> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const dataToUpdate = {
    ...updates,
    updatedAt: new Date(),
  };
  await updateDoc(userDocRef, toFirestoreCompatibleData(dataToUpdate));
  console.log(`[FirestoreOps] Generic profile update for UID: ${userId}`);
};


// --- Food Log Functions ---
export const addFoodLogToFirestore = async (userId: string, foodLogData: Omit<FullFoodLog, 'id'>): Promise<string> => {
  const foodLogsColRef = collection(db, USERS_COLLECTION, userId, FOODLOGS_COLLECTION);
  const dataToSave: any = { 
    ...foodLogData,
    timestamp: foodLogData.timestamp ? new Date(foodLogData.timestamp) : new Date(),
  };
  dataToSave.analysis = foodLogData.analysis ? { ...foodLogData.analysis } : null;

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
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
      ...queryConstraints
    );
  } else {
    q = query(foodLogsColRef, ...queryConstraints);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      timestamp: (fromFirestoreTimestamp(data.timestamp as FirestoreTimestamp | Date))!.toISOString(),
      analysis: data.analysis || undefined,
    } as FullFoodLog;
  });
};


// --- Mood Log Functions ---
export const addMoodLogToFirestore = async (userId: string, moodLogData: Omit<MoodLog, 'id'>): Promise<string> => {
  const moodLogsColRef = collection(db, USERS_COLLECTION, userId, MOODLOGS_COLLECTION);
  const dataToSave = {
    ...moodLogData,
    timestamp: moodLogData.timestamp ? new Date(moodLogData.timestamp) : new Date(),
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
    return {
      ...data,
      id: docSnap.id,
      timestamp: (fromFirestoreTimestamp(data.timestamp as FirestoreTimestamp | Date))!.toISOString(),
      intensity: data.intensity as number,
      mood: data.mood as string,
    } as MoodLog;
  });
};

// --- Leaderboard Specific Functions ---
export const getAllUsersWithProfiles = async (): Promise<UserProfileData[]> => {
  const usersColRef = collection(db, USERS_COLLECTION);
  const snapshot = await getDocs(usersColRef);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      ...data,
      uid: docSnap.id,
      createdAt: fromFirestoreTimestamp(data.createdAt as FirestoreTimestamp | Date),
      updatedAt: fromFirestoreTimestamp(data.updatedAt as FirestoreTimestamp | Date),
      isProfileComplete: data.isProfileComplete || false,
    } as UserProfileData;
  }).filter(user => user.isProfileComplete); // Only include users who have completed their profiles
};

// --- Initialization and Seeding ---
const SEEDING_STATUS_DOC_ID = 'appSeedingStatusTrackMyBite';

export const initializeAndSeedFirestore = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Skipping Firestore seeding in non-development environment.');
    return;
  }

  const seedingStatusRef = doc(db, METADATA_COLLECTION, SEEDING_STATUS_DOC_ID);
  try {
    const statusSnap = await getDoc(seedingStatusRef);
    if (statusSnap.exists() && statusSnap.data()?.seeded) {
      console.log('Firestore already seeded for TrackMyBite (based on flag).');
      return;
    }

    const usersQuery = query(collection(db, USERS_COLLECTION), limit(1));
    const usersSnapshot = await getDocs(usersQuery);
    if (!usersSnapshot.empty) {
        console.log('Users collection is not empty. Assuming already seeded or has data. Setting seeding flag.');
        await setDoc(seedingStatusRef, { seeded: true, lastSeeded: serverTimestamp() }, { merge: true });
        return;
    }

    console.log('TrackMyBite: No seeding flag found and users collection is empty. Proceeding with initial seeding (basic flag set).');
    const batch = writeBatch(db);
    batch.set(seedingStatusRef, { seeded: true, lastSeeded: serverTimestamp() });
    await batch.commit();
    console.log('Firestore seeding flag set for TrackMyBite.');

  } catch (error) {
    console.error('Error during Firestore initialization/seeding for TrackMyBite:', error);
  }
};
// initializeAndSeedFirestore(); // Call this from a specific dev script or manually if needed
