import { AgentBuilder, FunctionTool } from "@iqai/adk";
import * as dotenv from "dotenv";
import {
  saveEntry,
  fetchEntryByDate,
  searchEntries,
  getEntriesInRange,
} from "../../services/database";
import { generateEmbedding } from "../../services/embeddings";
import {
  createGoal,
  getAllGoals,
  getGoalById,
  updateGoalStatus,
} from "../../services/goals";
import {
  createCalendarEvent,
  listUpcomingEvents,
  parseDateTime,
} from "../../services/calender";
import { hasCalendarAccess } from "../../services/oauth";

dotenv.config();

// Cosine similarity helper function
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// ===== JOURNAL TOOLS =====

async function saveJournalEntryFunc(
  userId: string,
  date: string,
  content: string
) {
  const embedding = await generateEmbedding(content);
  await saveEntry(userId, date, content, embedding);
  return { result: "Entry saved!" };
}

async function fetchJournalEntryFunc(userId: string, date: string) {
  const entry = await fetchEntryByDate(userId, date);
  return entry
    ? { content: entry.content }
    : { content: "No entry found for this date." };
}

async function searchJournalEntriesFunc(userId: string, query: string) {
  const queryEmbedding = await generateEmbedding(query);
  const results = await searchEntries(userId, queryEmbedding, 3);

  if (results.length === 0) {
    return { entries: "No matching entries found." };
  }

  return {
    entries: results.map((r) => ({
      date: r.date,
      content: r.content,
      relevance: r.similarity.toFixed(2),
    })),
  };
}

async function getSummaryFunc(
  userId: string,
  startDate: string,
  endDate: string,
  topic?: string
) {
  console.log(
    `[getSummary] Called with: startDate=${startDate}, endDate=${endDate}, topic=${topic}`
  );

  const entries = await getEntriesInRange(userId, startDate, endDate);
  console.log(`[getSummary] Found ${entries.length} entries in date range`);

  if (entries.length === 0) {
    return { summary: "No entries found in this date range." };
  }

  let filteredEntries: Array<{ date: string; content: string }> = entries;

  // If topic is specified, filter the date-range entries by semantic similarity
  if (topic) {
    const queryEmbedding = await generateEmbedding(topic);

    // Calculate similarity for each entry in the date range
    filteredEntries = entries.filter((entry) => {
      const entryEmbedding = JSON.parse(entry.embedding || "[]");
      const similarity = cosineSimilarity(queryEmbedding, entryEmbedding);
      console.log(
        `[getSummary] Entry ${entry.date}: similarity=${similarity.toFixed(3)}`
      );
      return similarity > 0.25; // Lower threshold for better recall
    });

    console.log(
      `[getSummary] Topic filter "${topic}" kept ${filteredEntries.length}/${entries.length} entries`
    );
  }

  if (filteredEntries.length === 0) {
    return { summary: `No entries about "${topic}" found in this date range.` };
  }

  const entriesText = filteredEntries
    .map((e) => `${e.date}: ${e.content}`)
    .join("\n\n");

  return {
    summary: `Here are your entries from ${startDate} to ${endDate}${
      topic ? ` about "${topic}"` : ""
    }:\n\n${entriesText}\n\nBased on these entries, you can see patterns in your activities and focus areas during this period.`,
    entryCount: filteredEntries.length,
    dateRange: `${startDate} to ${endDate}`,
  };
}

// ===== GOAL TOOLS =====

async function setGoalFunc(
  userId: string,
  title: string,
  description: string,
  deadline: string
) {
  const goal = await createGoal(userId, title, description, deadline);
  return {
    result: `Goal created: "${goal.title}" (ID: ${goal.id})`,
    goalId: goal.id,
  };
}

async function listGoalsFunc(userId: string) {
  const goals = await getAllGoals(userId);

  if (goals.length === 0) {
    return { goals: "No goals found. Create one to get started!" };
  }

  return {
    goals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      deadline: g.deadline,
      completed: g.completed,
      status: g.completed ? "✅ Completed" : "🎯 In Progress",
    })),
    totalGoals: goals.length,
    completedCount: goals.filter((g) => g.completed).length,
  };
}

async function checkGoalProgressFunc(userId: string, goalId: string) {
  const goal = await getGoalById(userId, goalId);

  if (!goal) {
    return { error: "Goal not found." };
  }

  // Use semantic search to find entries related to this goal
  const goalText = `${goal.title} ${goal.description}`;
  const queryEmbedding = await generateEmbedding(goalText);
  const relatedEntries = await searchEntries(userId, queryEmbedding, 10);

  // Filter entries with good relevance (>0.6 similarity)
  const relevantEntries = relatedEntries.filter((e) => e.similarity > 0.6);

  return {
    goal: goal.title,
    mentionCount: relevantEntries.length,
    completed: goal.completed,
    deadline: goal.deadline,
    recentMentions: relevantEntries.slice(0, 3).map((e) => ({
      date: e.date,
      preview: e.content.substring(0, 100) + "...",
      relevance: e.similarity.toFixed(2),
    })),
    summary:
      relevantEntries.length > 0
        ? `You've mentioned this goal in ${
            relevantEntries.length
          } journal entries. ${
            goal.completed ? "Goal completed! 🎉" : "Keep up the good work!"
          }`
        : "No journal entries mention this goal yet. Start writing about your progress!",
  };
}

async function updateGoalStatusFunc(
  userId: string,
  goalId: string,
  completed: boolean
) {
  await updateGoalStatus(userId, goalId, completed);
  return {
    result: completed
      ? "🎉 Goal marked as completed!"
      : "Goal marked as in progress.",
  };
}

// ===== CALENDAR TOOLS =====

async function addToCalendarFunc(
  userId: string,
  title: string,
  date: string,
  time: string,
  description?: string
) {
  // Check if calendar is connected
  const hasAccess = await hasCalendarAccess(userId);

  if (!hasAccess) {
    return {
      error:
        "Google Calendar not connected. Please connect your calendar first by visiting the connect endpoint.",
      suggestion:
        "You can connect your calendar through the API at /calendar/connect",
    };
  }

  try {
    // Parse date and time
    const { start, end } = parseDateTime(date, time);

    // Create event
    const event = await createCalendarEvent(userId, {
      title,
      startTime: start,
      endTime: end,
      ...(description && { description }), // Only add if truthy
    });

    return {
      success: true,
      message: `✅ Event "${title}" added to your calendar!`,
      event: {
        title: event.title,
        link: event.link,
        start: event.start,
        end: event.end,
      },
    };
  } catch (error) {
    return {
      error: `Failed to create calendar event: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

async function listUpcomingEventsFunc(userId: string, limit: number = 5) {
  // Check if calendar is connected
  const hasAccess = await hasCalendarAccess(userId);

  if (!hasAccess) {
    return {
      error:
        "Google Calendar not connected. Please connect your calendar first.",
      suggestion:
        "You can connect your calendar through the API at /calendar/connect",
    };
  }

  try {
    const events = await listUpcomingEvents(userId, limit);

    if (events.length === 0) {
      return {
        message: "You have no upcoming events.",
        events: [],
      };
    }

    return {
      events: events.map((e: any) => ({
        title: e.title,
        start: e.start,
        description: e.description,
        link: e.link,
      })),
      count: events.length,
      message: `You have ${events.length} upcoming event${
        events.length > 1 ? "s" : ""
      }.`,
    };
  } catch (error) {
    return {
      error: `Failed to get events: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// ===== AGENT BUILDER =====

export async function journalAgent(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];

  // Create tools with userId bound
  const saveJournalEntry = new FunctionTool(
    (date: string, content: string) =>
      saveJournalEntryFunc(userId, date, content),
    {
      name: "saveJournalEntry",
      description: "Add a new journal entry for a specific date.",
    }
  );

  const fetchJournalEntry = new FunctionTool(
    (date: string) => fetchJournalEntryFunc(userId, date),
    {
      name: "fetchJournalEntry",
      description: "Read your journal entry for a specific date.",
    }
  );

  const searchJournalEntries = new FunctionTool(
    (query: string) => searchJournalEntriesFunc(userId, query),
    {
      name: "searchJournalEntries",
      description:
        "Search journal entries by meaning or topic. Use this when user asks questions like 'when did I...', 'what did I write about...', or 'show entries about...'",
    }
  );

  const getSummary = new FunctionTool(
    (startDate: string, endDate: string, topic?: string) =>
      getSummaryFunc(userId, startDate, endDate, topic),
    {
      name: "getSummary",
      description: `Get a summary of journal entries for a date range with optional topic filter.
    
CRITICAL DATE CALCULATION RULES:
- When user says "this week", calculate: startDate = 7 days ago, endDate = TODAY
- When user says "last week", calculate: startDate = 14 days ago, endDate = 7 days ago  
- When user says "this month", use first day of current month to TODAY
- TODAY = use the date from the agent instruction

PARAMETERS:
- startDate: Start date (YYYY-MM-DD format) - REQUIRED
- endDate: End date (YYYY-MM-DD format) - REQUIRED  
- topic: Optional search term (e.g., "coding", "study", "work") - filters results semantically

EXAMPLE: If today is 2025-10-10 and user says "this week", use startDate="2025-10-03" and endDate="2025-10-10"`,
    }
  );

  const setGoal = new FunctionTool(
    (title: string, description: string, deadline: string) =>
      setGoalFunc(userId, title, description, deadline),
    {
      name: "setGoal",
      description:
        "Create a new goal with a title, description, and deadline (YYYY-MM-DD format). Use when user says 'set a goal', 'I want to achieve', 'my goal is', etc.",
    }
  );

  const listGoals = new FunctionTool(() => listGoalsFunc(userId), {
    name: "listGoals",
    description:
      "Show all goals with their status (completed or in progress). Use when user asks 'show my goals', 'list goals', 'what are my goals', etc.",
  });

  const checkGoalProgress = new FunctionTool(
    (goalId: string) => checkGoalProgressFunc(userId, goalId),
    {
      name: "checkGoalProgress",
      description:
        "Check progress on a specific goal by finding related journal entries using semantic search. Requires goal ID. Use when user asks 'how am I doing on [goal]', 'check my progress', etc.",
    }
  );

  const updateGoalStatusTool = new FunctionTool(
    (goalId: string, completed: boolean) =>
      updateGoalStatusFunc(userId, goalId, completed),
    {
      name: "updateGoalStatus",
      description:
        "Mark a goal as completed (true) or in progress (false). Requires goal ID. Use when user says 'mark goal as done', 'complete goal', 'uncomplete goal', etc.",
    }
  );

  const addToCalendar = new FunctionTool(
    (title: string, date: string, time: string, description?: string) =>
      addToCalendarFunc(userId, title, date, time, description),
    {
      name: "addToCalendar",
      description: `Add an event to Google Calendar. Use when user says things like:
    - "Add to calendar: Meeting tomorrow at 3pm"
    - "Schedule team standup for Monday 9am"
    - "Remind me about doctor appointment next Friday 2pm"
    - "Create calendar event for project deadline"
    
PARAMETERS:
- title: Event title (required) - e.g., "Team Meeting", "Doctor Appointment"
- date: Date like "today", "tomorrow", "2024-10-15", "next Monday", "Friday"
- time: Time like "3pm", "14:30", "9:00am", "2:30pm"
- description: Optional event details or notes

IMPORTANT: If calendar is not connected, inform the user they need to connect it first.`,
    }
  );

  const listCalendarEvents = new FunctionTool(
    (limit?: number) => listUpcomingEventsFunc(userId, limit || 5),
    {
      name: "listUpcomingEvents",
      description: `List upcoming calendar events. Use when user asks:
    - "What's on my calendar?"
    - "Show my upcoming events"
    - "What do I have scheduled?"
    - "Do I have any meetings today?"
    - "What's coming up?"
    
PARAMETERS:
- limit: Number of events to show (default: 5, max: 20)

IMPORTANT: If calendar is not connected, inform the user they need to connect it first.`,
    }
  );

  return await AgentBuilder.create("journal_agent")
    .withModel("gemini-2.5-flash")
    .withInstruction(
      `You are a helpful journal assistant with goal tracking and Google Calendar integration capabilities.

CURRENT DATE INFORMATION (USE THESE EXACT VALUES):
- Today's date: ${today}
- Yesterday's date: ${yesterday}  
- One week ago: ${weekAgo}

DATE CALCULATION RULES - FOLLOW EXACTLY:
When user says "this week" or "my week" or "coding progress this week":
  → Call getSummary with: startDate="${weekAgo}", endDate="${today}", topic="coding"
  → Do NOT calculate dates yourself, use the exact values above

JOURNAL FEATURES:
- "today" = ${today}
- "yesterday" = ${yesterday}
- Use searchJournalEntries for questions about past entries
- Use saveJournalEntry to save new entries
- Use fetchJournalEntry only for exact date lookups
- Use getSummary for weekly/monthly summaries with the exact dates shown above

GOAL FEATURES:
- Use setGoal when user wants to create a new goal
- Use listGoals when user asks to see their goals
- Use checkGoalProgress to find how often a goal appears in journal entries (semantic search)
- Use updateGoalStatus to mark goals as complete/incomplete
- When checking progress, explain that you're using AI to find related journal entries

CALENDAR FEATURES:
- Use addToCalendar when user wants to schedule events or create reminders
- Use listUpcomingEvents when user asks about their calendar or upcoming events
- Calendar events can be added with natural language like "tomorrow at 3pm"
- If calendar is not connected, politely inform the user and explain they can connect it via the API
- When creating events, confirm the details back to the user
- Support natural language dates like "today", "tomorrow", "next Monday", "Friday"

RESPONSE STYLE:
- Write in paragraph form with a narrative style, not bullet points
- Be encouraging and supportive about goals and progress
- Be conversational and friendly
- When showing multiple items (goals, events), present them in a clear, organized way
- Always confirm actions taken (entry saved, goal created, event scheduled)

ERROR HANDLING:
- If calendar is not connected, guide the user to connect it
- If a goal ID is not found, ask the user to list their goals first
- If a date is ambiguous, ask for clarification`
    )
    .withTools(
      // Journal tools (4)
      saveJournalEntry,
      fetchJournalEntry,
      searchJournalEntries,
      getSummary,
      // Goal tools (4)
      setGoal,
      listGoals,
      checkGoalProgress,
      updateGoalStatusTool,
      // Calendar tools (2)
      addToCalendar,
      listCalendarEvents
    )
    .build();
}
