import { Schema, model, Document } from "mongoose";

/**
 * Updated Poll Model with Multi-Layered Fairness
 * 
 * FAIRNESS MECHANISMS (3 Layers):
 * 1. PRIMARY: Google OAuth userId (tracked in Vote collection)
 * 2. SECONDARY: Vote Token (localStorage fallback)  
 * 3. TERTIARY: Client ID (browser fingerprint fallback)
 * 
 * Auth-based voting is primary, but token/clientId provide additional protection
 * and allow basic voting for users who don't sign in (if you choose to allow it)
 */
interface IOption {
    text: string;
    votes: number;
}

export interface IPoll extends Document {
    question: string;
    options: IOption[];
    createdBy?: string;  // Optional: userId of poll creator
    votedTokens: string[];  // Secondary fairness: localStorage tokens
    votedClients: string[];  // Tertiary fairness: browser fingerprints
    tokenVotes: Map<string, number>;  // Maps token/clientId to optionIndex for "Your Vote" badge
}

const optionSchema = new Schema<IOption>({
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
});

const pollSchema = new Schema<IPoll>(
    {
        question: { type: String, required: true },
        options: [optionSchema],
        createdBy: { type: String, required: false },  // Store creator's Google UID
        votedTokens: [String],  // Token-based fairness (secondary)
        votedClients: [String],  // Client ID-based fairness (tertiary)
        tokenVotes: {
            type: Map,
            of: Number,
            default: new Map()
        }  // Maps token/clientId to optionIndex
    },
    { timestamps: true }
);

export default model<IPoll>("Poll", pollSchema);
