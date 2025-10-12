import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import {
  createTeam,
  addTeamMember,
  getUserTeams,
  getTeamMembers,
  leaveTeam,
} from "../../services/teams";
import { supabaseAdmin } from "../../services/supabase";

const router = Router();

// All routes are protected
router.use(authenticate);

/**
 * POST /teams - Create new team
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Team name is required" });
    }

    const team = await createTeam(userId, name);

    // Add creator as first member
    await addTeamMember(team.id, userId);

    res.status(201).json({
      message: "Team created successfully",
      team,
    });
  } catch (error: any) {
    console.error("[TEAMS] Create error:", error);
    res.status(500).json({ error: error.message || "Failed to create team" });
  }
});

/**
 * GET /teams - Get user's teams
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const teams = await getUserTeams(userId);

    res.json({
      teams,
      count: teams.length,
    });
  } catch (error: any) {
    console.error("[TEAMS] List error:", error);
    res.status(500).json({ error: error.message || "Failed to list teams" });
  }
});

/**
 * GET /teams/:id/members - Get team members
 */
router.get("/:id/members", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Team ID is required" });
    }

    const members = await getTeamMembers(id);

    res.json({
      teamId: id,
      members,
      count: members.length,
    });
  } catch (error: any) {
    console.error("[TEAMS] Members error:", error);
    res.status(500).json({ error: error.message || "Failed to get members" });
  }
});

/**
 * POST /teams/:id/join - Join team by ID
 */
router.post("/:id/join", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Team ID is required" });
    }

    // Check if team exists
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    await addTeamMember(id, userId);

    res.json({
      message: "Joined team successfully",
      team,
    });
  } catch (error: any) {
    console.error("[TEAMS] Join error:", error);
    res.status(500).json({ error: error.message || "Failed to join team" });
  }
});

/**
 * POST /teams/:id/leave - Leave team
 */
router.post("/:id/leave", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Team ID is required" });
    }

    await leaveTeam(userId, id);

    res.json({
      message: "Left team successfully",
    });
  } catch (error: any) {
    console.error("[TEAMS] Leave error:", error);
    res.status(500).json({ error: error.message || "Failed to leave team" });
  }
});

export default router;
