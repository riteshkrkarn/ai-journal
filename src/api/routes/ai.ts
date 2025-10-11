import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { journalAgent } from "../../agents/assistant/journalAgent";

const router = Router();

/**
 * POST /ai/chat - Natural language interface
 * Handles ANY user request - agent decides which tool to call
 */
router.post("/chat", authenticate, async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const userId = req.user!.id;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`[AI] User ${userId}: ${message}`);

    const { runner } = await journalAgent(userId);
    const response = await runner.ask(message);

    console.log(`[AI] Response: ${response.substring(0, 100)}...`);

    res.json({
      message: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[AI] Error:", error);
    res.status(500).json({ error: error.message || "AI request failed" });
  }
});

export default router;
