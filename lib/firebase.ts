import { getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: any;
let auth: Auth;
let db: any;
let storage: any;
let firebaseInitError: Error | null = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  firebaseInitError = error instanceof Error ? error : new Error(String(error));
  app = undefined;
  auth = {} as Auth;
  db = {} as any;
  storage = {} as any;
}

export const isFirebaseReady = () => firebaseInitError === null;
export const getFirebaseInitError = () => firebaseInitError;
export { auth, db, storage };
export default app;
