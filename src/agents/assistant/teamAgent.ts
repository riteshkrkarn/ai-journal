import { AgentBuilder, createTool } from "@iqai/adk";
import { z } from "zod";
import * as dotenv from "dotenv";
import {
  saveTeamEntry,
  searchTeamEntries,
  getEntriesInRange,
} from "../../services/database";
import { generateEmbedding } from "../../services/embeddings";
import { createTeamGoal, getTeamGoals } from "../../services/goals";
import { isTeamMember, getTeamMembers } from "../../services/teams";

dotenv.config();

/**
 * Team-specific AI agent for collaborative journaling
 * @param userId - Current user's ID
 * @param teamId - Team ID for context
 */
export async function teamAgent(userId: string, teamId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Check if user is a team member first
  const isMember = await isTeamMember(userId, teamId);
  if (!isMember) {
    throw new Error("User is not a member of this team");
  }

  // Check if user is team lead
  const members = await getTeamMembers(teamId);
  const currentMember = members.find((m) => m.user_id === userId);
  const isLead = currentMember?.role === "lead";

  // ===== TEAM JOURNAL TOOLS =====

  /**
   * Save a team journal entry
   * @param date - The date in YYYY-MM-DD format
   * @param content - The journal entry content
   */
  const saveTeamJournalEntry = createTool({
    name: "saveTeamJournalEntry",
    description:
      "Save a journal entry to the team. Any team member can add entries.",
    schema: z.object({
      date: z.string().describe("The date in YYYY-MM-DD format"),
      content: z.string().describe("The journal entry content"),
    }),
    fn: async ({ date, content }: { date: string; content: string }) => {
      const embedding = await generateEmbedding(content);
      await saveTeamEntry(userId, teamId, date, content, embedding);
      return { result: "Team entry saved successfully!" };
    },
  });

  /**
   * Search team journal entries
   * @param query - The search query
   */
  const searchTeamJournalEntries = createTool({
    name: "searchTeamJournalEntries",
    description:
      "Search and fetch team journal entries by meaning or topic. Returns entries from ALL team members.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query to find relevant team journal entries"),
    }),
    fn: async ({ query }: { query: string }) => {
      const queryEmbedding = await generateEmbedding(query);
      const results = await searchTeamEntries(teamId, queryEmbedding, 5);

      if (results.length === 0) {
        return {
          entries: [],
          message: "No team entries found matching your query.",
        };
      }

      return {
        entries: results.map((r) => ({
          date: r.date,
          content: r.content,
          relevance: r.similarity.toFixed(2),
        })),
      };
    },
  });

  /**
   * Get team summary for a date range
   * @param startDate - Start date (optional, defaults to 7 days ago)
   * @param endDate - End date (optional, defaults to today)
   * @param topic - Optional topic filter
   */
  const getTeamSummary = createTool({
    name: "getTeamSummary",
    description:
      "Generate a summary of team journal entries within a date range. Optionally filter by topic.",
    schema: z.object({
      startDate: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format (optional)"),
      endDate: z
        .string()
        .optional()
        .describe("End date in YYYY-MM-DD format (optional)"),
      topic: z.string().optional().describe("Optional topic filter"),
    }),
    fn: async (args: any) => {
      const { startDate, endDate, topic } = args || {};
      const start: string = (startDate ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0])!;
      const end: string = (endDate || today)!;

      // For team entries, we need to get all entries from the team
      const queryEmbedding = await generateEmbedding(
        topic || "team activities"
      );
      const entries = await searchTeamEntries(teamId, queryEmbedding, 50);

      // Filter by date range
      const filteredEntries = entries.filter((e) => {
        return e.date >= start && e.date <= end;
      });

      if (filteredEntries.length === 0) {
        return "No team entries found in this date range.";
      }

      const entriesText = filteredEntries
        .map((e) => `[${e.date}] ${e.content}`)
        .join("\n\n");

      return `${entriesText}\n\n---\nNow write a thoughtful summary (2-3 paragraphs) highlighting key team activities, progress, and insights.`;
    },
  });

  // ===== TEAM GOAL TOOLS =====

  /**
   * Set a goal for the team (Lead only)
   * @param title - Goal title
   * @param description - Goal description
   * @param deadline - Goal deadline in YYYY-MM-DD format
   */
  const setTeamGoal = createTool({
    name: "setTeamGoal",
    description:
      "Create a goal for the team. ONLY the team lead can set goals. Everyone can view goals.",
    schema: z.object({
      title: z.string().describe("The goal title"),
      description: z.string().describe("The goal description"),
      deadline: z.string().describe("The deadline in YYYY-MM-DD format"),
    }),
    fn: async ({
      title,
      description,
      deadline,
    }: {
      title: string;
      description: string;
      deadline: string;
    }) => {
      // Check if user is lead
      if (!isLead) {
        return {
          error:
            "You are not the team lead. Only the lead can set team goals.",
        };
      }

      const goal = await createTeamGoal(
        userId,
        teamId,
        title,
        description,
        deadline
      );
      return {
        result: `Team goal created: ${goal.title}`,
        goalId: goal.id,
      };
    },
  });

  /**
   * List all team goals
   */
  const listTeamGoals = createTool({
    name: "listTeamGoals",
    description:
      "List all team goals. Everyone can view goals, but only the lead can create them.",
    fn: async () => {
      const goals = await getTeamGoals(teamId);

      if (goals.length === 0) {
        return { goals: [], message: "No team goals found." };
      }

      return {
        goals: goals.map((g: any) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          deadline: g.deadline,
          completed: g.completed,
        })),
      };
    },
  });

  return await AgentBuilder.create("team_agent")
    .withModel("gemini-2.0-flash-exp")
    .withInstruction(
      `You are a team collaboration assistant. Today is ${today}.

**YOUR ROLE:** Help team members collaborate through journaling, goal tracking, and insights.

**AVAILABLE TOOLS:**
- Journal: saveTeamJournalEntry, searchTeamJournalEntries, getTeamSummary
- Goals: setTeamGoal (lead only), listTeamGoals (everyone)

**PERMISSIONS:**
- ANY team member can: Add journal entries, search entries, get summaries, view goals
- ONLY the team lead can: Create team goals

**TEAM CONTEXT:**
- User is ${isLead ? "the TEAM LEAD" : "a team member"}
- All journal entries are shared with the entire team
- When searching or summarizing, you're working with ALL team members' entries

**IMPORTANT RULES:**
1. If a non-lead user tries to set a goal, the tool will return an error. Display it clearly.
2. When showing journal entries, they come from various team members (we don't track who wrote what in MVP)
3. Be encouraging about team collaboration
4. When summarizing, focus on team progress and collective insights

**EXAMPLE INTERACTIONS:**

User: "Save journal: We completed the authentication module today"
→ Use saveTeamJournalEntry

User: "What did we work on this week?"
→ Use searchTeamJournalEntries with query "work this week"

User: "Summarize our progress on the project"
→ Use getTeamSummary with topic "project progress"

User: "Set a goal to launch by Dec 31"
→ Use setTeamGoal (will fail if not lead)

User: "What are our team goals?"
→ Use listTeamGoals

Be helpful, collaborative, and focus on team success!`
    )
    .withTools(
      saveTeamJournalEntry,
      searchTeamJournalEntries,
      getTeamSummary,
      setTeamGoal,
      listTeamGoals
    )
    .build();
}
