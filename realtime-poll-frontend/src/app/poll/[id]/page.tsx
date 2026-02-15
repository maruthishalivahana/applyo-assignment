"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";
import { Share2, CheckCircle2, Loader2, BarChart2 } from "lucide-react";

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
        api.get(`/polls/${id}`).then(res => {
            setPoll(res.data.poll);
            // Check if user has already voted (by token)
            const token = localStorage.getItem("voteToken");
            if (token && res.data.poll.votedTokens && Array.isArray(res.data.poll.votedTokens)) {
                if (res.data.poll.votedTokens.includes(token)) {
                    setVoted(true);
                }
            }
        });

        // Connect socket and join room
        if (!socket.connected) {
            socket.connect();
        }

        console.log("Joining poll room:", id);
        socket.emit("joinPoll", id);

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
            // Don't disconnect if other components might use it
            // socket.disconnect();
        };
    }, [id]);

    const vote = async (index: number) => {
        if (voted || !id) return;

        // Optimistic UI update for immediate feedback
        setSelectedOption(index);

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
        } catch (err: any) {
            alert("Voting failed: " + (err?.response?.data?.message || err.message));
            setSelectedOption(null); // Revert on failure
        }
    };

    const handleShare = () => {
        if (!id) return;
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // --- Loading State ---
    if (!poll) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
    );

    const totalVotes = poll.options.reduce(
        (sum: number, o: any) => sum + o.votes, 0
    );

    return (
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
            <div className="w-full max-w-xl">

                {/* Card Container */}
                <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">

                    {/* Header */}
                    <div className="bg-slate-50/50 p-8 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
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
                                        className={`relative w-full text-left group transition-all duration-300 outline-none
                    ${voted ? 'cursor-default' : 'hover:scale-[1.01] hover:shadow-md cursor-pointer'}
                    ${voted && isSelected ? 'ring-2 ring-indigo-500 scale-[1.02]' : ''}
                  `}
                                    >
                                        {/* Background Progress Bar (Only visible after voting) */}
                                        <div className="absolute inset-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out ${isSelected && voted ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20' : 'bg-slate-200/50'
                                                    }`}
                                                style={{ width: voted ? `${percent}%` : '0%' }}
                                            />
                                        </div>

                                        {/* Content Overlay */}
                                        <div className={`relative p-4 flex items-center gap-3 z-10 rounded-xl border transition-all
                     ${voted
                                                ? 'border-transparent'
                                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:ring-4 hover:ring-indigo-50'
                                            }
                     ${voted && isSelected ? 'bg-white/80' : ''}
                  `}>
                                            {/* Checkbox Circle UI */}
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                          ${isSelected && voted
                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                    : isSelected
                                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                                        : 'border-slate-300 group-hover:border-indigo-400'
                                                }
                       `}>
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            </div>

                                            <span className={`font-medium flex-1 ${isSelected && voted ? 'text-indigo-900 font-semibold' : isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {opt.text}
                                            </span>

                                            {/* Show "Your vote" badge if selected and voted */}
                                            {voted && isSelected && (
                                                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                                                    Your Vote
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Vote count and Percentage below option */}
                                    {voted && (
                                        <div className="pl-9 flex items-center justify-between gap-3 text-sm">
                                            <span className={`font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-600'}`}>
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
                            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
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