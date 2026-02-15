import { Schema, model, Document } from "mongoose";

interface IOption {
    text: string;
    votes: number;
}

export interface IPoll extends Document {
    question: string;
    options: IOption[];
    votedTokens: string[];
    votedClients: string[]; // Client ID-based fairness
    tokenVotes: Map<string, number>; // Maps token/clientId to optionIndex
}

const optionSchema = new Schema<IOption>({
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
});

const pollSchema = new Schema<IPoll>(
    {
        question: { type: String, required: true },
        options: [optionSchema],
        votedTokens: [String],  // Token-based fairness
        votedClients: [String], // Client ID-based fairness
        tokenVotes: {
            type: Map,
            of: Number,
            default: new Map()
        }  // Maps token/clientId to optionIndex
    },
    { timestamps: true }
);

export default model<IPoll>("Poll", pollSchema);
