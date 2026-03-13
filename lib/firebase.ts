import { getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

const getExtra = () => {
  const anyConstants = Constants as any;
  return (
    Constants.expoConfig?.extra ??
    anyConstants?.manifest?.extra ??
    anyConstants?.manifest2?.extra ??
    {}
  );
};

const firebaseExtra = (getExtra() as any)?.firebase ?? {};

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || firebaseExtra.apiKey,
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseExtra.authDomain,
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || firebaseExtra.projectId,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseExtra.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseExtra.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || firebaseExtra.appId,
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || firebaseExtra.measurementId,
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
