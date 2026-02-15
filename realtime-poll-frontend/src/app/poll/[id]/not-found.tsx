"use client";

import Link from "next/link";
import { AlertCircle, Home, Plus } from "lucide-react";

export default function PollNotFound() {
    return (
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                {/* Icon */}
                <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Poll Not Found
                </h1>

                {/* Description */}
                <p className="text-gray-600 mb-8 leading-relaxed">
                    The poll you're looking for doesn't exist or may have been deleted.
                    Please check the URL and try again.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a6b3a] hover:bg-[#166534] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            <Home className="w-5 h-5" />
                            Go Home
                        </button>
                    </Link>
                    <Link href="/create">
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-[#1a6b3a] transition-all">
                            <Plus className="w-5 h-5" />
                            Create New Poll
                        </button>
                    </Link>
                </div>

                {/* Additional Info */}
                <div className="mt-12 p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">Tip:</span> Make sure you copied the complete poll URL.
                    </p>
                </div>
            </div>
        </main>
    );
}
