// src/lib/firebase/init.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore'; // Added Firestore
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from "firebase/analytics";

const FIREBASE_APP_NAME = "TrackMyBiteApp"; // Define a specific name for our app

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// --- BEGIN CRITICAL DIAGNOSTIC LOGS ---
console.log("=====================================================================");
console.log("Firebase Initialization Check (src/lib/firebase/init.ts)");
console.log("---------------------------------------------------------------------");
console.log("Attempting to use the following Firebase configuration from .env.local:");
const ENV_MISSING_MSG = ">> MISSING in .env.local or server not restarted <<";
console.log(`  NEXT_PUBLIC_FIREBASE_API_KEY: ${firebaseConfig.apiKey ? '********' + String(firebaseConfig.apiKey).slice(-4) : ENV_MISSING_MSG}`);
console.log(`  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${firebaseConfig.authDomain || ENV_MISSING_MSG}`);
console.log(`  NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${firebaseConfig.projectId || ENV_MISSING_MSG}`);
console.log(`  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${firebaseConfig.storageBucket || (ENV_MISSING_MSG + ' (Optional, for Storage)')}`);
console.log(`  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${firebaseConfig.messagingSenderId || (ENV_MISSING_MSG + ' (Optional, for FCM)')}`);
console.log(`  NEXT_PUBLIC_FIREBASE_APP_ID: ${firebaseConfig.appId ? '********' + String(firebaseConfig.appId).slice(-4) : ENV_MISSING_MSG}`);
console.log(`  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ${firebaseConfig.measurementId || (ENV_MISSING_MSG + ' (Optional, for Analytics)')}`);
console.log("---------------------------------------------------------------------");

const essentialVars = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
};

const missingEssentialVarKeys = Object.entries(essentialVars)
  .filter(([key, value]) => !value)
  .map(([key]) => {
    const envVarSuffix = key.replace(/([A-Z])/g, '_$1').toUpperCase();
    return `NEXT_PUBLIC_FIREBASE_${envVarSuffix.startsWith('_') ? envVarSuffix.substring(1) : envVarSuffix}`;
});

if (missingEssentialVarKeys.length > 0) {
  const errorMessage = `
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    CRITICAL FIREBASE CONFIGURATION ERROR in src/lib/firebase/init.ts:
    Firebase SDK is missing essential configuration values from .env.local.
    This WILL lead to "auth/configuration-not-found" or similar errors.

    Detected missing or empty values for:
${missingEssentialVarKeys.map(v => `    - ${v}`).join("\n")}

    PLEASE URGENTLY CHECK THE FOLLOWING:
    1. '.env.local' File:
       - Ensure it exists in the ROOT directory of your project.
       - Ensure it contains the correct Firebase credentials.
       - Ensure variable names START WITH 'NEXT_PUBLIC_'.
       - Ensure there are NO TYPOS in variable names (e.g., APIKEY vs API_KEY).
       - Ensure values are NOT empty strings.
    2. SERVER RESTART: You MUST restart your Next.js development server
       (Ctrl+C in terminal, then 'npm run dev') AFTER creating or modifying '.env.local'.

    Review the console logs above this message to see exactly what values were read by Next.js.
    Firebase cannot be initialized correctly without these core settings.
    =====================================================================
  `;
  console.error(errorMessage);
}


let firebaseApp: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore; // Added Firestore instance
let storageInstance: FirebaseStorage;
let analyticsInstance: Analytics | undefined = undefined;

try {
  const existingApp = getApps().find(app => app.name === FIREBASE_APP_NAME);
  if (existingApp) {
    console.log(`[Firebase Init] Firebase app named "${FIREBASE_APP_NAME}" already exists. Using this instance.`);
    firebaseApp = existingApp;
  } else {
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      throw new Error("Essential Firebase configuration (apiKey, authDomain, projectId) is missing. Cannot initialize Firebase. Check .env.local and restart server.");
    }
    console.log(`[Firebase Init] Firebase app named "${FIREBASE_APP_NAME}" not found. Calling initializeApp().`);
    firebaseApp = initializeApp(firebaseConfig, FIREBASE_APP_NAME);
  }
  
  console.log(`[Firebase Init] Using Firebase app "${firebaseApp.name}". Options:`, {
    apiKey: firebaseApp.options.apiKey ? '********' + String(firebaseApp.options.apiKey).slice(-4) : 'MISSING_IN_APP_INSTANCE',
    authDomain: firebaseApp.options.authDomain || 'MISSING_IN_APP_INSTANCE',
    projectId: firebaseApp.options.projectId || 'MISSING_IN_APP_INSTANCE',
  });

  authInstance = getAuth(firebaseApp);
  dbInstance = getFirestore(firebaseApp); // Initialize Firestore
  storageInstance = getStorage(firebaseApp);
  
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
      analyticsInstance = getAnalytics(firebaseApp);
      console.log(`[Firebase Init] Firebase Analytics obtained for app "${firebaseApp.name}".`);
    } catch (analyticsError) {
        console.warn(`[Firebase Init] Firebase Analytics could not be initialized for app "${firebaseApp.name}":`, analyticsError);
    }
  } else if (typeof window !== 'undefined' && !firebaseConfig.measurementId) {
    console.log(`[Firebase Init] Firebase Analytics skipped (no measurementId in config) for app "${firebaseApp.name}".`);
  } else {
    console.log(`[Firebase Init] Firebase Analytics skipped (server side) for app "${firebaseApp.name}".`);
  }
  
  console.log(`[Firebase Init] Firebase services (Auth, Firestore, Storage) obtained for app "${firebaseApp.name}". Auth app name: ${authInstance.app.name}`);
  console.log("=====================================================================");

} catch (error: any) {
  console.error(`[Firebase Init] Error during Firebase app/service initialization for app "${FIREBASE_APP_NAME}":`, error.message);
  console.error("[Firebase Init] Configuration attempted:", { ...firebaseConfig, apiKey: firebaseConfig.apiKey ? "PRESENT_BUT_MASKED" : "MISSING_IN_CONFIG_OBJECT_AT_INIT_ERROR" });
  console.log("=====================================================================");
}

// Export the instances
// @ts-ignore
export { authInstance as auth, dbInstance as db, storageInstance as storage, analyticsInstance as analytics, firebaseApp };
