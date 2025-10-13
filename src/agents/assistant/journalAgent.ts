import { AgentBuilder, FunctionTool } from "@iqai/adk";
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

  const saveJournalEntry = new FunctionTool(
    async (date: string, content: string) => {
      const embedding = await generateEmbedding(content);
      const result = await saveEntry(userId, date, content, embedding);
      return { result };
    },
    {
      name: "saveJournalEntry",
      description: "Add a new journal entry for a specific date.",
    }
  );

  const fetchJournalEntry = new FunctionTool(
    async (date: string) => {
      const entry = await fetchEntryByDate(userId, date);
      return entry
        ? { content: entry.content }
        : { content: "No entry found for this date." };
    },
    {
      name: "fetchJournalEntry",
      description: "Read your journal entry for a specific date.",
    }
  );

  const searchJournalEntries = new FunctionTool(
    async (query: string) => {
      try {
        const queryEmbedding = await generateEmbedding(query);
        const results = await searchEntries(userId, queryEmbedding, 3);

        if (results.length === 0) {
          return {
            result:
              "No journal entries found matching your search. You may need to write some entries first before searching.",
            entries: [],
          };
        }

        return {
          result: `Found ${results.length} matching entries.`,
          entries: results.map((r) => ({
            date: r.date,
            content: r.content,
            relevance: r.similarity.toFixed(2),
          })),
        };
      } catch (error: any) {
        console.error("[searchJournalEntries] Error:", error);
        return {
          result: `Search completed, but encountered an issue: ${error.message}`,
          entries: [],
        };
      }
    },
    {
      name: "searchJournalEntries",
      description:
        "Search journal entries by meaning or topic. Returns entries with similarity scores.",
    }
  );

  const getSummary = new FunctionTool(
    async (startDate: string, endDate: string, topic?: string) => {
      const entries = await getEntriesInRange(userId, startDate, endDate);

      if (entries.length === 0) {
        return { summary: "No entries found in this date range." };
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
          .filter((r) => r.similarity > 0.5)
          .map((r) => ({ date: r.date, content: r.content }));
      }

      if (filteredEntries.length === 0) {
        return {
          summary: `No entries about "${topic}" found in this date range.`,
        };
      }

      const entriesText = filteredEntries
        .map((e) => `${e.date}: ${e.content}`)
        .join("\n\n");

      return {
        summary: `Entries from ${startDate} to ${endDate}:\n\n${entriesText}`,
        entryCount: filteredEntries.length,
      };
    },
    {
      name: "getSummary",
      description: "Get a summary of journal entries for a date range.",
    }
  );

  // ===== GOAL TOOLS =====

  const setGoal = new FunctionTool(
    async (title: string, description: string, deadline: string) => {
      const goal = await createGoal(userId, title, description, deadline);
      return {
        result: `Goal created: "${goal.title}". You can check it in the Goals page.`,
        goalId: goal.id,
      };
    },
    {
      name: "setGoal",
      description: "Create a new goal with title, description, and deadline.",
    }
  );

  const listGoals = new FunctionTool(
    async () => {
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
    {
      name: "listGoals",
      description: "Show all goals.",
    }
  );

  const checkGoalProgress = new FunctionTool(
    async (goalId: string) => {
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
    {
      name: "checkGoalProgress",
      description: "Check progress on a specific goal.",
    }
  );

  const updateGoalStatusTool = new FunctionTool(
    async (goalId: string, completed: boolean) => {
      await updateGoalStatus(userId, goalId, completed);
      return {
        result: completed ? "Goal completed!" : "Goal marked incomplete.",
      };
    },
    {
      name: "updateGoalStatus",
      description: "Mark a goal as completed or incomplete.",
    }
  );

  // ===== TEAM TOOLS =====

  const listUserTeams = new FunctionTool(
    async () => {
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
    {
      name: "listUserTeams",
      description: "List all teams the user is in.",
    }
  );

  const saveTeamEntryTool = new FunctionTool(
    async (teamId: string, date: string, content: string) => {
      const isMember = await isTeamMember(userId, teamId);
      if (!isMember) {
        return { error: "Not a team member" };
      }

      const embedding = await generateEmbedding(content);
      await saveTeamEntry(userId, teamId, date, content, embedding);
      return { result: "Team entry saved!" };
    },
    {
      name: "saveTeamEntry",
      description:
        "Save a journal entry to a team. Requires teamId, date, content.",
    }
  );

  const searchTeamEntriesTool = new FunctionTool(
    async (teamId: string, query: string) => {
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
    {
      name: "searchTeamEntries",
      description: "Search team journal entries. Requires teamId and query.",
    }
  );

  const setTeamGoal = new FunctionTool(
    async (
      teamId: string,
      title: string,
      description: string,
      deadline: string
    ) => {
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
    {
      name: "setTeamGoal",
      description:
        "Create a goal for a team. Requires teamId, title, description, deadline.",
    }
  );

  const listTeamGoals = new FunctionTool(
    async (teamId: string) => {
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
    {
      name: "listTeamGoals",
      description: "List all team goals. Requires teamId.",
    }
  );

  // ===== CALENDAR TOOLS =====

  const addToCalendar = new FunctionTool(
    async (
      title: string,
      dateStr: string,
      timeStr: string,
      description?: string
    ) => {
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
    {
      name: "addToCalendar",
      description:
        "Add event to Google Calendar. Args: title, dateStr, timeStr, description (optional).",
    }
  );

  const listCalendarEvents = new FunctionTool(
    async () => {
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
    {
      name: "listUpcomingEvents",
      description: "List upcoming calendar events.",
    }
  );

  return await AgentBuilder.create("journal_agent")
    .withModel("gemini-2.5-flash")
    .withInstruction(
      `You are a helpful journal assistant. Today is ${today}.

PERSONAL: saveJournalEntry, fetchJournalEntry, searchJournalEntries, getSummary, setGoal, listGoals, checkGoalProgress, updateGoalStatus
TEAMS: listUserTeams (show first!), saveTeamEntry, searchTeamEntries, setTeamGoal, listTeamGoals
CALENDAR: addToCalendar, listUpcomingEvents

For teams: Always use listUserTeams first to get team IDs, then use team operations.
For calendar: Parse dates naturally (tomorrow, next Monday, 2024-10-15).

IMPORTANT: If a search returns no results, explain to the user that they need to write some journal entries first. Don't say the tool is "not working" - it works correctly, there's just no data to search yet. Be helpful and guide them to create entries first.`
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
