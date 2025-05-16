
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

type MoodLog = MoodLogTypeFromCard & { id: string };

export interface UserProfileData {
  uid: string;
  name: string;
  email: string | null;
  profilePicUrl?: string | null;
  weight?: string;
  height?: string;
  plan?: UserProfileDataPlan;
  goal?: string;
  isProfileComplete?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserProfileDataPlan = 'weight_loss' | 'maintenance' | 'muscle_gain' | 'mindful_eating';


export interface UserProfileDetails {
  name: string;
  weight?: string;
  height?: string;
  plan?: UserProfileDataPlan;
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

    let clientErrorMessage = 'AI plate analysis failed. CRITICAL: Check server terminal logs for detailed error messages.';
    if (flowError.message) {
      const hint = flowError.message.length > 150 ? flowError.message.substring(0, 150) + '...' : flowError.message;
       if (flowError.message.toLowerCase().includes("model not found")) {
         clientErrorMessage += ` The AI model was NOT FOUND by Google. This means your GOOGLE_GENAI_API_KEY or its associated Google Cloud Project does not have access to this model. PLEASE URGENTLY VERIFY in Google Cloud Console: 1. "Generative Language API" AND "Vertex AI API" are ENABLED. 2. BILLING is ENABLED for the project (many models, including vision models, require billing even if a free tier exists). 3. The API key is valid and unrestricted for these APIs. (Server hint: ${hint})`;
      } else if (flowError.message.toLowerCase().includes("api key") || flowError.message.toLowerCase().includes("permission denied") || flowError.message.toLowerCase().includes("quota")) {
         clientErrorMessage += ` A specific API Key, Permission, or Quota error was reported by Google. Check your GOOGLE_GENAI_API_KEY, its permissions, and quotas in Google Cloud Console. (Server hint: ${hint})`;
      } else if (flowError.message.toLowerCase().includes("service unavailable") || flowError.message.toLowerCase().includes("503")) {
        clientErrorMessage += ` The Google AI service reported "Service Unavailable (503)". This is often a temporary issue on Google's side. Please try again in a few minutes. If it persists, verify your project's health and quotas in the Google Cloud Console. (Server hint: ${hint})`;
      } else {
         clientErrorMessage += ` (Server hint: ${hint})`;
      }
    }
    clientErrorMessage += ' This might be due to Google Cloud API key, billing, or API enablement issues for "Generative Language API" and "Vertex AI API". Ensure Billing is active, as many GenAI models (especially vision) require it even if a free tier exists.';
    console.error('>>>> CHECK GOOGLE CLOUD CONSOLE FOR API ENABLEMENT (Generative Language API & Vertex AI API) & BILLING. <<<<');
    console.error('>>>> ENSURE GOOGLE_GENAI_API_KEY in .env.local is correct and active for the intended Google Cloud Project. <<<<');
    console.error('------------------------------------------------------------');
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

export interface UserSessionUpdateResult {
  success: boolean;
  isProfileComplete?: boolean;
  error?: string;
  uid?: string;
  name?: string | null;
  email?: string | null;
}

const getActionFirebaseConfig = () => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };

  const expectedProjectId = "trackmybite-1";
  const expectedAuthDomain = "trackmybite-1.firebaseapp.com";

  if (config.projectId !== expectedProjectId || config.authDomain !== expectedAuthDomain) {
    const errorMessage = `
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      ERROR: Stale Firebase Configuration Detected in Server Action!
      Your .env.local file may have been updated (expected project '${expectedProjectId}'), 
      but the Next.js server is still using OLD or different values.
      Detected projectId: "${config.projectId}" (Expected: "${expectedProjectId}")
      Detected authDomain: "${config.authDomain}" (Expected: "${expectedAuthDomain}")

      >>>>>> PLEASE COMPLETELY STOP AND RESTART your Next.js development server. <<<<<<
      (Ctrl+C in terminal, then 'npm run dev' or similar command)
      Changes to .env.local require a full server restart to take effect.
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    `;
    console.error(errorMessage);
    throw new Error(errorMessage); 
  }
  return config;
};


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
    getActionFirebaseConfig(); // Check for stale config
    let userProfile = await getUserProfile(uid);

    if (isNewUser && !userProfile) {
      console.log(`[Server Action - handleUserSessionUpdate] New user. Creating profile for UID: ${uid}`);
      await createUserProfileDocument(uid, { email: email || '', name: name || 'New User' });
      userProfile = await getUserProfile(uid);
      if (!userProfile) {
        throw new Error("Failed to retrieve newly created user profile after registration.");
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
       console.log(`[Server Action - handleUserSessionUpdate] Existing profile found for UID ${uid}. isProfileComplete: ${userProfile.isProfileComplete}`);
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
    getActionFirebaseConfig();
    await sendPasswordResetEmail(mainAuth, email);
    console.log(`[Server Action - sendPasswordResetEmailAction] Password reset email sent request for: ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Server Action - sendPasswordResetEmailAction] Error sending password reset email:", error);
    let errorMessage = error.message || "Failed to send password reset email.";
    if (error.code === 'auth/user-not-found') {
        errorMessage = "If an account exists for this email, a password reset link has been sent. Please check your inbox.";
    }
    return { success: false, error: errorMessage };
  }
}


// --- User Profile Detail Actions (Firestore) ---
export async function updateUserProfileDetailsAction(
  userId: string,
  details: UserProfileDetails
): Promise<{ success: boolean; error?: string }> {
  try {
    getActionFirebaseConfig(); 
    await updateUserProfileDetailsInFirestore(userId, details);
    console.log(`[Server Action - updateUserProfileDetailsAction] Profile details updated for UID: ${userId}`, details);
    return { success: true };
  } catch (error: any) {
    console.error("[Server Action - updateUserProfileDetailsAction] Error updating user profile details:", error);
    return { success: false, error: error.message || "Failed to update profile details." };
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
    getActionFirebaseConfig();
    // Ensure mealType is passed, defaulting if necessary
    const dataToSave = { ...foodLogData, mealType: foodLogData.mealType || 'random' };
    return await addFoodLogToFirestore(userId, dataToSave);
  } catch (error: any) {
    console.error("Error submitting food log via action:", error);
    throw new Error(error.message || "Failed to submit food log.");
  }
}

export async function fetchFoodLogs(userId: string, date?: Date): Promise<FullFoodLog[]> {
  try {
    return await getFoodLogsFromFirestore(userId, date);
  } catch (error: any) {
    console.error("Error fetching food logs via action:", error);
    throw new Error(error.message || "Failed to fetch food logs.");
  }
}

// --- Mood Log Actions (Firestore) ---
export async function submitMoodLog(userId: string, moodLogData: Omit<MoodLogTypeFromCard, 'id'>): Promise<string | null> {
  try {
    getActionFirebaseConfig();
    return await addMoodLogToFirestore(userId, moodLogData);
  } catch (error: any) {
    console.error("Error submitting mood log via action:", error);
    throw new Error(error.message || "Failed to submit mood log.");
  }
}

export async function fetchMoodLogs(userId: string, limitCount?: number): Promise<MoodLog[]> {
  try {
    return await getMoodLogsFromFirestore(userId, limitCount);
  } catch (error: any) {
    console.error("Error fetching mood logs via action:", error);
    throw new Error(error.message || "Failed to fetch mood logs.");
  }
}

// --- Leaderboard Actions (Firestore) ---
export async function fetchAllUsersForLeaderboard(): Promise<UserProfileData[]> {
    try {
        return await getAllUsersWithProfiles();
    } catch (error: any) {
        console.error("Error fetching all users for leaderboard:", error);
        throw new Error(error.message || "Failed to fetch leaderboard data.");
    }
}
