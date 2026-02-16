import { Schema, model, Document } from "mongoose";

/**
 * Vote Model - Tracks individual votes by authenticated users
 * Each user (identified by Google OAuth userId) can vote once per poll
 */
export interface IVote extends Document {
    pollId: string;          // Store as string for simplicity
    userId: string;          // Google OAuth UID from Firebase Auth
    optionId: string;        // The option text or index they voted for
    userEmail?: string;      // Optional: store email for audit purposes
    votedAt: Date;
}

const voteSchema = new Schema<IVote>(
    {
        pollId: {
            type: String,
            required: true,
            index: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        optionId: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: false
        },
        votedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Compound index to ensure one vote per user per poll
voteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export default model<IVote>("Vote", voteSchema);
