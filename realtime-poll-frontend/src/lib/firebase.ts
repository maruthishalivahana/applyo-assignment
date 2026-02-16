import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/**
 * Firebase Configuration for Frontend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Create a new project or select existing project
 * 3. Go to Project Settings > General
 * 4. Scroll down to "Your apps" section and click "Web" icon
 * 5. Register your app and copy the config values
 * 6. Create a .env.local file in the frontend root with these values:
 *    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
 *    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
 *    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
 *    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
 *    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 *    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
 * 
 * 7. Enable Google Authentication:
 *    - In Firebase Console, go to Authentication > Sign-in method
 *    - Enable "Google" provider
 *    - Add authorized domains (localhost, your production domain)
 */

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (avoid duplicates)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account' // Force account selection every time
});

export default app;
