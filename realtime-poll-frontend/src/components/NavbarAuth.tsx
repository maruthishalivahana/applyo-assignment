"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";

export default function NavbarAuth() {
    const { user, signInWithGoogle, signOut, loading } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    if (loading) {
        return <div className="w-8 h-8 animate-pulse bg-slate-200 rounded-full"></div>;
    }

    if (!user) {
        return (
            <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a6b3a] text-white rounded-lg hover:bg-[#1a6b3a]/90 transition-all font-medium text-sm shadow-sm hover:shadow-md"
            >
                <LogIn size={16} />
                Sign in with Google
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-8 h-8 rounded-full border-2 border-[#1a6b3a]"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1a6b3a] flex items-center justify-center text-white">
                        <User size={18} />
                    </div>
                )}
                <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate hidden sm:block">
                    {user.displayName || user.email}
                </span>
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-20 overflow-hidden">
                        <div className="p-4 border-b border-slate-200">
                            <p className="font-medium text-slate-900 truncate">
                                {user.displayName}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                                {user.email}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                signOut();
                                setShowDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <LogOut size={16} />
                            Sign out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
