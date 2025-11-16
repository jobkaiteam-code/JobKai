import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_PUBLIC_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Get Firebase ID token for the current user
 * @param forceRefresh - Force token refresh (default: false)
 * @returns Promise<string | null>
 */
export const getFirebaseToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken(forceRefresh);
      // Keep sessionStorage in sync
      sessionStorage.setItem('authToken', token);
      return token;
    } catch (error) {
      console.error('Failed to get Firebase token:', error);
      return null;
    }
  }
  return null;
};

/**
 * Setup automatic token refresh every 50 minutes
 * Firebase tokens expire after 1 hour, so we refresh at 50 minutes
 */
export const setupTokenRefresh = () => {
  // Refresh token every 50 minutes (before 60 minute expiry)
  const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes in milliseconds
  
  let refreshInterval: NodeJS.Timeout | null = null;
  
  // Listen for auth state changes
  onAuthStateChanged(auth, (user) => {
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
    
    if (user) {
      // User is signed in, start token refresh interval
      refreshInterval = setInterval(async () => {
        try {
          const freshToken = await user.getIdToken(true); // Force refresh
          sessionStorage.setItem('authToken', freshToken);
          console.log('Firebase token refreshed automatically');
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }, REFRESH_INTERVAL);
      
      console.log('Token auto-refresh enabled (every 50 minutes)');
    } else {
      // User is signed out, clear token
      sessionStorage.removeItem('authToken');
      console.log('Token auto-refresh disabled (user signed out)');
    }
  });
};

/**
 * Sign out user and clear tokens
 */
export const signOutUser = async () => {
  try {
    await auth.signOut();
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('jobkai_needs_onboarding');
    localStorage.clear(); // Clear any other stored data
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};
