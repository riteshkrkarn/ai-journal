import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import {
  createGoal,
  getAllGoals,
  getGoalById,
  updateGoalStatus,
  deleteGoal,
} from "../../services/goals";
import { generateEmbedding } from "../../services/embeddings";
import { searchEntries } from "../../services/database";

const router = Router();

// All routes are protected
router.use(authenticate);

/**
 * POST /goals - Create new goal
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, deadline } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const goal = await createGoal(userId, title, description || "", deadline);

    res.status(201).json({
      message: "Goal created successfully",
      goal: {
        id: goal.id,
        title: goal.title,
      },
    });
  } catch (error: any) {
    console.error("[GOALS] Create error:", error);
    res.status(500).json({ error: error.message || "Failed to create goal" });
  }
});

/**
 * GET /goals - List all goals
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const goals = await getAllGoals(userId);

    res.json({
      goals: goals.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        deadline: g.deadline,
        completed: g.completed,
        createdAt: g.created_at,
      })),
      total: goals.length,
      completed: goals.filter((g) => g.completed).length,
      active: goals.filter((g) => !g.completed).length,
    });
  } catch (error: any) {
    console.error("[GOALS] List error:", error);
    res.status(500).json({ error: error.message || "Failed to list goals" });
  }
});

/**
 * GET /goals/:id - Get single goal
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Goal ID is required" });
    }

    const goal = await getGoalById(userId, id);

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json({ goal });
  } catch (error: any) {
    console.error("[GOALS] Fetch error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch goal" });
  }
});

/**
 * POST /goals/:id/progress - Check AI-powered progress
 */
router.post("/:id/progress", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Goal ID is required" });
    }

    const goal = await getGoalById(userId, id);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Use semantic search to find related entries
    const goalText = `${goal.title} ${goal.description}`;
    const queryEmbedding = await generateEmbedding(goalText);
    const relatedEntries = await searchEntries(userId, queryEmbedding, 10);

    const relevantEntries = relatedEntries.filter((e) => e.similarity > 0.6);

    res.json({
      goal: {
        id: goal.id,
        title: goal.title,
        completed: goal.completed,
        deadline: goal.deadline,
      },
      progress: {
        mentionCount: relevantEntries.length,
        recentMentions: relevantEntries.slice(0, 3).map((e) => ({
          date: e.date,
          preview: e.content.substring(0, 100) + "...",
          relevance: parseFloat(e.similarity.toFixed(2)),
        })),
      },
    });
  } catch (error: any) {
    console.error("[GOALS] Progress error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to check progress" });
  }
});

/**
 * PUT /goals/:id/complete - Mark complete/incomplete
 */
router.put("/:id/complete", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { completed } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Goal ID is required" });
    }

    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed must be boolean" });
    }

    await updateGoalStatus(userId, id, completed);

    res.json({
      message: completed
        ? "Goal marked as completed"
        : "Goal marked as incomplete",
    });
  } catch (error: any) {
    console.error("[GOALS] Complete error:", error);
    res.status(500).json({ error: error.message || "Failed to update goal" });
  }
});

/**
 * DELETE /goals/:id - Delete goal
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Goal ID is required" });
    }

    const goal = await getGoalById(userId, id);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await deleteGoal(userId, id);

    res.json({ message: "Goal deleted successfully" });
  } catch (error: any) {
    console.error("[GOALS] Delete error:", error);
    res.status(500).json({ error: error.message || "Failed to delete goal" });
  }
});

export default router;
