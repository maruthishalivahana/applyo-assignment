import { Router } from "express";
import { createPoll, getPoll, votePoll } from "../controllers/pollController";
import { verifyAuthToken, optionalAuth } from "../middleware/auth";

const router = Router();

/**
 * Poll Routes with Authentication
 * - POST / - Create poll (optional auth - can track creator if logged in)
 * - GET /:id - Get poll details (optional auth - shows vote status if logged in)
 * - POST /:id/vote - Vote on poll (REQUIRES auth - must be logged in with Google)
 */

// Create a poll (optional auth - tracks creator if logged in)
router.post("/", optionalAuth, createPoll);

// Get poll details (optional auth - shows user's vote if logged in)
router.get("/:id", optionalAuth, getPoll);

// Vote on a poll (REQUIRES authentication)
router.post("/:id/vote", verifyAuthToken, votePoll);

export default router;
