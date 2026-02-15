import { Request, Response } from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Poll, { IPoll } from "../models/poll";
import crypto from "crypto";



export const createPoll = async (req: Request, res: Response) => {

    try {
        // request body data
        const { question, options } = req.body;
        // create poll document
        if (!question || !options || options.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Question and at least 2 options are required"
            })
        }
        const poll = await Poll.create({
            question,
            options: options.map((text: string) => ({ text, votes: 0 })),
            // votedIPs: []

        })
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
        res.status(200).json({
            success: true,
            message: "Poll retrieved successfully",
            poll
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

        const ip = req.ip || "unknown";
        const voteToken = req.headers["x-vote-token"] as string | undefined;

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

        // fairness 1: IP method
        // if (poll.votedIPs.includes(ip)) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Already voted (IP)"
        //     });
        // }

        //  fairness 2: Token method
        if (voteToken && poll.votedTokens.includes(voteToken)) {
            return res.status(403).json({
                success: false,
                message: "Already voted (Token)"
            });
        }

        //  vote
        poll.options[optionIndex].votes += 1;
        // poll.votedIPs.push(ip);

        // generate token
        const newToken = crypto.randomBytes(16).toString("hex");
        poll.votedTokens.push(newToken);

        await poll.save();

        const io = req.app.get("io") as Server;
        console.log(`Emitting voteUpdate to room: ${poll._id.toString()}`);
        io.to(poll._id.toString()).emit("voteUpdate", poll);
        console.log(`Vote update emitted for poll: ${poll._id.toString()}`);

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

