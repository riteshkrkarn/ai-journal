import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(__dirname, "../../journal.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT
  )
`);

export function saveEntry(date: string, content: string, embedding: number[]) {
  const stmt = db.prepare(
    "INSERT INTO entries (date, content, embedding) VALUES (?, ?, ?)"
  );
  stmt.run(date, content, JSON.stringify(embedding));
}

export function fetchEntryByDate(
  date: string
): { content: string } | undefined {
  const stmt = db.prepare("SELECT content FROM entries WHERE date = ?");
  return stmt.get(date) as { content: string } | undefined;
}

export function getAllEntries(): Array<{
  id: number;
  date: string;
  content: string;
  embedding: string;
}> {
  const stmt = db.prepare("SELECT id, date, content, embedding FROM entries");
  return stmt.all() as Array<{
    id: number;
    date: string;
    content: string;
    embedding: string;
  }>;
}

// ⭐ NEW: Get entries in a date range
export function getEntriesInDateRange(
  startDate: string,
  endDate: string
): Array<{ id: number; date: string; content: string; embedding: string }> {
  const stmt = db.prepare(
    "SELECT id, date, content, embedding FROM entries WHERE date BETWEEN ? AND ? ORDER BY date ASC"
  );
  return stmt.all(startDate, endDate) as Array<{
    id: number;
    date: string;
    content: string;
    embedding: string;
  }>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export function searchEntries(
  queryEmbedding: number[],
  topK: number = 3
): Array<{ date: string; content: string; similarity: number }> {
  const entries = getAllEntries();

  const results = entries
    .map((entry) => {
      const embedding = JSON.parse(entry.embedding) as number[];
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return { date: entry.date, content: entry.content, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
}
