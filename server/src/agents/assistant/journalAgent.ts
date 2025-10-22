import { AgentBuilder, FunctionTool, createTool } from "@iqai/adk";
import { z } from "zod";
import * as dotenv from "dotenv";
import {
  saveEntry,
  fetchEntryByDate,
  searchEntries,
  getEntriesInRange,
  saveTeamEntry,
  searchTeamEntries,
} from "../../services/database";
import { generateEmbedding } from "../../services/embeddings";
import {
  createGoal,
  getAllGoals,
  getGoalById,
  updateGoalStatus,
  createTeamGoal,
  getTeamGoals,
} from "../../services/goals";
import { isTeamMember, getUserTeams } from "../../services/teams";
import {
  createCalendarEvent,
  listUpcomingEvents,
  parseDateTime,
} from "../../services/calendar";
import { hasCalendarAccess } from "../../services/oauth";

dotenv.config();

export async function journalAgent(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  // ===== JOURNAL TOOLS =====

  /**
   * Save a journal entry for a specific date
   * @param date - The date in YYYY-MM-DD format
   * @param content - The journal entry content
   */
  const saveJournalEntry = createTool({
    name: "saveJournalEntry",
    description: "Add a new journal entry for a specific date.",
    schema: z.object({
      date: z.string().describe("The date in YYYY-MM-DD format"),
      content: z.string().describe("The journal entry content"),
    }),
    fn: async ({ date, content }: { date: string; content: string }) => {
      const embedding = await generateEmbedding(content);
      const result = await saveEntry(userId, date, content, embedding);
      return { result };
    },
  });

  /**
   * Fetch a journal entry for a specific date
   * @param date - The date in YYYY-MM-DD format
   */
  const fetchJournalEntry = createTool({
    name: "fetchJournalEntry",
    description: "Read all your journal entries for a specific date.",
    schema: z.object({
      date: z.string().describe("The date in YYYY-MM-DD format"),
    }),
    fn: async ({ date }: { date: string }) => {
      const entries = await fetchEntryByDate(userId, date);
      if (!entries || entries.length === 0) {
        return { content: `No journal entries found for this date.` };
      }
      if (entries.length === 1) {
        return { content: entries[0]?.content || "" };
      }
      // Multiple entries: return all as a list
      return {
        content: entries.map((e, i) => `${i + 1}. ${e.content}`).join("\n"),
      };
    },
  });

  /**
   * Search journal entries by semantic meaning
   * @param query - The search query
   */
  const searchJournalEntries = createTool({
    name: "searchJournalEntries",
    description:
      "Search and fetch journal entries by meaning or topic. Use this when user wants to SEE/READ/GET their entries (e.g., 'show me', 'give me', 'fetch my', 'what are my'). Returns the actual entry content.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query to find relevant journal entries"),
    }),
    fn: async ({ query }: { query: string }) => {
      // Query expansion: if user asks about 'coding', include related terms
      const normalized = query.toLowerCase();
      const expansions: string[] = [query];
      if (
        /(coding|programming|code|dev|developer|software)/i.test(normalized)
      ) {
        expansions.push(
          "programming",
          "coding",
          "software development",
          "DSA",
          "data structures",
          "algorithms",
          "leetcode",
          "hackathon",
          "project",
          "Java",
          "Python",
          "TypeScript",
          "JavaScript"
        );
      }

      // Generate embeddings and aggregate search results
      const allResults: {
        date: string;
        content: string;
        similarity: number;
      }[] = [];
      for (const term of expansions) {
        const emb = await generateEmbedding(term);
        const res = await searchEntries(userId, emb, 100);
        allResults.push(...res);
      }

      // Deduplicate by date+content pair keeping highest similarity
      const dedupMap = new Map<
        string,
        { date: string; content: string; similarity: number }
      >();
      for (const r of allResults) {
        const key = `${r.date}|${r.content}`;
        const existing = dedupMap.get(key);
        if (!existing || r.similarity > existing.similarity) {
          dedupMap.set(key, r);
        }
      }
      let deduped = Array.from(dedupMap.values()).sort(
        (a, b) => b.similarity - a.similarity
      );

      // Progressive filtering: try 0.6, then 0.5, then 0.4 until we have at least 3, max 10
      const thresholds = [0.6, 0.5, 0.4];
      let filtered: typeof deduped = [];
      for (const t of thresholds) {
        filtered = deduped.filter((r) => r.similarity >= t);
        if (filtered.length >= 3) break;
      }
      if (filtered.length === 0) {
        return "No journal entries found matching your search.";
      }
      filtered = filtered.slice(0, 10);

      const formattedResults = filtered
        .map(
          (r, i) =>
            `${i + 1}. Date: ${r.date}\nContent: ${
              r.content
            }\nRelevance: ${r.similarity.toFixed(2)}`
        )
        .join("\n\n");

      return `Found ${filtered.length} matching entries:\n\n${formattedResults}`;
    },
  });

  /**
   * Get a summary of journal entries for a date range
   * @param startDate - Start date (optional, defaults to 7 days ago)
   * @param endDate - End date (optional, defaults to today)
   * @param topic - Optional topic to filter entries
   */
  const getSummary = createTool({
    name: "getSummary",
    description:
      "Fetch journal entries for a date range to create an AI-generated summary/analysis. Use this ONLY when user explicitly asks for a SUMMARY or ANALYSIS (e.g., 'summarize', 'analyze', 'tell me about'). DO NOT use this if user wants to see/read/get the actual entries. Defaults to last 7 days if no dates provided. You MUST analyze the returned entries and write a thoughtful 2-3 paragraph summary.",
    fn: async (args: any) => {
      const { startDate, endDate, topic } = args || {};
      const start: string = (startDate ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0])!;
      const end: string = (endDate || today)!;

      const entries = await getEntriesInRange(userId, start, end);

      if (entries.length === 0) {
        return "No entries found in this date range.";
      }

      let filteredEntries: Array<{ date: string; content: string }> = entries;
      if (topic) {
        const queryEmbedding = await generateEmbedding(topic);
        const searchResults = await searchEntries(
          userId,
          queryEmbedding,
          entries.length
        );

        filteredEntries = searchResults
          .filter((r) => r.similarity >= 0.5)
          .map((r) => ({ date: r.date, content: r.content }));
      }

      if (filteredEntries.length === 0) {
        return `No entries about "${topic}" found in this date range.`;
      }

      const entriesText = filteredEntries
        .map((e) => `**${e.date}:** ${e.content}`)
        .join("\n\n");

      // Return the entries for the AI to summarize
      return `Found ${filteredEntries.length} entries from ${start} to ${end}${
        topic ? ` about "${topic}"` : ""
      }:\n\n${entriesText}\n\n---\nNow write a thoughtful 2-3 paragraph summary analyzing these entries. Identify key themes, patterns, activities, and accomplishments. Make it conversational and insightful.`;
    },
  });

  // ===== GOAL TOOLS =====

  /**
   * Create a new goal
   * @param title - Goal title
   * @param description - Goal description
   * @param deadline - Goal deadline date
   */
  const setGoal = createTool({
    name: "setGoal",
    description: "Create a new goal with title, description, and deadline.",
    schema: z.object({
      title: z.string().describe("The goal title"),
      description: z.string().describe("The goal description"),
      deadline: z.string().describe("The deadline date in YYYY-MM-DD format"),
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
      const goal = await createGoal(userId, title, description, deadline);
      return {
        result: `Goal created: "${goal.title}". You can check it in the Goals page.`,
        goalId: goal.id,
      };
    },
  });

  /**
   * List all goals for the user
   */
  const listGoals = createTool({
    name: "listGoals",
    description: "Show all goals.",
    fn: async () => {
      const goals = await getAllGoals(userId);

      if (goals.length === 0) {
        return { goals: "No goals found." };
      }

      return {
        goals: goals.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          deadline: g.deadline,
          completed: g.completed,
        })),
        totalGoals: goals.length,
      };
    },
  });

  /**
   * Check progress on a specific goal
   * @param goalId - The goal ID
   */
  const checkGoalProgress = createTool({
    name: "checkGoalProgress",
    description: "Check progress on a specific goal.",
    schema: z.object({
      goalId: z.string().describe("The goal ID"),
    }),
    fn: async ({ goalId }: { goalId: string }) => {
      const goal = await getGoalById(userId, goalId);

      if (!goal) {
        return { error: "Goal not found." };
      }

      const goalText = `${goal.title} ${goal.description}`;
      const queryEmbedding = await generateEmbedding(goalText);
      const relatedEntries = await searchEntries(userId, queryEmbedding, 10);

      const relevantEntries = relatedEntries.filter((e) => e.similarity > 0.6);

      return {
        goal: goal.title,
        mentionCount: relevantEntries.length,
        summary:
          relevantEntries.length > 0
            ? `You've mentioned this goal in ${relevantEntries.length} entries.`
            : "No mentions yet.",
      };
    },
  });

  /**
   * Update goal status
   * @param goalId - The goal ID
   * @param completed - Whether the goal is completed
   */
  const updateGoalStatusTool = createTool({
    name: "updateGoalStatus",
    description: "Mark a goal as completed or incomplete.",
    schema: z.object({
      goalId: z.string().describe("The goal ID"),
      completed: z.boolean().describe("Whether the goal is completed"),
    }),
    fn: async ({
      goalId,
      completed,
    }: {
      goalId: string;
      completed: boolean;
    }) => {
      await updateGoalStatus(userId, goalId, completed);
      return {
        result: completed ? "Goal completed!" : "Goal marked incomplete.",
      };
    },
  });

  // ===== TEAM TOOLS =====

  /**
   * List all teams the user is in
   */
  const listUserTeams = createTool({
    name: "listUserTeams",
    description: "List all teams the user is in.",
    fn: async () => {
      const teams = await getUserTeams(userId);

      if (teams.length === 0) {
        return { teams: "You are not part of any teams yet." };
      }

      return {
        teams: teams.map((t: any) => ({
          id: t.id,
          name: t.name,
        })),
        count: teams.length,
      };
    },
  });

  /**
   * Save a journal entry to a team
   * @param teamId - The team ID
   * @param date - The date in YYYY-MM-DD format
   * @param content - The journal entry content
   */
  const saveTeamEntryTool = createTool({
    name: "saveTeamEntry",
    description:
      "Save a journal entry to a team. Requires teamId, date, content.",
    schema: z.object({
      teamId: z.string().describe("The team ID"),
      date: z.string().describe("The date in YYYY-MM-DD format"),
      content: z.string().describe("The journal entry content"),
    }),
    fn: async ({
      teamId,
      date,
      content,
    }: {
      teamId: string;
      date: string;
      content: string;
    }) => {
      const isMember = await isTeamMember(userId, teamId);
      if (!isMember) {
        return { error: "Not a team member" };
      }

      const embedding = await generateEmbedding(content);
      await saveTeamEntry(userId, teamId, date, content, embedding);
      return { result: "Team entry saved!" };
    },
  });

  /**
   * Search team journal entries
   * @param teamId - The team ID
   * @param query - The search query
   */
  const searchTeamEntriesTool = createTool({
    name: "searchTeamEntries",
    description: "Search team journal entries. Requires teamId and query.",
    schema: z.object({
      teamId: z.string().describe("The team ID"),
      query: z.string().describe("The search query"),
    }),
    fn: async ({ teamId, query }: { teamId: string; query: string }) => {
      const isMember = await isTeamMember(userId, teamId);
      if (!isMember) {
        return { error: "Not a team member" };
      }

      const queryEmbedding = await generateEmbedding(query);
      const results = await searchTeamEntries(teamId, queryEmbedding, 3);

      if (results.length === 0) {
        return { entries: "No team entries found." };
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
   * Create a goal for a team
   * @param teamId - The team ID
   * @param title - Goal title
   * @param description - Goal description
   * @param deadline - Goal deadline
   */
  const setTeamGoal = createTool({
    name: "setTeamGoal",
    description:
      "Create a goal for a team. Requires teamId, title, description, deadline.",
    schema: z.object({
      teamId: z.string().describe("The team ID"),
      title: z.string().describe("The goal title"),
      description: z.string().describe("The goal description"),
      deadline: z.string().describe("The deadline date in YYYY-MM-DD format"),
    }),
    fn: async ({
      teamId,
      title,
      description,
      deadline,
    }: {
      teamId: string;
      title: string;
      description: string;
      deadline: string;
    }) => {
      const isMember = await isTeamMember(userId, teamId);
      if (!isMember) {
        return { error: "Not a team member" };
      }

      const goal = await createTeamGoal(
        userId,
        teamId,
        title,
        description,
        deadline
      );
      return {
        result: `Team goal created: "${goal.title}"`,
        goalId: goal.id,
      };
    },
  });

  /**
   * List all team goals
   * @param teamId - The team ID
   */
  const listTeamGoals = createTool({
    name: "listTeamGoals",
    description: "List all team goals. Requires teamId.",
    schema: z.object({
      teamId: z.string().describe("The team ID"),
    }),
    fn: async ({ teamId }: { teamId: string }) => {
      const isMember = await isTeamMember(userId, teamId);
      if (!isMember) {
        return { error: "Not a team member" };
      }

      const goals = await getTeamGoals(teamId);

      if (goals.length === 0) {
        return { goals: "No team goals found." };
      }

      return {
        goals: goals.map((g: any) => ({
          id: g.id,
          title: g.title,
          deadline: g.deadline,
          completed: g.completed,
        })),
      };
    },
  });

  // ===== CALENDAR TOOLS =====

  /**
   * Add event to Google Calendar
   * @param title - Event title
   * @param dateStr - Date string
   * @param timeStr - Time string
   * @param description - Optional description
   */
  const addToCalendar = createTool({
    name: "addToCalendar",
    description:
      "Add event to Google Calendar. Args: title, dateStr, timeStr, description (optional).",
    fn: async (args: any) => {
      const { title, dateStr, timeStr, description } = args;

      const hasAccess = await hasCalendarAccess(userId);
      if (!hasAccess) {
        return {
          error: "Please connect Google Calendar first at /calendar/connect",
        };
      }

      const { start, end } = parseDateTime(dateStr, timeStr);

      const eventData: any = {
        title,
        startTime: start,
        endTime: end,
      };

      if (description) {
        eventData.description = description;
      }

      const event = await createCalendarEvent(userId, eventData);

      return {
        result: `Event added: ${title}`,
        eventLink: event.link,
      };
    },
  });

  /**
   * List upcoming calendar events
   */
  const listCalendarEvents = createTool({
    name: "listUpcomingEvents",
    description: "List upcoming calendar events.",
    fn: async () => {
      const hasAccess = await hasCalendarAccess(userId);
      if (!hasAccess) {
        return { error: "Calendar not connected" };
      }

      const events = await listUpcomingEvents(userId, 5);

      return {
        events: events.map((e) => ({
          title: e.title,
          start: e.start,
          link: e.link,
        })),
        count: events.length,
      };
    },
  });

  return await AgentBuilder.create("journal_agent")
    .withModel("gemini-2.5-flash")
    .withInstruction(
      `You are a helpful journal assistant. Today is ${today}.

PERSONAL: saveJournalEntry, fetchJournalEntry, searchJournalEntries, getSummary, setGoal, listGoals, checkGoalProgress, updateGoalStatus
TEAMS: listUserTeams (show first!), saveTeamEntry, searchTeamEntries, setTeamGoal, listTeamGoals
CALENDAR: addToCalendar, listUpcomingEvents

For teams: Always use listUserTeams first to get team IDs, then use team operations.
For calendar: Parse dates naturally (tomorrow, next Monday, 2024-10-15).

CRITICAL TOOL SELECTION:
- If user wants to SEE/READ/GET/FETCH entries (e.g., "give me my coding journals", "show me entries about X", "what are my recent journals"):
  → Use searchJournalEntries - returns actual entry content
  
- If user wants a SUMMARY/ANALYSIS (e.g., "summarize my week", "tell me about", "analyze my"):
  → Use getSummary - returns AI-generated summary
  
Examples:
✅ "Give me my recent coding journals" → searchJournalEntries
✅ "Show me entries about Python" → searchJournalEntries
✅ "What did I write about work?" → searchJournalEntries
✅ "Summarize my coding journals" → getSummary
✅ "Tell me about my week" → getSummary

SUMMARY GENERATION:
When getSummary is called:
1. The tool will return the entries with an instruction at the end
2. Follow that instruction to write a thoughtful, well-structured summary
3. Identify key themes, patterns, activities, and accomplishments
4. Write 2-3 paragraphs that give meaningful insights, not just a list
5. Make it conversational and engaging
6. Use bullet points sparingly, only for highlighting specific dates/activities within your narrative

IMPORTANT ERROR HANDLING:
- If searchJournalEntries returns an empty array, tell user they need to write entries first
- If searchJournalEntries returns an error field, explain the technical issue clearly to the user
- If a tool fails, ALWAYS check the response for an "error" field and communicate it to the user
- Never say a tool is "unable" or "not working" without explaining the actual error from the response

Be helpful, transparent, and guide users to solutions.`
    )
    .withTools(
      saveJournalEntry,
      fetchJournalEntry,
      searchJournalEntries,
      getSummary,
      setGoal,
      listGoals,
      checkGoalProgress,
      updateGoalStatusTool,
      listUserTeams,
      saveTeamEntryTool,
      searchTeamEntriesTool,
      setTeamGoal,
      listTeamGoals,
      addToCalendar,
      listCalendarEvents
    )
    .build();
}
