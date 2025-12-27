import { Buffer } from 'buffer';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db, isFirebaseReady } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  location?: string;
  bio?: string;
  phone?: string;
  hobbies?: string[];
  online?: boolean;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user profile in Firestore
    await createUserProfile(user, { displayName });

    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Google OAuth configuration
const getGoogleAuthConfig = () => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    console.warn('Google Web Client ID not found in environment variables. Google Sign-In may not work properly.');
    return null;
  }

  return {
    clientId: webClientId,
    scopes: ['openid', 'profile', 'email'],
    additionalParameters: {},
    customParameters: {},
  };
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    let userCredential;

    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      userCredential = await signInWithPopup(auth, provider);
    } else {
      // For React Native mobile platforms using expo-auth-session
      const config = getGoogleAuthConfig();
      if (!config) {
        throw new Error('Google authentication not configured properly');
      }

      // Generate code verifier and challenge for PKCE
      const codeVerifierBytes = await Crypto.getRandomBytesAsync(32);
      const codeVerifier = Buffer.from(codeVerifierBytes).toString('base64url');
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );

      const request = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        responseType: AuthSession.ResponseType.Code,
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'bazaar',
          path: 'auth'
        }),
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        extraParams: config.customParameters,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type !== 'success') {
        throw new Error('Google Sign-In was cancelled or failed');
      }

      if (!result.params.code) {
        throw new Error('No authorization code received from Google');
      }

      // Exchange code for tokens
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: config.clientId,
          code: result.params.code,
          redirectUri: AuthSession.makeRedirectUri({
            scheme: 'bazaar',
            path: 'auth'
          }),
          extraParams: {
            code_verifier: codeVerifier,
          },
        },
        {
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
        }
      );

      if (!tokenResult.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create Firebase credential and sign in
      const googleCredential = GoogleAuthProvider.credential(tokenResult.idToken);
      userCredential = await signInWithCredential(auth, googleCredential);
    }

    const user = userCredential.user;

    // Create or update user profile in Firestore
    await createUserProfile(user);

    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    // Sign out from Firebase
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Check if Google Sign-In is available
export const isGoogleSignInAvailable = async (): Promise<boolean> => {
  try {
    const config = getGoogleAuthConfig();
    return config !== null;
  } catch (error) {
    console.warn('Google Sign-In not available:', error);
    return false;
  }
};

// Create user profile in Firestore
export const createUserProfile = async (user: User, additionalData?: { displayName?: string }) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt,
        updatedAt: createdAt,
        ...additionalData,
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  return userRef;
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const subscribeUserProfile = (uid: string, onUpdate: (profile: UserProfile | null) => void) => {
  try {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return onUpdate(null);
      onUpdate(snap.data() as UserProfile);
    });
  } catch (error) {
    console.error('Error subscribing user profile:', error);
    return () => { };
  }
};

export const setUserPresence = async (uid: string, online: boolean) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { online, lastActive: new Date(), updatedAt: new Date() }, { merge: true });
  } catch (error) {
    console.error('Error setting user presence:', error);
  }
};

// Update user profile in Firestore and Firebase Auth
export const updateUserProfile = async (uid: string, profileData: {
  displayName?: string;
  photoURL?: string;
  email?: string;
  location?: string;
  bio?: string;
  phone?: string;
  hobbies?: string[];
}) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Update Firebase Auth profile
    if (profileData.displayName !== undefined || profileData.photoURL !== undefined) {
      await updateProfile(user, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
      });
    }

    // Update Firestore profile
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...profileData,
      updatedAt: new Date(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  if (!isFirebaseReady()) {
    setTimeout(() => callback(null), 0);
    return () => { };
  }
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  if (!isFirebaseReady()) return null;
  return auth.currentUser;
};

// Password reset function
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

// Export sendPasswordResetEmail for direct use
export { sendPasswordResetEmail };
