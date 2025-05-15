
'use server';

import { analyzePlate as analyzePlateFlow, type AnalyzePlateInput, type AnalyzePlateOutput } from '@/ai/flows/analyze-plate';
import { getMoodFoodInsights as getMoodFoodInsightsFlow, type MoodFoodInsightsInput, type MoodFoodInsightsOutput } from '@/ai/flows/mood-food-insights';
import { firebaseApp, auth as mainAuth } from '@/lib/firebase/init';
import {
  createUserProfileDocument,
  updateUserProfileInFirestore,
  updateUserProfileDetailsInFirestore,
  getUserProfile,
  addFoodLogToFirestore,
  getFoodLogsFromFirestore,
  addMoodLogToFirestore,
  getMoodLogsFromFirestore,
  getAllUsersWithProfiles,
} from '@/lib/firebase/firestoreOperations';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { FullFoodLog } from '@/contexts/FoodLogContext';
import type { MoodLog as MoodLogTypeFromCard } from '@/components/dashboard/MoodTrackingCard';
import { PROFILE_PICTURES_STORAGE_PATH } from './firebase/constants';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';


type MoodLog = MoodLogTypeFromCard & { id: string };

export interface UserProfileData {
  uid: string;
  name: string;
  email: string | null;
  profilePicUrl?: string;
  weight?: string;
  height?: string;
  plan?: string;
  goal?: string;
  isProfileComplete?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfileDetails {
  weight: string;
  height: string;
  plan: string;
  goal?: string;
}

// --- Genkit Flows ---
export async function handlePlateAnalysis(photoDataUri: string): Promise<AnalyzePlateOutput> {
  if (!photoDataUri) {
    console.error('[handlePlateAnalysis] Error: Photo data URI is required.');
    throw new Error('Photo data URI is required for plate analysis.');
  }
  const input: AnalyzePlateInput = { photoDataUri };
  try {
    console.log('[handlePlateAnalysis] Calling analyzePlateFlow with input:', { photoDataUriPresent: !!input.photoDataUri });
    const result = await analyzePlateFlow(input);
    return result;
  } catch (flowError: any) {
    // Log the detailed error on the server
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!! SEVERE ERROR in handlePlateAnalysis (Server Action) !!!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('Message:', flowError.message);
    if (flowError.stack) console.error('Stack:', flowError.stack);
    if (flowError.cause) console.error('Cause:', flowError.cause);
    if (flowError.details) console.error('Details (often from Genkit/AI service):', flowError.details);
    if (flowError.response?.data) console.error('Response Data (from API):', flowError.response.data);
    console.error('Input provided to flow:', { photoDataUriPresent: !!input.photoDataUri, firstChars: input.photoDataUri?.substring(0,100) });
    console.error('------------------------------------------------------------');
    console.error('>>>> CHECK GOOGLE CLOUD CONSOLE FOR API ENABLEMENT (Generative Language API / Vertex AI API) & BILLING. <<<<');
    console.error('>>>> ENSURE GOOGLE_GENAI_API_KEY in .env.local is correct and active for the intended Google Cloud Project. <<<<');
    console.error('------------------------------------------------------------');

    // Construct a more informative error message for the client
    let clientErrorMessage = 'AI plate analysis failed. CRITICAL: Check server terminal logs for detailed error messages.';
    if (flowError.message) {
      const hint = flowError.message.length > 150 ? flowError.message.substring(0, 150) + '...' : flowError.message;
      if (flowError.message.toLowerCase().includes("model not found")) {
         clientErrorMessage += ` The AI model (e.g., 'gemini-pro-vision') was NOT FOUND by Google. This means your GOOGLE_GENAI_API_KEY or its associated Google Cloud Project does not have access to this model. PLEASE VERIFY in Google Cloud Console: 1. "Generative Language API" AND "Vertex AI API" are ENABLED. 2. BILLING is ENABLED for the project. 3. The API key is valid and unrestricted for these APIs. (Server hint: ${hint})`;
      } else if (flowError.message.toLowerCase().includes("api key") || flowError.message.toLowerCase().includes("permission denied") || flowError.message.toLowerCase().includes("quota")) {
         clientErrorMessage += ` A specific API Key, Permission, or Quota error was reported by Google. Check your GOOGLE_GENAI_API_KEY, its permissions, and quotas in Google Cloud Console. (Server hint: ${hint})`;
      } else {
         clientErrorMessage += ` (Server hint: ${hint})`;
      }
    }
    // Re-throw a new error that will be sent to the client
    throw new Error(clientErrorMessage);
  }
}

export async function handleMoodFoodInsights(input: MoodFoodInsightsInput): Promise<MoodFoodInsightsOutput> {
  if (!input.foodLogs || !input.moodLogs) {
    throw new Error('Food logs and mood logs are required for insights.');
  }
  try {
    const result = await getMoodFoodInsightsFlow(input);
    return result;
  } catch (error: any) {
    console.error('Error in handleMoodFoodInsights (Server Action):', error.message, error.stack, error.cause, error.details);
    let clientErrorMessage = 'AI mood-food insights generation failed. Please check server logs.';
    if (error.message) {
      clientErrorMessage += ` (Server error: ${error.message.substring(0,100)}${error.message.length > 100 ? "..." : ""})`;
    }
    throw new Error(clientErrorMessage);
  }
}

// --- Firebase Auth & Profile Related Actions ---

interface UserSessionUpdateResult {
  success: boolean;
  isProfileComplete?: boolean;
  error?: string;
  uid?: string;
  name?: string | null;
  email?: string | null;
}

export async function handleUserSessionUpdate({
  uid,
  email,
  name,
  isNewUser,
}: {
  uid: string;
  email: string | null;
  name: string | null;
  isNewUser: boolean;
}): Promise<UserSessionUpdateResult> {
  console.log(`[Server Action - handleUserSessionUpdate] Called for UID: ${uid}, Name: ${name}, Email: ${email}, isNewUser: ${isNewUser}`);
  try {
    let userProfile = await getUserProfile(uid);

    if (isNewUser && !userProfile) {
      console.log(`[Server Action - handleUserSessionUpdate] New user. Creating profile for UID: ${uid}`);
      await createUserProfileDocument(uid, { email: email || '', name: name || 'New User' });
      userProfile = await getUserProfile(uid); // Fetch the newly created profile
      if (!userProfile) {
        throw new Error("Failed to retrieve newly created user profile.");
      }
      console.log(`[Server Action - handleUserSessionUpdate] Profile created and fetched:`, userProfile);
    } else if (!userProfile) {
      console.warn(`[Server Action - handleUserSessionUpdate] User profile not found for existing UID: ${uid}. Attempting to create.`);
      await createUserProfileDocument(uid, { email: email || '', name: name || 'User (Profile Recreated)' });
      userProfile = await getUserProfile(uid);
      if (!userProfile) {
        throw new Error("Failed to create or retrieve user profile for existing auth user.");
      }
      console.log(`[Server Action - handleUserSessionUpdate] Missing profile recreated and fetched:`, userProfile);
    } else {
       console.log(`[Server Action - handleUserSessionUpdate] Existing profile found for UID ${uid}:`, userProfile);
    }
    
    return { 
      success: true, 
      isProfileComplete: userProfile?.isProfileComplete || false,
      uid: userProfile?.uid,
      name: userProfile?.name,
      email: userProfile?.email
    };

  } catch (error: any) {
    console.error('[Server Action - handleUserSessionUpdate] Error:', error);
    return { success: false, error: error.message || "Failed to update user session on server." };
  }
}


export async function sendPasswordResetEmailAction(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use the mainAuth instance imported from firebase/init
    await sendPasswordResetEmail(mainAuth, email); 
    console.log(`[Server Action - sendPasswordResetEmailAction] Password reset email sent request for: ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Server Action - sendPasswordResetEmailAction] Error sending password reset email:", error);
    return { success: false, error: error.message || "Failed to send password reset email." };
  }
}


// --- User Profile Detail Actions (Firestore) ---
export async function updateUserProfileDetailsAction(userId: string, details: UserProfileDetails): Promise<{ success: boolean; error?: string }> {
  try {
    await updateUserProfileDetailsInFirestore(userId, details);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user profile details:", error);
    return { success: false, error: error.message || "Failed to update profile details." };
  }
}

export async function updateUserProfileWithPic(
  userUid: string,
  firebaseAuthDisplayName: string | null,
  firebaseAuthPhotoURL: string | null,
  profileData: Pick<UserProfileData, 'name' | 'weight' | 'height' | 'plan' | 'goal'>,
  file?: File | null
): Promise<{ success: boolean; error?: string; profilePicUrl?: string }> {
  try {
    let finalProfilePicUrl = firebaseAuthPhotoURL; // Start with the existing one

    if (file && firebaseApp) { // Ensure firebaseApp is available (it should be if init.ts ran)
      const storageService = getStorage(firebaseApp);
      const storageRef = ref(storageService, `${PROFILE_PICTURES_STORAGE_PATH}/${userUid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      finalProfilePicUrl = await getDownloadURL(snapshot.ref);
      console.log(`[Server Action - updateUserProfileWithPic] New profile pic uploaded: ${finalProfilePicUrl}`);
    }

    const firestoreUpdates: Partial<UserProfileData> = {
      ...profileData, // name, weight, height, plan, goal from form
      name: profileData.name || firebaseAuthDisplayName || 'User', // Ensure name is not empty
      profilePicUrl: finalProfilePicUrl || undefined, // Use new or existing URL
      updatedAt: new Date(),
      // isProfileComplete should be handled by updateUserProfileDetailsAction or similar logic if this is for initial completion
    };
    
    // If this update also implies profile completion (e.g., if all required fields are now present)
    // You might want to add: firestoreUpdates.isProfileComplete = true;
    // For now, assuming this is a general update and isProfileComplete is handled separately or already true.

    await updateUserProfileInFirestore(userUid, firestoreUpdates);
    console.log(`[Server Action - updateUserProfileWithPic] Firestore profile updated for UID: ${userUid}`);
    return { success: true, profilePicUrl: finalProfilePicUrl || undefined };
  } catch (error: any) {
    console.error('[Server Action - updateUserProfileWithPic] Error updating user profile/picture:', error);
    return { success: false, error: error.message || "Failed to update profile picture or details." };
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
    return await getUserProfile(userId);
  } catch (error) {
    console.error("Error fetching user profile via action:", error);
    return null;
  }
}

// --- Food Log Actions (Firestore) ---
export async function submitFoodLog(userId: string, foodLogData: Omit<FullFoodLog, 'id'>): Promise<string | null> {
  try {
    return await addFoodLogToFirestore(userId, foodLogData);
  } catch (error) {
    console.error("Error submitting food log via action:", error);
    return null;
  }
}

export async function fetchFoodLogs(userId: string, date?: Date): Promise<FullFoodLog[]> {
  try {
    return await getFoodLogsFromFirestore(userId, date);
  } catch (error) {
    console.error("Error fetching food logs via action:", error);
    return [];
  }
}

// --- Mood Log Actions (Firestore) ---
export async function submitMoodLog(userId: string, moodLogData: Omit<MoodLog, 'id'>): Promise<string | null> {
  try {
    return await addMoodLogToFirestore(userId, moodLogData);
  } catch (error) {
    console.error("Error submitting mood log via action:", error);
    return null;
  }
}

export async function fetchMoodLogs(userId: string, limitCount?: number): Promise<MoodLog[]> {
  try {
    return await getMoodLogsFromFirestore(userId, limitCount);
  } catch (error) {
    console.error("Error fetching mood logs via action:", error);
    return [];
  }
}

// --- Leaderboard Actions (Firestore) ---
export async function fetchAllUsersForLeaderboard(): Promise<UserProfileData[]> {
    try {
        return await getAllUsersWithProfiles();
    } catch (error) {
        console.error("Error fetching all users for leaderboard:", error);
        return [];
    }
}
