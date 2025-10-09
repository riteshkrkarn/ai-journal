<p align="center">
  <img src="./public/logo.png" alt="ReflectIQ Logo" width="200"/>
</p>

# ReflectIQ

An intelligent journaling application powered by AI that lets you save entries and query them using natural language. Built with TypeScript, Supabase, and IQ AI ADK.

## Features

- **Natural Language Interface**: Chat with your journal using conversational queries
- **Semantic Search**: Find entries by meaning, not just keywords (e.g., "show me coding entries" finds AI, TypeScript, Python entries)
- **Smart Summaries**: Get weekly/monthly summaries filtered by topic
- **Goal Tracking**: Set goals, track progress, and see how often you mention them in entries
- **Cloud Storage**: All entries securely stored in Supabase with vector embeddings
- **Date Flexibility**: Use natural dates like "today", "yesterday", "this week"

## Tech Stack

- **IQ AI ADK v0.3.7**: Agent framework with Gemini 2.5 Flash
- **Supabase**: PostgreSQL database with vector storage
- **Google Generative AI**: text-embedding-004 for semantic search (768 dimensions)
- **TypeScript**: Type-safe development
- **tsx**: Runtime for TypeScript execution

## Setup

### Prerequisites

- Node.js (v18+)
- Supabase account
- Google API key (Gemini)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd ai-journal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run this SQL in the SQL Editor to create the `entries` table:

   ```sql
   CREATE TABLE entries (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL,
     date DATE NOT NULL,
     content TEXT NOT NULL,
     embedding TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX idx_entries_user_date ON entries(user_id, date);
   CREATE INDEX idx_entries_user_id ON entries(user_id);
   ```

4. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   GOOGLE_API_KEY=your_google_api_key_here
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SECRET_KEY=your_supabase_anon_key
   ```

   **PowerShell users**: Use this command to avoid quote issues:

   ```powershell
   @"
   GOOGLE_API_KEY=your_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SECRET_KEY=your_key
   "@ | Out-File -FilePath .env -Encoding utf8
   ```

5. **Run the CLI**
   ```bash
   npm run cli
   ```

## Usage

### Saving Entries

```
You: Save my journal for 2025-10-10: Learned about AI agents and TypeScript
You: Yesterday I worked on Python and built an ML model
```

### Searching Entries

```
You: Show me entries about coding
You: What did I learn about AI?
```

### Getting Summaries

```
You: Summarize my coding progress this week
You: Give me a summary of my work from Oct 1 to Oct 7
```

### Managing Goals

```
You: Add goal: Learn TypeScript
You: Show my goals
You: Check my progress on learning TypeScript
You: Mark my TypeScript goal as complete
```

### Fetching Specific Entries

```
You: Show my journal for 2025-10-10
You: What did I write yesterday?
```

## Project Structure

```
ai-journal/
├── src/
│   ├── agents/
│   │   └── assistant/
│   │       └── journalAgent.ts    # Main agent with tools
│   ├── services/
│   │   ├── database.ts            # Supabase operations
│   │   ├── embeddings.ts          # Vector embedding generation
│   │   └── goals.ts               # Goal management
│   ├── tests/
│   │   ├── testConnection.ts      # Test Supabase connection
│   │   ├── debugDatabase.ts       # View database contents
│   │   └── clearDatabase.ts       # Clear test data
│   ├── cli.ts                     # Interactive CLI interface
│   └── index.ts                   # Entry point
├── .env                           # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Available Tools

The journal agent has these capabilities:

- `saveJournalEntry` - Save a new journal entry with date and content
- `fetchJournalEntry` - Get entry for a specific date
- `searchJournalEntries` - Semantic search across all entries
- `getSummary` - Get summarized entries for a date range with optional topic filter
- `setGoal` - Create a new goal
- `listGoals` - View all goals (active and completed)
- `checkGoalProgress` - Find journal entries related to a goal
- `updateGoalStatus` - Mark goals as complete/incomplete

## Testing

```bash
# Test database connection
npx tsx src/tests/testConnection.ts

# View all entries
npx tsx src/tests/debugDatabase.ts

# Clear all entries (use with caution!)
npx tsx src/tests/clearDatabase.ts
```

## Troubleshooting

### Environment variables not loading

If using PowerShell, ensure no extra quotes in `.env`. Recreate using the here-string method shown in setup.

### Semantic search not finding entries

The similarity threshold is set to 0.25. Entries with lower semantic similarity won't appear. Adjust in `journalAgent.ts` if needed.

### "No entries found" for date range

Check that:

- Entries exist in that date range (use `debugDatabase.ts`)
- Date format is YYYY-MM-DD
- Topic filter (if used) isn't too strict

## License

MIT

## Contributing

Pull requests welcome! Please ensure TypeScript types are correct and run tests before submitting.

**Why it works:** Embeddings understand semantic meaning automatically.

### 2. Weekly Summaries

```
You: Summarize this week
📝 Shows: All 7 entries from the past week with dates

You: What did I study this week?
📝 Shows: Only study-related entries from this week

You: My coding progress this week
📝 Shows: Only coding-related entries with dates
```

### 3. Persistent Data (Already Working!)

```powershell
# Session 1
npm run cli
You: Save my journal for today: Built a feature
You: exit

# Close terminal, reboot computer, whatever...

# Session 2 (days later)
npm run cli
You: What did I do on 2024-10-09?
📝 Still shows: Built a feature
```

**Your data is in `journal.db` on disk!**

---

## 🎯 What Each Feature Demonstrates

| Feature        | Tech Used                      | ADK Integration                     |
| -------------- | ------------------------------ | ----------------------------------- |
| Semantic Tags  | Embeddings + Cosine Similarity | FunctionTool (searchJournalEntries) |
| Summaries      | Date Range Query + Embeddings  | FunctionTool (getSummary)           |
| Persistence    | SQLite                         | N/A (better-sqlite3)                |
| Date Awareness | Dynamic Context Injection      | .withInstruction()                  |

---

## 📊 Architecture Overview

```
User Query
    ↓
ADK Agent (knows today's date)
    ↓
Tool Selection (4 tools available)
    ↓
├─ saveJournalEntry → SQLite + Embedding
├─ fetchJournalEntry → SQLite lookup
├─ searchJournalEntries → Vector search
└─ getSummary → Date range + optional topic filter
    ↓
Natural Language Response
```

---

## 🔍 Understanding Semantic Tags

**You asked about tags, but you already have something better!**

### Traditional Tags (What you DON'T need)

```
Entry 1: "Coding" [tags: coding, programming]
Entry 2: "Java work" [tags: java, coding]
Entry 3: "Programming" [tags: programming, development]

Query: "coding" → Only finds Entry 1 (exact match)
```

### Your Semantic Search (What you HAVE)

```
Entry 1: "Coding" [embedding: [0.23, 0.87, ...]]
Entry 2: "Java work" [embedding: [0.21, 0.89, ...]]
Entry 3: "Programming" [embedding: [0.24, 0.86, ...]]

Query: "coding" → Finds ALL 3! (semantic similarity)
Query: "software development" → Also finds all 3!
Query: "writing code" → Also finds all 3!
```

**Benefits:**

- ✅ No manual tagging needed
- ✅ Understands synonyms
- ✅ Finds related concepts
- ✅ Works in any language

---

## 🎨 Summary Feature Details

### Basic Summary

```
You: Summarize this week
```

**Agent does:**

1. Calculates week dates (7 days ago to today)
2. Calls `getSummary(weekAgo, today)`
3. Fetches all entries in range
4. Returns chronological list

### Topic-Filtered Summary

```
You: My coding progress this week
```

**Agent does:**

1. Calculates week dates
2. Calls `getSummary(weekAgo, today, "coding")`
3. Fetches all entries
4. Generates "coding" embedding
5. Filters entries by similarity > 0.3
6. Returns relevant entries only

---

## 🚀 Quick Start Commands

```powershell
# First time setup (if not done)
npm install

# Run comprehensive test
npm start

# Start interactive mode
npm run cli

# Fresh start (delete database)
Remove-Item journal.db
npm run cli
```

---

## ❓ Common Questions

### Q: Do I need to manually add tags?

**A:** No! Your semantic search automatically finds related entries.

### Q: Is my data persistent?

**A:** Yes! `journal.db` file stores everything permanently.

### Q: How does the agent know "today"?

**A:** The instruction dynamically injects the current date on every startup.

### Q: Can I search in natural language?

**A:** Yes! Ask anything like "when did I code", "my study journey", etc.

### Q: How many ADK tools do I have now?

**A:** 4 tools:

1. saveJournalEntry
2. fetchJournalEntry
3. searchJournalEntries
4. getSummary ← NEW!

---

## 🎯 Next Steps After Implementation

### Immediate Testing

1. Run `npm start` - See all features in action
2. Run `npm run cli` - Try interactive queries
3. Test persistence - Exit and restart

### Try These Queries

```
- "Summarize this week"
- "What did I study this week?"
- "My coding progress in the last 7 days"
- "Tell me about all my programming work"
- "When did I work on databases?"
```

---

## 📈 Feature Comparison

| Feature       | Traditional Approach    | Your AI Journal                   |
| ------------- | ----------------------- | --------------------------------- |
| Tags          | Manual tagging required | Automatic semantic understanding  |
| Search        | Exact keyword match     | Natural language queries          |
| Summaries     | Manual reading          | AI-generated summaries            |
| Persistence   | Complex backend         | Simple SQLite file                |
| Date handling | Manual date entry       | "today", "yesterday", "this week" |

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] `npm start` runs without errors
- [ ] Test suite shows 7 entries saved
- [ ] Semantic search finds related entries
- [ ] Summary shows weekly overview
- [ ] Topic summary filters correctly
- [ ] CLI starts with new instructions
- [ ] Data persists after restart (close CLI, reopen, query old entry)

---

**You're ready to implement! Just replace the 4 files and run the tests.** 🚀
