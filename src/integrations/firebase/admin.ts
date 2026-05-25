// Server-side Firebase Admin SDK
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
};

// Check if credentials exist
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!firebaseConfig.projectId || !firebaseConfig.storageBucket) {
  const missing = [];
  if (!firebaseConfig.projectId) missing.push("VITE_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.storageBucket) missing.push("VITE_FIREBASE_STORAGE_BUCKET");

  const message = `Missing Firebase environment variable(s): ${missing.join(", ")}`;
  console.error(`[Firebase Admin] ${message}`);
  throw new Error(message);
}

let adminApp = getApps()[0];

if (!adminApp) {
  if (!serviceAccountKey) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable. " +
      "Generate it from Firebase Console > Project Settings > Service Accounts"
    );
  }

  try {
    adminApp = initializeApp({
      credential: cert(JSON.parse(serviceAccountKey)),
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
