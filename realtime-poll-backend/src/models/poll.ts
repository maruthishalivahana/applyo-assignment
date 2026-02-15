import { Schema, model, Document } from "mongoose";

interface IOption {
    text: string;
    votes: number;
}

export interface IPoll extends Document {
    question: string;
    options: IOption[];
    votedIPs: string[];
    votedTokens: string[];
    tokenVotes: Map<string, number>; // Maps token to optionIndex
}

const optionSchema = new Schema<IOption>({
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
});

const pollSchema = new Schema<IPoll>(
    {
        question: { type: String, required: true },
        options: [optionSchema],
        votedIPs: [String],
        votedTokens: [String],  // second method to prevent multiple votes, can be used with  tokens
        tokenVotes: {
            type: Map,
            of: Number,
            default: new Map()
        }  // Maps token to optionIndex
    },
    { timestamps: true }
);

export default model<IPoll>("Poll", pollSchema);
