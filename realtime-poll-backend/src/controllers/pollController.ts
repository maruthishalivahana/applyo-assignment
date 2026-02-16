import { Request, Response } from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Poll, { IPoll } from "../models/poll";
import crypto from "crypto";

/**
 * Multi-layered vote fairness system:
 * 1. IP Address (Primary) - Prevents voting from same network across different browsers
 * 2. Vote Token (Secondary) - Persists vote status in localStorage
 * 3. Client ID (Tertiary) - Browser fingerprint for additional tracking
 */

/**
 * Extract client IP address from request headers
 * Handles proxy headers from deployment platforms like Render, Heroku, etc.
 */
function getClientIP(req: Request): string {
    // Try x-forwarded-for first (most common for proxies)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ip = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
        if (ip && ip !== '::1' && ip !== '127.0.0.1') {
            return ip;
        }
    }

    // Try x-real-ip header
    const realIp = req.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string') {
        if (realIp !== '::1' && realIp !== '127.0.0.1') {
            return realIp;
        }
    }

    // Fall back to socket address
    const socketIp = req.socket.remoteAddress || '';
    if (socketIp && socketIp !== '::1' && socketIp !== '127.0.0.1') {
        return socketIp;
    }

    // In development, return localhost identifier
    return 'localhost';
}



export const createPoll = async (req: Request, res: Response) => {

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
            options: uniqueOptions.map((text) => ({ text, votes: 0 }))
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


export const getPoll = async (req: Request, res: Response) => {
    try {
        const poll = await Poll.findById(req.params.id)
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: "Poll not found"
            })
        }

        // Check if user has already voted and get their choice
        const voteToken = req.headers["x-vote-token"] as string | undefined;
        const clientId = req.headers["x-client-id"] as string | undefined;

        // Get client IP address
        const clientIP = getClientIP(req);

        let userVotedOption: number | null = null;

        // Check IP first (primary method), then token, then clientId
        if (clientIP && poll.tokenVotes) {
            userVotedOption = poll.tokenVotes.get(clientIP) ?? null;
        }
        if (userVotedOption === null && voteToken && poll.tokenVotes) {
            userVotedOption = poll.tokenVotes.get(voteToken) ?? null;
        }
        if (userVotedOption === null && clientId && poll.tokenVotes) {
            userVotedOption = poll.tokenVotes.get(clientId) ?? null;
        }

        res.status(200).json({
            success: true,
            message: "Poll retrieved successfully",
            poll,
            userVotedOption
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get poll",
            error: error instanceof Error ? error.message : "Unknown error"
        })
    }
}
export const votePoll = async (req: Request, res: Response) => {
    try {
        const { optionIndex } = req.body;

        const voteToken = req.headers["x-vote-token"] as string | undefined;
        const clientId = req.headers["x-client-id"] as string | undefined;

        // Get client IP address (primary fairness mechanism)
        const clientIP = getClientIP(req);
        console.log('Vote attempt from IP:', clientIP);

        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: "Poll not found"
            });
        }

        // Initialize votedIPs if it doesn't exist (for backward compatibility with old polls)
        if (!poll.votedIPs) {
            poll.votedIPs = [];
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid option index"
            });
        }

        // PRIMARY FAIRNESS CHECK: IP-based
        if (clientIP && clientIP !== 'localhost' && poll.votedIPs.includes(clientIP)) {
            console.log('Duplicate vote blocked for IP:', clientIP);
            return res.status(403).json({
                success: false,
                message: "Already voted from this network"
            });
        }

        // Fairness 1: Token method (secondary check)
        if (voteToken && poll.votedTokens.includes(voteToken)) {
            return res.status(403).json({
                success: false,
                message: "Already voted (Token)"
            });
        }

        // Fairness 2: Client ID method
        if (clientId && poll.votedClients.includes(clientId)) {
            return res.status(403).json({
                success: false,
                message: "Already voted (Client)"
            });
        }

        // Record vote
        poll.options[optionIndex].votes += 1;

        // Generate and store token
        const newToken = crypto.randomBytes(16).toString("hex");
        poll.votedTokens.push(newToken);

        // Store clientId if provided
        if (clientId) {
            poll.votedClients.push(clientId);
        }

        // Store IP address (primary fairness mechanism)
        // Don't store localhost to allow development testing
        if (clientIP && clientIP !== 'localhost') {
            poll.votedIPs.push(clientIP);
        }

        // Store which option was selected (for "Your Vote" badge persistence)
        if (!poll.tokenVotes) {
            poll.tokenVotes = new Map();
        }
        // Store mappings for token, clientId, and IP
        poll.tokenVotes.set(newToken, optionIndex);
        if (clientId) {
            poll.tokenVotes.set(clientId, optionIndex);
        }
        if (clientIP && clientIP !== 'localhost') {
            poll.tokenVotes.set(clientIP, optionIndex);
        }

        await poll.save();

        const io = req.app.get("io") as Server;
        try {
            io.to(poll._id.toString()).emit("voteUpdate", poll);
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
            message: "Failed to vote",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
