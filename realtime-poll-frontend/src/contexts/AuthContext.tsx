"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import toast from "react-hot-toast";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            toast.success(`Welcome, ${result.user.displayName || 'User'}!`);
        } catch (error: any) {
            console.error("Login error:", error);

            // Handle specific errors
            if (error.code === 'auth/popup-closed-by-user') {
                toast.error("Login cancelled");
            } else if (error.code === 'auth/popup-blocked') {
                toast.error("Popup blocked. Please allow popups for this site.");
            } else {
                toast.error("Failed to sign in with Google");
            }
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            toast.success("Signed out successfully");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to sign out");
            throw error;
        }
    };

    const getIdToken = async (): Promise<string | null> => {
        try {
            if (user) {
                return await user.getIdToken();
            }
            return null;
        } catch (error) {
            console.error("Error getting ID token:", error);
            return null;
        }
    };

    const value = {
        user,
        loading,
        signInWithGoogle,
        signOut,
        getIdToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
