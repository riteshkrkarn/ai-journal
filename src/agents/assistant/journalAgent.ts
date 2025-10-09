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

dotenv.config();

// Get userId from environment (temporary - will be from auth later)
const DEFAULT_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

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

async function saveJournalEntryFunc(date: string, content: string) {
  const embedding = await generateEmbedding(content);
  await saveEntry(DEFAULT_USER_ID, date, content, embedding);
  return { result: "Entry saved!" };
}

const saveJournalEntry = new FunctionTool(saveJournalEntryFunc, {
  name: "saveJournalEntry",
  description: "Add a new journal entry for a specific date.",
});

async function fetchJournalEntryFunc(date: string) {
  const entry = await fetchEntryByDate(DEFAULT_USER_ID, date);
  return entry
    ? { content: entry.content }
    : { content: "No entry found for this date." };
}

const fetchJournalEntry = new FunctionTool(fetchJournalEntryFunc, {
  name: "fetchJournalEntry",
  description: "Read your journal entry for a specific date.",
});

async function searchJournalEntriesFunc(query: string) {
  const queryEmbedding = await generateEmbedding(query);
  const results = await searchEntries(DEFAULT_USER_ID, queryEmbedding, 3);

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

const searchJournalEntries = new FunctionTool(searchJournalEntriesFunc, {
  name: "searchJournalEntries",
  description:
    "Search journal entries by meaning or topic. Use this when user asks questions like 'when did I...', 'what did I write about...', or 'show entries about...'",
});

async function getSummaryFunc(
  startDate: string,
  endDate: string,
  topic?: string
) {
  console.log(
    `[getSummary] Called with: startDate=${startDate}, endDate=${endDate}, topic=${topic}`
  );

  const entries = await getEntriesInRange(DEFAULT_USER_ID, startDate, endDate);
  console.log(`[getSummary] Found ${entries.length} entries in date range`);

  if (entries.length === 0) {
    return { summary: "No entries found in this date range." };
  }

  let filteredEntries = entries;

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

const getSummary = new FunctionTool(getSummaryFunc, {
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
});

// ===== GOAL TOOLS =====

async function setGoalFunc(
  title: string,
  description: string,
  deadline: string
) {
  const goal = await createGoal(DEFAULT_USER_ID, title, description, deadline);
  return {
    result: `Goal created: "${goal.title}" (ID: ${goal.id})`,
    goalId: goal.id,
  };
}

const setGoal = new FunctionTool(setGoalFunc, {
  name: "setGoal",
  description:
    "Create a new goal with a title, description, and deadline (YYYY-MM-DD format). Use when user says 'set a goal', 'I want to achieve', 'my goal is', etc.",
});

async function listGoalsFunc() {
  const goals = await getAllGoals(DEFAULT_USER_ID);

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

const listGoals = new FunctionTool(listGoalsFunc, {
  name: "listGoals",
  description:
    "Show all goals with their status (completed or in progress). Use when user asks 'show my goals', 'list goals', 'what are my goals', etc.",
});

async function checkGoalProgressFunc(goalId: string) {
  const goal = await getGoalById(DEFAULT_USER_ID, goalId);

  if (!goal) {
    return { error: "Goal not found." };
  }

  // Use semantic search to find entries related to this goal
  const goalText = `${goal.title} ${goal.description}`;
  const queryEmbedding = await generateEmbedding(goalText);
  const relatedEntries = await searchEntries(
    DEFAULT_USER_ID,
    queryEmbedding,
    10
  );

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

const checkGoalProgress = new FunctionTool(checkGoalProgressFunc, {
  name: "checkGoalProgress",
  description:
    "Check progress on a specific goal by finding related journal entries using semantic search. Requires goal ID. Use when user asks 'how am I doing on [goal]', 'check my progress', etc.",
});

async function updateGoalStatusFunc(goalId: string, completed: boolean) {
  await updateGoalStatus(DEFAULT_USER_ID, goalId, completed);
  return {
    result: completed
      ? "🎉 Goal marked as completed!"
      : "Goal marked as in progress.",
  };
}

const updateGoalStatusTool = new FunctionTool(updateGoalStatusFunc, {
  name: "updateGoalStatus",
  description:
    "Mark a goal as completed (true) or in progress (false). Requires goal ID. Use when user says 'mark goal as done', 'complete goal', 'uncomplete goal', etc.",
});

export async function journalAgent() {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];

  return await AgentBuilder.create("journal_agent")
    .withModel("gemini-2.5-flash")
    .withInstruction(
      `You are a helpful journal assistant with goal tracking capabilities.

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

When showing results, write in paragraph form with a narrative style, not bullet points.
Be encouraging and supportive about goals and progress.`
    )
    .withTools(
      saveJournalEntry,
      fetchJournalEntry,
      searchJournalEntries,
      getSummary,
      setGoal,
      listGoals,
      checkGoalProgress,
      updateGoalStatusTool
    )
    .build();
}
