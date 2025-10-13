import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import {
  saveEntry,
  fetchEntryByDate,
  getAllEntries,
  searchEntries,
  getEntriesInRange,
} from "../../services/database";
import { generateEmbedding } from "../../services/embeddings";

const router = Router();

// All routes are protected
router.use(authenticate);

/**
 * POST /entries - Create new journal entry
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date, content } = req.body;

    if (!date || !content) {
      return res.status(400).json({
        error: "Date and content are required",
      });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: "Date must be in YYYY-MM-DD format",
      });
    }

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Save entry
    await saveEntry(userId, date, content, embedding);

    res.status(201).json({
      message: "Entry created successfully",
      entry: { date, content },
    });
  } catch (error: any) {
    console.error("[ENTRIES] Create error:", error);
    res.status(500).json({ error: error.message || "Failed to create entry" });
  }
});

/**
 * GET /entries/:date - Get entry by specific date
 */
router.get("/:date", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;

    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: "Date must be in YYYY-MM-DD format",
      });
    }

    const entry = await fetchEntryByDate(userId, date);

    if (!entry) {
      return res.status(404).json({
        error: "No entry found for this date",
      });
    }

    res.json({
      entry: {
        date,
        content: entry.content,
      },
    });
  } catch (error: any) {
    console.error("[ENTRIES] Fetch error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch entry" });
  }
});

/**
 * GET /entries - Get all entries (with pagination)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = "50", offset = "0" } = req.query;

    const entries = await getAllEntries(userId);

    // Simple pagination
    const start = parseInt(offset as string);
    const end = start + parseInt(limit as string);
    const paginatedEntries = entries.slice(start, end);

    res.json({
      entries: paginatedEntries.map((e) => ({
        id: e.id,
        date: e.date,
        content: e.content,
      })),
      total: entries.length,
      limit: parseInt(limit as string),
      offset: start,
    });
  } catch (error: any) {
    console.error("[ENTRIES] List error:", error);
    res.status(500).json({ error: error.message || "Failed to list entries" });
  }
});

/**
 * POST /entries/search - Semantic search
 */
router.post("/search", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Search entries
    const results = await searchEntries(
      userId,
      queryEmbedding,
      parseInt(limit as string)
    );

    res.json({
      results: results.map((r) => ({
        date: r.date,
        content: r.content,
        similarity: parseFloat(r.similarity.toFixed(3)),
      })),
      query,
      count: results.length,
    });
  } catch (error: any) {
    console.error("[ENTRIES] Search error:", error);
    res.status(500).json({ error: error.message || "Search failed" });
  }
});

/**
 * POST /entries/summary - Get summary for date range
 */
/**
 * POST /entries/summary - Get summary for date range
 */
router.post("/summary", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, topic } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Start date and end date are required",
      });
    }

    // Get entries in range
    const entries = await getEntriesInRange(userId, startDate, endDate);

    if (entries.length === 0) {
      return res.json({
        summary: "No entries found in this date range",
        entryCount: 0,
        dateRange: { startDate, endDate },
      });
    }

    // If topic filter specified, do semantic search
    // FIX: Explicitly type as simple objects without embedding
    let filteredEntries: Array<{ date: string; content: string }> = entries;

    if (topic) {
      const queryEmbedding = await generateEmbedding(topic);
      const searchResults = await searchEntries(
        userId,
        queryEmbedding,
        entries.length
      );

      filteredEntries = searchResults
        .filter((r) => r.similarity > 0.5)
        .map((r) => ({
          date: r.date,
          content: r.content,
        }));
    }

    if (filteredEntries.length === 0) {
      return res.json({
        summary: `No entries about "${topic}" found in this date range`,
        entryCount: 0,
        dateRange: { startDate, endDate },
        topic,
      });
    }

    // Format summary
    const summary = filteredEntries
      .map((e) => `${e.date}: ${e.content}`)
      .join("\n\n");

    res.json({
      summary,
      entryCount: filteredEntries.length,
      dateRange: { startDate, endDate },
      topic: topic || null,
      entries: filteredEntries.map((e) => ({
        date: e.date,
        preview: e.content.substring(0, 100) + "...",
      })),
    });
  } catch (error: any) {
    console.error("[ENTRIES] Summary error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate summary" });
  }
});

/**
 * DELETE /entries/:date - Delete entry
 */
router.delete("/:date", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;

    // Validate date parameter
    if (!date) {
      return res.status(400).json({
        error: "Date parameter is required",
      });
    }

    // Check if entry exists
    const entry = await fetchEntryByDate(userId, date);
    if (!entry) {
      return res.status(404).json({
        error: "No entry found for this date",
      });
    }

    // Delete from Supabase (using supabaseAdmin with user context)
    const { supabaseAdmin } = await import("../../services/supabase");
    const { error } = await supabaseAdmin
      .from("entries")
      .delete()
      .eq("user_id", userId)
      .eq("date", date);

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      message: "Entry deleted successfully",
      date,
    });
  } catch (error: any) {
    console.error("[ENTRIES] Delete error:", error);
    res.status(500).json({ error: error.message || "Failed to delete entry" });
  }
});

export default router;
