"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";
import { Share2, CheckCircle2, Loader2, BarChart2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PollPage() {
    const params = useParams();
    const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;

    const [poll, setPoll] = useState<any>(null);
    const [voted, setVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    // --- Logic remains largely the same ---
    useEffect(() => {
        if (!id) return;

        // Fetch initial poll data
        const token = localStorage.getItem("voteToken");
        console.log("Vote token from localStorage:", token);
        api.get(`/polls/${id}`, {
            headers: token ? { "x-vote-token": token } : {}
        }).then(res => {
            console.log("API Response:", res.data);
            console.log("User voted option:", res.data.userVotedOption);
            setPoll(res.data.poll);
            // Check if user has already voted (by token)
            if (token && res.data.poll.votedTokens && Array.isArray(res.data.poll.votedTokens)) {
                if (res.data.poll.votedTokens.includes(token)) {
                    setVoted(true);
                    // Set the selected option if backend returned it
                    if (res.data.userVotedOption !== null && res.data.userVotedOption !== undefined) {
                        console.log("Setting selected option to:", res.data.userVotedOption);
                        setSelectedOption(res.data.userVotedOption);
                    }
                }
            }
        });

        // Connect socket and join room
        if (!socket.connected) {
            socket.connect();
        }

        // Wait for connection before joining poll room
        const joinPollRoom = () => {
            console.log("Joining poll room:", id);
            socket.emit("joinPoll", id);
        };

        if (socket.connected) {
            joinPollRoom();
        } else {
            socket.once("connect", joinPollRoom);
        }

        // Define handler function with proper reference
        const handleVoteUpdate = (updatedPoll: any) => {
            console.log("Received vote update:", updatedPoll);
            setPoll(updatedPoll);
        };

        // Listen for vote updates
        socket.on("voteUpdate", handleVoteUpdate);

        // Cleanup function
        return () => {
            console.log("Leaving poll room:", id);
            socket.off("voteUpdate", handleVoteUpdate);
            socket.off("connect", joinPollRoom);
            // Don't disconnect if other components might use it
            // socket.disconnect();
        };
    }, [id]);

    const vote = async (index: number) => {
        if (voted || !id) {
            if (voted) {
                toast.error("You've already voted on this poll!");
            }
            return;
        }

        // Optimistic UI update for immediate feedback
        setSelectedOption(index);
        const loadingToast = toast.loading("Recording your vote...");

        const token = localStorage.getItem("voteToken");
        try {
            const res = await api.post(
                `/polls/${id}/vote`,
                { optionIndex: index },
                { headers: token ? { "x-vote-token": token } : {} }
            );
            if (res.data.voteToken) {
                localStorage.setItem("voteToken", res.data.voteToken);
            }
            setVoted(true);
            setSelectedOption(index);
            toast.success("Vote recorded successfully!", { id: loadingToast });
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err.message;
            if (errorMsg.includes("Already voted")) {
                toast.error("You've already voted on this poll!", { id: loadingToast });
            } else {
                toast.error("Voting failed: " + errorMsg, { id: loadingToast });
            }
            setSelectedOption(null); // Revert on failure
        }
    };

    const handleShare = () => {
        if (!id) return;
        navigator.clipboard.writeText(window.location.href);
        toast.success("Poll link copied to clipboard!");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // --- Loading State ---
    if (!poll) return (
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

                            return (
                                <div key={i} className="space-y-2">
                                    <button
                                        disabled={voted}
                                        onClick={() => vote(i)}
                                        className={`relative w-full text-left group transition-all duration-300 outline-none rounded-xl
                    ${voted ? 'cursor-default' : 'hover:scale-[1.01] hover:shadow-md cursor-pointer'}
                    ${voted && isSelected ? 'ring-2 ring-[#1a6b3a] scale-[1.02]' : ''}
                  `}
                                    >
                                        {/* Background Progress Bar (Only visible after voting) */}
                                        <div className="absolute inset-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out ${isSelected && voted ? 'bg-gradient-to-r from-green-500/20 to-green-600/20' : 'bg-slate-200/50'
                                                    }`}
                                                style={{ width: voted ? `${percent}%` : '0%' }}
                                            />
                                        </div>

                                        {/* Content Overlay */}
                                        <div className={`relative p-4 flex items-center gap-3 z-10 rounded-xl border transition-all
                     ${voted
                                                ? 'border-transparent'
                                                : 'bg-white border-slate-200 hover:border-green-300 hover:ring-4 hover:ring-green-50'
                                            }
                     ${voted && isSelected ? 'bg-white/80' : ''}
                  `}>
                                            {/* Checkbox Circle UI */}
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                          ${isSelected && voted
                                                    ? 'border-[#1a6b3a] bg-[#1a6b3a] text-white'
                                                    : isSelected
                                                        ? 'border-[#1a6b3a] bg-[#1a6b3a] text-white'
                                                        : 'border-slate-300 group-hover:border-green-400'
                                                }
                       `}>
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            </div>

                                            <span className={`font-medium flex-1 ${isSelected && voted ? 'text-green-900 font-semibold' : isSelected ? 'text-green-900' : 'text-slate-700'}`}>
                                                {opt.text}
                                            </span>

                                            {/* Show "Your vote" badge if selected and voted */}
                                            {voted && isSelected && (
                                                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                    Your Vote
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Vote count and Percentage below option */}
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