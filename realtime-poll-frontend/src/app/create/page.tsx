"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, BarChart3, AlignLeft, Share2, CheckCircle2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Suspense } from "react";

function getPollLink(pollId: string) {
    if (typeof window !== "undefined") {
        return `${window.location.origin}/poll/${pollId}`;
    }
    return `/poll/${pollId}`;
}

export default function CreatePollPageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreatePollPage />
        </Suspense>
    );
}

function CreatePollPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuestion = searchParams.get("question") || "";
    const [question, setQuestion] = useState(initialQuestion);
    const [options, setOptions] = useState(["", ""]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [createdPollId, setCreatedPollId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (initialQuestion && !question) setQuestion(initialQuestion);
    }, [initialQuestion, question]);

    // Create poll handler
    const handleCreatePoll = async () => {
        const trimmedQuestion = question.trim();
        const filteredOptions = options.map(o => o.trim()).filter(o => o);
        if (!trimmedQuestion) {
            alert("Please enter a poll question.");
            return;
        }
        if (filteredOptions.length < 2) {
            alert("Please enter at least two options.");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post("/polls", {
                question: trimmedQuestion,
                options: filteredOptions
            });
            const pollId = res.data.poll?._id || res.data.poll?.id;
            if (pollId) {
                setCreatedPollId(pollId);
                setShowModal(true);
            } else {
                alert("Poll created but no ID returned.");
            }
        } catch (err: any) {
            alert("Failed to create poll: " + (err?.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Helper to handle option changes
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    // Helper to add a new option field
    const addOption = () => {
        setOptions([...options, ""]);
    };

    // Helper to remove an option field
    const removeOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    return (
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">

            {/* Main Card Container */}
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

                {/* Header Section */}
                <div className="bg-indigo-50/50 p-8 text-center border-b border-indigo-100">
                    <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                        <BarChart3 className="text-white w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Create a New Poll
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        Ask your community anything and get real-time feedback.
                    </p>
                </div>

                {/* Form Section */}
                <div className="p-8 space-y-8">

                    {/* Question Field */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 ml-1">
                            Poll Question
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <AlignLeft className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                placeholder="e.g., What framework is best for 2025?"
                                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-gray-900 placeholder:text-gray-400 font-medium"
                            />
                        </div>
                    </div>

                    {/* Options Section */}
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-700 ml-1">
                            Answer Options
                        </label>

                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-3 items-center group">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <div className="h-2 w-2 rounded-full bg-gray-300 group-focus-within:bg-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-gray-700"
                                        />
                                    </div>

                                    {/* Delete Button (Only shows if more than 2 options) */}
                                    {options.length > 2 && (
                                        <button
                                            onClick={() => removeOption(index)}
                                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Option Button */}
                        <button
                            onClick={addOption}
                            className="mt-2 flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add another option
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex items-center justify-end gap-4">
                        <button className="px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleCreatePoll}
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating..." : "Create Poll"}
                        </button>

                        {/* Share Modal */}
                        {showModal && createdPollId && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative flex flex-col items-center">
                                    <button
                                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold"
                                        onClick={() => setShowModal(false)}
                                        aria-label="Close"
                                    >
                                        ×
                                    </button>
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
                                    <h3 className="text-xl font-bold mb-2 text-gray-900 text-center">Poll Created!</h3>
                                    <p className="text-gray-500 mb-4 text-center">Share this link to invite others to vote:</p>
                                    <div className="w-full flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 mb-4">
                                        <input
                                            className="flex-1 bg-transparent outline-none text-gray-700 text-sm"
                                            value={getPollLink(createdPollId)}
                                            readOnly
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(getPollLink(createdPollId));
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 1500);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                        >
                                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                            {copied ? "Copied!" : "Copy Link"}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/poll/${createdPollId}`)}
                                        className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200"
                                    >
                                        Go to Poll
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}