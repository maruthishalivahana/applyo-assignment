import { Router } from "express";
import { createPoll, getPoll, votePoll } from "../controllers/pollController";

const router = Router();
//create a poll
router.post("/", createPoll);
//get poll details
router.get("/:id", getPoll);
//vote on a poll
router.post("/:id/vote", votePoll);

export default router;
