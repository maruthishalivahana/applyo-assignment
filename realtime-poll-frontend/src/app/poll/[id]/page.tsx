"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";
import { getClientId } from "@/lib/clientId";
import { useAuth } from "@/contexts/AuthContext";
import { Share2, CheckCircle2, Loader2, BarChart2, LogIn, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function PollPage() {
    const params = useParams();
    const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
    const { user, signInWithGoogle, getIdToken, loading: authLoading } = useAuth();

    const [poll, setPoll] = useState<any>(null);
    const [voted, setVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [tempSelectedOption, setTempSelectedOption] = useState<number | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [pollNotFound, setPollNotFound] = useState(false);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Number keys 1-9 to select options
            if (e.key >= '1' && e.key <= '9') {
                const optionIndex = parseInt(e.key) - 1;
                if (poll && optionIndex < poll.options.length && !voted && user) {
                    e.preventDefault();
                    handleOptionSelect(optionIndex);
                }
            }
            // Enter to submit vote
            else if (e.key === 'Enter' && tempSelectedOption !== null && !voted && user) {
                e.preventDefault();
                submitVote();
            }
            // 'S' or 'C' to share/copy link
            else if ((e.key === 's' || e.key === 'S' || e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                handleShare();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [poll, voted, selectedOption, user]);

    // Fetch poll data
    useEffect(() => {
        if (!id) return;

        const fetchPoll = async () => {
            try {
                const token = await getIdToken();
                const voteToken = localStorage.getItem("voteToken");
                const clientId = getClientId();

                const res = await api.get(`/polls/${id}`, {
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }),
                        ...(voteToken && { "x-vote-token": voteToken }),
                        ...(clientId && { "x-client-id": clientId })
                    }
                });

                setPoll(res.data.poll);

                // Check if user has voted
                if (res.data.userVotedOption !== null && res.data.userVotedOption !== undefined) {
                    setVoted(true);
                    setSelectedOption(res.data.userVotedOption);
                }
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    setPollNotFound(true);
                } else {
                    toast.error("Failed to load poll");
                }
            }
        };

        fetchPoll();

        // Connect socket and join room
        if (!socket.connected) {
            socket.connect();
        }

        const joinPollRoom = () => {
            console.log(`🎯 Joining poll room: ${id}`);
            socket.emit("joinPoll", id);
        };

        if (socket.connected) {
            joinPollRoom();
        } else {
            socket.once("connect", joinPollRoom);
        }

        // Listen for vote updates
        const handleVoteUpdate = (updatedPoll: any) => {
            console.log("📊 Received vote update:", updatedPoll);
            setPoll(updatedPoll);
        };

        socket.on("voteUpdate", handleVoteUpdate);

        return () => {
            socket.off("voteUpdate", handleVoteUpdate);
            socket.off("connect", joinPollRoom);
        };
    }, [id, user]);

    const handleOptionSelect = (index: number) => {
        if (!user) {
            toast.error("Please sign in with Google to vote");
            return;
        }

        if (voted) {
            toast.error("You've already voted on this poll!");
            return;
        }

        // Allow changing selection before submission
        if (tempSelectedOption === index) {
            // Deselect if clicking the same option
            setTempSelectedOption(null);
        } else {
            // Select new option
            setTempSelectedOption(index);
        }
    };

    const submitVote = async () => {
        if (!user) {
            toast.error("Please sign in with Google to vote");
            return;
        }

        if (voted || !id || tempSelectedOption === null) {
            return;
        }

        const loadingToast = toast.loading("Recording your vote...");

        try {
            const token = await getIdToken();

            if (!token) {
                toast.error("Authentication error. Please sign in again.", { id: loadingToast });
                return;
            }

            const voteToken = localStorage.getItem("voteToken");
            const clientId = getClientId();

            const res = await api.post(
                `/polls/${id}/vote`,
                { optionIndex: tempSelectedOption },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        ...(voteToken && { "x-vote-token": voteToken }),
                        ...(clientId && { "x-client-id": clientId })
                    }
                }
            );

            // Store the returned vote token for future requests
            if (res.data.voteToken) {
                localStorage.setItem("voteToken", res.data.voteToken);
            }

            setVoted(true);
            setSelectedOption(tempSelectedOption);
            setTempSelectedOption(null);
            toast.success("Vote recorded successfully!", { id: loadingToast });
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err.message;

            if (err?.response?.status === 401) {
                toast.error("Please sign in to vote", { id: loadingToast });
            } else if (errorMsg.includes("already voted") || err?.response?.data?.alreadyVoted) {
                toast.error("You've already voted on this poll!", { id: loadingToast });
                setVoted(true);
            } else {
                toast.error("Failed to record vote: " + errorMsg, { id: loadingToast });
            }
            setTempSelectedOption(null); // Revert on failure
        }
    };

    const handleShare = () => {
        if (!id) return;
        navigator.clipboard.writeText(window.location.href);
        toast.success("Poll link copied to clipboard!");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Poll Not Found
    if (pollNotFound) {
        notFound();
    }

    // Loading State
    if (!poll || authLoading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#1a6b3a] animate-spin" />
        </div>
    );

    const totalVotes = poll.options.reduce(
        (sum: number, o: any) => sum + o.votes, 0
    );

    return (
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
            <div className="w-full max-w-xl">

                {/* Authentication Notice */}
                {!user && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-900 mb-1">
                                Sign in Required to Vote
                            </p>
                            <p className="text-sm text-amber-700 mb-3">
                                You need to sign in with your Google account to vote on this poll.
                            </p>
                            <button
                                onClick={signInWithGoogle}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-medium text-sm shadow-sm"
                            >
                                <LogIn size={16} />
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                )}

                {/* Voting Instructions */}
                {user && !voted && tempSelectedOption === null && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 mb-1">
                                How to Vote
                            </p>
                            <p className="text-sm text-blue-700">
                                Click on an option to select it. You can change your selection before submitting. Click "Submit Vote" to confirm your choice.
                            </p>
                        </div>
                    </div>
                )}

                {/* Card Container */}
                <div className="bg-white rounded-3xl shadow-xl shadow-green-100/50 border border-slate-100 overflow-hidden">

                    {/* Header */}
                    <div className="bg-slate-50/50 p-8 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Live Poll
                            </span>
                            <span className="text-slate-400 text-sm font-medium flex items-center gap-1">
                                <BarChart2 className="w-4 h-4" /> {totalVotes} votes
                            </span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                            {poll.question}
                        </h2>
                    </div>

                    {/* Options List */}
                    <div className="p-8 space-y-5">
                        {poll.options.map((opt: any, i: number) => {
                            const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                            const isSelected = selectedOption === i;
                            const isTempSelected = tempSelectedOption === i;
                            const canVote = user && !voted;

                            return (
                                <div key={i} className="space-y-2">
                                    <button
                                        disabled={!canVote}
                                        onClick={() => canVote && handleOptionSelect(i)}
                                        className={`relative w-full text-left group transition-all duration-300 outline-none rounded-xl
                    ${canVote ? 'hover:scale-[1.01] hover:shadow-md cursor-pointer' : 'cursor-default'}
                    ${voted && isSelected ? 'ring-2 ring-[#1a6b3a] scale-[1.02]' : ''}
                    ${!voted && isTempSelected ? 'ring-2 ring-green-500 scale-[1.02]' : ''}
                    ${!user ? 'opacity-60' : ''}
                  `}
                                    >
                                        {/* Background Progress Bar */}
                                        <div className="absolute inset-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out ${isSelected && voted
                                                    ? 'bg-gradient-to-r from-green-500/20 to-green-600/20'
                                                    : isTempSelected && !voted
                                                        ? 'bg-gradient-to-r from-green-500/20 to-green-600/20'
                                                        : 'bg-slate-200/50'
                                                    }`}
                                                style={{ width: voted ? `${percent}%` : isTempSelected ? '100%' : '0%' }}
                                            />
                                        </div>

                                        {/* Content Overlay */}
                                        <div className={`relative p-4 flex items-center gap-3 z-10 rounded-xl border transition-all
                     ${voted
                                                ? 'border-transparent'
                                                : canVote
                                                    ? 'bg-white border-slate-200 hover:border-green-300 hover:ring-4 hover:ring-green-50'
                                                    : 'bg-white border-slate-200'
                                            }
                     ${voted && isSelected ? 'bg-white/80' : ''}
                  `}>
                                            {/* Checkbox Circle */}
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0
                          ${isSelected && voted
                                                    ? 'border-[#1a6b3a] bg-[#1a6b3a] text-white'
                                                    : isTempSelected && !voted
                                                        ? 'border-green-600 bg-green-600 text-white'
                                                        : 'border-slate-300 group-hover:border-green-400'
                                                }
                       `}>
                                                {(isSelected && voted) || (isTempSelected && !voted) ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                                            </div>

                                            <span className={`font-medium flex-1 ${isSelected && voted
                                                ? 'text-green-900 font-semibold'
                                                : isTempSelected && !voted
                                                    ? 'text-green-900 font-semibold'
                                                    : 'text-slate-700'
                                                }`}>
                                                {opt.text}
                                            </span>

                                            {/* "Your vote" badge */}
                                            {voted && isSelected && (
                                                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                    Your Vote
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Vote count and Percentage */}
                                    {voted && (
                                        <div className="pl-9 flex items-center justify-between gap-3 text-sm">
                                            <span className={`font-bold ${isSelected ? 'text-[#1a6b3a]' : 'text-slate-600'}`}>
                                                {percent}%
                                            </span>
                                            <span className="text-slate-500">
                                                {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Submit Vote Button - Only shown when option is selected but not yet submitted */}
                        {!voted && tempSelectedOption !== null && user && (
                            <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-center">
                                <button
                                    onClick={submitVote}
                                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Submit Vote
                                </button>
                                <button
                                    onClick={() => setTempSelectedOption(null)}
                                    className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer / Share */}
                    <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">
                            Poll ID: <span className="font-mono">{id?.slice(0, 8)}...</span>
                        </p>

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 text-sm font-semibold text-[#1a6b3a] hover:text-[#166534] bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            {isCopied ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4" />
                                    Share Poll
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}