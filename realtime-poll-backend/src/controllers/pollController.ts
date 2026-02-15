import { Request, Response } from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Poll, { IPoll } from "../models/poll";
import crypto from "crypto";



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
        let userVotedOption: number | null = null;

        // Check both token and clientId for vote tracking
        if (voteToken && poll.tokenVotes) {
            userVotedOption = poll.tokenVotes.get(voteToken) ?? null;
        }
        if (!userVotedOption && clientId && poll.tokenVotes) {
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

        // Fairness 1: Token method
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

        // Store which option was selected (for "Your Vote" badge persistence)
        if (!poll.tokenVotes) {
            poll.tokenVotes = new Map();
        }
        // Store both token and clientId mappings
        poll.tokenVotes.set(newToken, optionIndex);
        if (clientId) {
            poll.tokenVotes.set(clientId, optionIndex);
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
        return res.status(500).json({
            success: false,
            message: "Failed to vote",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
