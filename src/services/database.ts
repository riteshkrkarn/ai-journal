import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY! // Use secret key for full access
);

/**
 * Save a journal entry with embedding
 * @param userId - User's unique ID
 * @param date - Entry date in YYYY-MM-DD format
 * @param content - Journal entry content
 * @param embedding - 768-dimensional vector
 */
export async function saveEntry(
  userId: string,
  date: string,
  content: string,
  embedding: number[]
): Promise<void> {
  const { error } = await supabase.from("entries").insert({
    user_id: userId,
    date,
    content,
    embedding: JSON.stringify(embedding), // Store as JSON for now
  });

  if (error) {
    throw new Error(`Failed to save entry: ${error.message}`);
  }
}

/**
 * Fetch entry for a specific date and user
 * @param userId - User's unique ID
 * @param date - Entry date in YYYY-MM-DD format
 * @returns Entry content or undefined if not found
 */
export async function fetchEntryByDate(
  userId: string,
  date: string
): Promise<{ content: string } | undefined> {
  const { data, error } = await supabase
    .from("entries")
    .select("content")
    .eq("user_id", userId)
    .eq("date", date)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - entry doesn't exist
      return undefined;
    }
    throw new Error(`Failed to fetch entry: ${error.message}`);
  }

  return data as { content: string };
}

/**
 * Get all entries for a user
 * @param userId - User's unique ID
 * @returns Array of all entries with embeddings
 */
export async function getAllEntries(userId: string): Promise<
  Array<{
    id: string;
    date: string;
    content: string;
    embedding: string;
  }>
> {
  const { data, error } = await supabase
    .from("entries")
    .select("id, date, content, embedding")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Failed to get entries: ${error.message}`);
  }

  return data || [];
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Search entries by semantic similarity
 * @param userId - User's unique ID
 * @param queryEmbedding - Query vector (768 dimensions)
 * @param topK - Number of results to return
 * @returns Top K most similar entries with similarity scores
 */
export async function searchEntries(
  userId: string,
  queryEmbedding: number[],
  topK: number = 3
): Promise<
  Array<{
    date: string;
    content: string;
    similarity: number;
  }>
> {
  // Get all entries for this user
  const entries = await getAllEntries(userId);

  if (entries.length === 0) {
    return [];
  }

  // Calculate similarity for each entry
  const results = entries
    .map((entry) => {
      const embedding = JSON.parse(entry.embedding) as number[];
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return {
        date: entry.date,
        content: entry.content,
        similarity,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
}

/**
 * Get entries within a date range for summaries
 * @param userId - User's unique ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Array of entries in date range
 */
export async function getEntriesInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<
  Array<{
    date: string;
    content: string;
    embedding: string;
  }>
> {
  const { data, error } = await supabase
    .from("entries")
    .select("date, content, embedding")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`Failed to get entries in range: ${error.message}`);
  }

  return data || [];
}
