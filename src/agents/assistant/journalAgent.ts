import { AgentBuilder, FunctionTool } from "@iqai/adk";
import * as dotenv from "dotenv";
import {
  saveEntry,
  fetchEntryByDate,
  searchEntries,
  getEntriesInDateRange,
} from "../../services/database";
import { generateEmbedding } from "../../services/embeddings";

dotenv.config();

// Existing save tool
async function saveJournalEntryFunc(date: string, content: string) {
  const embedding = await generateEmbedding(content);
  saveEntry(date, content, embedding);
  return { result: "Entry saved!" };
}

const saveJournalEntry = new FunctionTool(saveJournalEntryFunc, {
  name: "saveJournalEntry",
  description: "Add a new memory journal entry for a specific date.",
});

// Existing fetch tool
async function fetchJournalEntryFunc(date: string) {
  const entry = fetchEntryByDate(date);
  return entry
    ? { content: entry.content }
    : { content: "No entry found for this date." };
}

const fetchJournalEntry = new FunctionTool(fetchJournalEntryFunc, {
  name: "fetchJournalEntry",
  description: "Read your journal entry for a specific date.",
});

// Existing search tool
async function searchJournalEntriesFunc(query: string) {
  const queryEmbedding = await generateEmbedding(query);
  const results = searchEntries(queryEmbedding, 3);

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

// ⭐ NEW: Summary tool
async function getSummaryFunc(
  startDate: string,
  endDate: string,
  topic?: string
) {
  const entries = getEntriesInDateRange(startDate, endDate);

  if (entries.length === 0) {
    return { summary: "No entries found in this date range." };
  }

  // If topic specified, filter semantically
  let relevantEntries = entries;
  if (topic) {
    const topicEmbedding = await generateEmbedding(topic);
    const scored = entries.map((entry) => {
      const embedding = JSON.parse(entry.embedding) as number[];
      const similarity = cosineSimilarity(topicEmbedding, embedding);
      return { ...entry, similarity };
    });
    relevantEntries = scored
      .filter((e) => e.similarity > 0.3) // Relevance threshold
      .sort((a, b) => b.similarity - a.similarity);
  }

  // Return structured data for AI to format naturally
  return {
    entries: relevantEntries.map((e) => `${e.date}: ${e.content}`),
    entryCount: relevantEntries.length,
    dateRange: `${startDate} to ${endDate}`,
    topic: topic || "all topics",
    instruction:
      "Write a natural, flowing paragraph summarizing these entries. Don't use bullet points.",
  };
}

// Helper for cosine similarity (reused from search)
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

const getSummary = new FunctionTool(getSummaryFunc, {
  name: "getSummary",
  description: `Get a summary of journal entries for a date range. Optionally filter by topic.
  Use this when user asks for summaries like "summarize this week", "what did I do last month", "my study progress this week".
  Parameters:
  - startDate: Start date (YYYY-MM-DD)
  - endDate: End date (YYYY-MM-DD)
  - topic: Optional - filter entries by topic (e.g., "study", "work", "coding")`,
});

export async function journalAgent() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Calculate date helpers
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  return await AgentBuilder.create("journal_agent")
    .withModel("gemini-2.5-flash")
    .withInstruction(
      `
You are a helpful journal assistant. Today's date is ${todayStr}.

🎯 RESPONSE STYLE - VERY IMPORTANT:
- NEVER use bullet points or lists in your responses
- Write in natural, flowing paragraphs
- Be conversational and narrative
- Example BAD: "* 2024-10-09: You did coding"
- Example GOOD: "Looking at your week, you've been quite productive with coding. On October 9th, you worked on..."

For summaries:
- Write a cohesive narrative paragraph
- Weave the dates naturally into your story
- Highlight patterns and progress
- End with an encouraging insight
...
`
    )
    .withTools(
      saveJournalEntry,
      fetchJournalEntry,
      searchJournalEntries,
      getSummary
    )
    .build();
}
