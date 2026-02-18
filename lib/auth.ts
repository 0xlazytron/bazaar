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
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db, isFirebaseReady } from "./firebase";

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
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string,
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Update profile with display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user profile in Firestore
    await createUserProfile(user, { displayName });

    return user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Google OAuth configuration
const getGoogleAuthConfig = () => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    console.warn(
      "Google Web Client ID not found in environment variables. Google Sign-In may not work properly.",
    );
    return null;
  }

  return {
    clientId: webClientId,
    scopes: ["openid", "profile", "email"],
    additionalParameters: {},
    customParameters: {},
  };
};

const getAndroidWebClientId = async (): Promise<string> => {
  try {
    const mod: any = await import("../android/app/google-services.json");
    const json = mod?.default ?? mod;
    const clients: any[] = Array.isArray(json?.client) ? json.client : [];
    const match =
      clients.find(
        (c) =>
          c?.client_info?.android_client_info?.package_name === "com.bazaar.mu",
      ) ||
      clients[0] ||
      null;
    const oauthClients: any[] = Array.isArray(match?.oauth_client)
      ? match.oauth_client
      : [];
    const web = oauthClients.find((c) => c?.client_type === 3) || null;
    const clientId = typeof web?.client_id === "string" ? web.client_id : "";
    if (clientId) return clientId;
  } catch { }
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    let userCredential;

    if (Platform.OS === "web") {
      const provider = new GoogleAuthProvider();
      userCredential = await signInWithPopup(auth, provider);
    } else {
      const webClientId =
        Platform.OS === "android"
          ? await getAndroidWebClientId()
          : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
      if (!webClientId) {
        throw new Error(
          "Google Web Client ID not found in environment variables",
        );
      }

      let nativeGoogleSignInModule:
        | typeof import("@react-native-google-signin/google-signin")
        | null = null;

      try {
        nativeGoogleSignInModule =
          await import("@react-native-google-signin/google-signin");
      } catch {
        nativeGoogleSignInModule = null;
      }

      if (!nativeGoogleSignInModule) {
        throw new Error("Google Sign-In is not available in this build");
      }

      const { GoogleSignin, statusCodes } = nativeGoogleSignInModule;

      try {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        GoogleSignin.configure({ webClientId });

        const userInfo: any = await GoogleSignin.signIn();
        let idToken =
          typeof userInfo?.idToken === "string" ? userInfo.idToken : "";
        if (!idToken) {
          const tokens: any = await GoogleSignin.getTokens();
          idToken = typeof tokens?.idToken === "string" ? tokens.idToken : "";
        }

        if (!idToken) {
          throw new Error("No ID token received from Google");
        }

        const googleCredential = GoogleAuthProvider.credential(idToken);
        userCredential = await signInWithCredential(auth, googleCredential);
      } catch (e: any) {
        const code = e?.code;
        if (code === statusCodes.SIGN_IN_CANCELLED) {
          throw new Error("cancelled");
        }
        if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          throw new Error("Google Play Services not available");
        }
        throw e;
      }
    }

    const user = userCredential.user;

    // Create or update user profile in Firestore
    await createUserProfile(user);

    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    // Sign out from Firebase
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Check if Google Sign-In is available
export const isGoogleSignInAvailable = async (): Promise<boolean> => {
  try {
    const config = getGoogleAuthConfig();
    if (!config) return false;

    if (Platform.OS === "web") return true;

    let nativeGoogleSignInModule:
      | typeof import("@react-native-google-signin/google-signin")
      | null = null;

    try {
      nativeGoogleSignInModule =
        await import("@react-native-google-signin/google-signin");
    } catch {
      nativeGoogleSignInModule = null;
    }

    if (!nativeGoogleSignInModule) return false;

    if (Platform.OS === "android") {
      const { GoogleSignin } = nativeGoogleSignInModule;
      const hasPlayServices = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: false,
      });
      return hasPlayServices;
    }

    return true;
  } catch (error) {
    console.warn("Google Sign-In not available:", error);
    return false;
  }
};

// Create user profile in Firestore
export const createUserProfile = async (
  user: User,
  additionalData?: { displayName?: string },
) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
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
      console.error("Error creating user profile:", error);
      throw error;
    }
  }

  return userRef;
};

// Get user profile from Firestore
export const getUserProfile = async (
  uid: string,
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

export const subscribeUserProfile = (
  uid: string,
  onUpdate: (profile: UserProfile | null) => void,
) => {
  try {
    const userRef = doc(db, "users", uid);
    return onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return onUpdate(null);
      onUpdate(snap.data() as UserProfile);
    });
  } catch (error) {
    console.error("Error subscribing user profile:", error);
    return () => { };
  }
};

export const setUserPresence = async (uid: string, online: boolean) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      { online, lastActive: new Date(), updatedAt: new Date() },
      { merge: true },
    );
  } catch (error) {
    console.error("Error setting user presence:", error);
  }
};

// Update user profile in Firestore and Firebase Auth
export const updateUserProfile = async (
  uid: string,
  profileData: {
    displayName?: string;
    photoURL?: string;
    email?: string;
    location?: string;
    bio?: string;
    phone?: string;
    hobbies?: string[];
  },
) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    // Update Firebase Auth profile
    if (
      profileData.displayName !== undefined ||
      profileData.photoURL !== undefined
    ) {
      await updateProfile(user, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
      });
    }

    // Update Firestore profile
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        ...profileData,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (
  callback: (user: User | null) => void,
): (() => void) => {
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
    console.error("Password reset error:", error);
    throw new Error(error.message || "Failed to send password reset email");
  }
};

// Export sendPasswordResetEmail for direct use
export { sendPasswordResetEmail };
