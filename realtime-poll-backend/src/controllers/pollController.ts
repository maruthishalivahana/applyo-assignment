import { Response } from "express";
import { Server } from "socket.io";
import Poll, { IPoll } from "../models/poll";
import Vote from "../models/vote";
import { AuthRequest } from "../middleware/auth";
import crypto from "crypto";

/**
 * MULTI-LAYERED FAIRNESS SYSTEM
 * ==============================
 * 1. PRIMARY: Google OAuth (userId) - Most secure, cross-device
 * 2. SECONDARY: Vote Token (localStorage) - Persists across sessions
 * 3. TERTIARY: Client ID (browser fingerprint) - Additional tracking
 * 
 * Google Auth is required for voting, but token/clientId provide
 * additional protection against duplicate votes
 */
/**
 * Create a new poll
 * Note: Poll creation doesn't require authentication, but it's recommended
 */
export const createPoll = async (req: AuthRequest, res: Response) => {

    try {
        // request body data
        const { question, options } = req.body;

        // Validate question and options exist
        if (!question || !options || options.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Question and at least 2 options are required"
            })
        }

        // Validate question length
        if (question.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Question cannot be empty"
            })
        }

        if (question.length > 200) {
            return res.status(400).json({
                success: false,
                message: "Question must be less than 200 characters"
            })
        }

        // Validate options
        const trimmedOptions: string[] = options.map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0);

        if (trimmedOptions.length < 2) {
            return res.status(400).json({
                success: false,
                message: "At least 2 non-empty options are required"
            })
        }

        // Check for option length limits
        for (const option of trimmedOptions) {
            if (option.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Each option must be less than 100 characters"
                })
            }
        }

        // Check for duplicate options
        const uniqueOptions: string[] = [...new Set(trimmedOptions)];
        if (uniqueOptions.length !== trimmedOptions.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate options are not allowed"
            })
        }

        const poll = await Poll.create({
            question: question.trim(),
            options: uniqueOptions.map((text) => ({ text, votes: 0 })),
            createdBy: req.user?.uid  // Store creator if authenticated
        });
        res.status(201).json({
            success: true,
            message: "Poll created successfully",
            poll
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create poll",
            error: error instanceof Error ? error.message : "Unknown error"
        })

    }
}

/**
 * Get poll details
 * Checks all 3 fairness layers to determine if user voted
 */
export const getPoll = async (req: AuthRequest, res: Response) => {
    try {
        const poll = await Poll.findById(req.params.id)
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: "Poll not found"
            })
        }

        let userVotedOption: number | null = null;

        // LAYER 1 (PRIMARY): Check Google OAuth userId
        if (req.user?.uid) {
            const existingVote = await Vote.findOne({
                pollId: poll._id.toString(),
                userId: req.user.uid
            });

            if (existingVote) {
                // Find which option index they voted for
                const optionIndex = poll.options.findIndex(
                    opt => opt.text === existingVote.optionId
                );
                userVotedOption = optionIndex >= 0 ? optionIndex : null;
            }
        }

        // LAYER 2 (SECONDARY): Check vote token (fallback)
        if (userVotedOption === null) {
            const voteToken = req.headers["x-vote-token"] as string | undefined;
            if (voteToken && poll.tokenVotes) {
                userVotedOption = poll.tokenVotes.get(voteToken) ?? null;
            }
        }

        // LAYER 3 (TERTIARY): Check client ID (fallback)
        if (userVotedOption === null) {
            const clientId = req.headers["x-client-id"] as string | undefined;
            if (clientId && poll.tokenVotes) {
                userVotedOption = poll.tokenVotes.get(clientId) ?? null;
            }
        }

        res.status(200).json({
            success: true,
            message: "Poll retrieved successfully",
            poll,
            userVotedOption,
            isAuthenticated: !!req.user
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get poll",
            error: error instanceof Error ? error.message : "Unknown error"
        })
    }
}
/**
 * Vote on a poll
 * REQUIRES AUTHENTICATION + Multi-layered fairness checks
 * 1. Google OAuth (PRIMARY) - Required
 * 2. Vote Token (SECONDARY) - Additional check
 * 3. Client ID (TERTIARY) - Additional check
 */
export const votePoll = async (req: AuthRequest, res: Response) => {
    try {
        const { optionIndex } = req.body;
        const voteToken = req.headers["x-vote-token"] as string | undefined;
        const clientId = req.headers["x-client-id"] as string | undefined;

        // LAYER 1: Authentication is required
        if (!req.user?.uid) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in with Google to vote."
            });
        }

        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: "Poll not found"
            });
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid option index"
            });
        }

        // LAYER 1 (PRIMARY): Check Google OAuth userId
        const existingVote = await Vote.findOne({
            pollId: poll._id.toString(),
            userId: req.user.uid
        });

        if (existingVote) {
            return res.status(403).json({
                success: false,
                message: "You have already voted on this poll (Google Account)",
                alreadyVoted: true
            });
        }

        // LAYER 2 (SECONDARY): Check vote token
        if (voteToken && poll.votedTokens.includes(voteToken)) {
            return res.status(403).json({
                success: false,
                message: "You have already voted on this poll (Token)",
                alreadyVoted: true
            });
        }

        // LAYER 3 (TERTIARY): Check client ID
        if (clientId && poll.votedClients.includes(clientId)) {
            return res.status(403).json({
                success: false,
                message: "You have already voted on this poll (Client ID)",
                alreadyVoted: true
            });
        }

        // Record the vote in Vote collection
        const selectedOption = poll.options[optionIndex].text;

        await Vote.create({
            pollId: poll._id.toString(),
            userId: req.user.uid,
            optionId: selectedOption,
            userEmail: req.user.email,
            votedAt: new Date()
        });

        // Generate and store token
        const newToken = crypto.randomBytes(16).toString("hex");
        poll.votedTokens.push(newToken);

        // Store clientId if provided
        if (clientId) {
            poll.votedClients.push(clientId);
        }

        // Store which option was selected (for "Your Vote" badge persistence)
        if (!poll.tokenVotes) {
            poll.tokenVotes = new Map();
        }
        poll.tokenVotes.set(newToken, optionIndex);
        if (clientId) {
            poll.tokenVotes.set(clientId, optionIndex);
        }

        // Increment vote count on the poll
        poll.options[optionIndex].votes += 1;
        await poll.save();

        // Emit real-time update via Socket.IO
        const io = req.app.get("io") as Server;
        const pollId = poll._id.toString();
        console.log(`Emitting voteUpdate to room: ${pollId}`);

        try {
            const emitResult = io.to(pollId).emit("voteUpdate", poll);
            console.log(`Vote update emitted successfully. Room: ${pollId}, Clients in room: ${io.sockets.adapter.rooms.get(pollId)?.size || 0}`);
        } catch (socketError) {
            console.error("Failed to emit vote update via socket:", socketError);
        }

        return res.status(200).json({
            success: true,
            message: "Vote recorded successfully",
            poll,
            voteToken: newToken
        });

    } catch (error) {
        console.error("Vote error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to record vote",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
