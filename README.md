<p align="center">
  <img src="./public/logo.png" alt="ReflectIQ Logo" width="200"/>
</p>

# ReflectIQ

AI-powered journal with autonomous decision-making. The agent automatically determines when to create entries, set goals, or schedule calendar events through natural conversation.

## Features

- **Autonomous AI Agent**: AI decides when to journal, set goals, or add calendar events
- **Semantic Search**: Vector-based search using 768-dim embeddings (pgvector + cosine similarity)
- **Goal Tracking**: AI monitors progress by analyzing journal mentions
- **Google Calendar**: OAuth 2.0 integration for event scheduling
- **Real-time Chat**: WebSocket-based AI conversation
- **Multi-user Auth**: Supabase Auth with JWT tokens
- **REST API**: 23 endpoints for testing/integration

## Tech Stack

**AI & LLM**

- IQ AI ADK v0.3.7 (agent framework)
- Google Gemini 2.5 Flash (language model)
- Google text-embedding-004 (768-dim vectors)

**Backend**

- Express.js + TypeScript
- WebSocket (ws library)
- Supabase PostgreSQL + pgvector
- Google Calendar API v3

**Auth & Security**

- Supabase Auth
- JWT tokens
- Google OAuth 2.0

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Google Cloud Console (for Gemini API & Calendar OAuth)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd ai-journal
npm install
```

### Database Setup

Run in Supabase SQL Editor:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries table (unique constraint: one entry per user per day)
CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_date ON entries(date);
CREATE INDEX idx_entries_embedding ON entries USING ivfflat (embedding vector_cosine_ops);

-- Goals table
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    deadline DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);

-- Calendar tokens table
CREATE TABLE calendar_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own entries" ON entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own tokens" ON calendar_tokens FOR ALL USING (auth.uid() = user_id);
```

### Environment Variables

Create `.env`:

```env
# Google AI
GOOGLE_API_KEY=your_gemini_api_key

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_key

# Google Calendar OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/calendar/callback

# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

**Google Cloud Console Setup:**

1. Enable Generative Language API (for Gemini)
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/calendar/callback`

### Run Server

```bash
npm run api
```

Server starts at `http://localhost:3000` with WebSocket at `ws://localhost:3000/ws`

## Usage

### Authentication

```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","fullName":"User"}'

# Signin
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Returns: { "session": { "access_token": "..." } }
```

### WebSocket Chat

```bash
npm run test:ws
```

**Example conversation:**

```
You: Today I completed the calendar integration
AI: [Automatically saves journal entry]

You: Set goal: Ship MVP by Oct 15
AI: [Creates goal with deadline]

You: Add to calendar: team meeting tomorrow at 3pm
AI: [Checks OAuth → Creates Google Calendar event]

You: How's my MVP goal going?
AI: [Searches journal entries → Reports progress]
```

### REST API Examples

```bash
# Create journal entry
curl -X POST http://localhost:3000/entries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-10-11","content":"Built calendar integration"}'

# Semantic search
curl -X POST http://localhost:3000/entries/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"coding projects","limit":5}'

# Create goal
curl -X POST http://localhost:3000/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Complete hackathon","deadline":"2025-10-15"}'

# Connect Google Calendar
curl http://localhost:3000/calendar/connect \
  -H "Authorization: Bearer $TOKEN"
# Returns OAuth URL → Open in browser → Authorize
```

## Project Structure

```
src/
├── api/
│   ├── server.ts              # Express + WebSocket server
│   ├── routes/
│   │   ├── auth.ts            # Authentication (5 endpoints)
│   │   ├── entries.ts         # Journal CRUD (6 endpoints)
│   │   ├── goals.ts           # Goal management (6 endpoints)
│   │   └── calender.ts        # Calendar OAuth (6 endpoints)
│   ├── middleware/
│   │   └── auth.ts            # JWT verification
│   └── websocket/
│       └── websockets.ts      # Real-time AI chat
├── agents/
│   └── assistant/
│       └── journalAgent.ts    # 10 ADK tools + agent config
├── services/
│   ├── database.ts            # Supabase CRUD operations
│   ├── embeddings.ts          # Vector generation (768-dim)
│   ├── goals.ts               # Goal CRUD
│   ├── oauth.ts               # Google OAuth flow
│   └── calender.ts            # Calendar API wrapper
└── tests/
    └── wsTest.ts              # WebSocket test script
```

## AI Agent Tools (10)

The agent autonomously selects tools based on conversation context:

**Journal (4)**

- `saveJournalEntry` - Auto-saves when user shares experiences
- `fetchJournalEntry` - Retrieves specific date entries
- `searchJournalEntries` - Semantic search across all entries
- `getSummary` - Date range summaries with topic filtering

**Goals (4)**

- `setGoal` - Creates goals with deadlines
- `listGoals` - Shows all active/completed goals
- `checkGoalProgress` - AI analyzes journal mentions (semantic search)
- `updateGoalStatus` - Marks complete/incomplete

**Calendar (2)**

- `addToCalendar` - Parses natural language → creates Google Calendar event
- `listUpcomingEvents` - Fetches upcoming events

## API Endpoints (23)

**Auth (5)**

```
POST   /auth/signup
POST   /auth/signin
POST   /auth/signout
POST   /auth/refresh
GET    /auth/me
```

**Entries (6)**

```
POST   /entries
GET    /entries/:date
GET    /entries
POST   /entries/search
POST   /entries/summary
DELETE /entries/:date
```

**Goals (6)**

```
POST   /goals
GET    /goals
GET    /goals/:id
POST   /goals/:id/progress
PUT    /goals/:id/complete
DELETE /goals/:id
```

**Calendar (6)**

```
GET    /calendar/connect
GET    /calendar/callback
GET    /calendar/status
DELETE /calendar/disconnect
POST   /calendar/events
GET    /calendar/events
```

**WebSocket (1)**

```
WS     /ws
```

## Key Implementation Details

### Semantic Search

1. Text → `generateEmbedding()` → 768-dim vector
2. pgvector cosine similarity search
3. Results sorted by relevance (threshold: 0.25)

### Goal Progress Tracking

1. Goal text → embedding
2. Search journal entries (similarity > 0.6)
3. Count mentions + show excerpts

### Calendar Integration

1. Check OAuth status via `calendar_tokens` table
2. Auto-refresh expired tokens
3. Parse natural language dates (supports "tomorrow", "Friday 3pm", etc.)
4. Create event via Google Calendar API v3

### WebSocket Authentication

1. Client: `{ "type": "auth", "token": "..." }`
2. Server verifies JWT with Supabase
3. Extract `userId` from token
4. All messages use authenticated context

## Known Limitations

- **One entry per day**: `UNIQUE(user_id, date)` constraint
- **Vector dimension**: Fixed at 768 (Google text-embedding-004)
- **Goal progress**: Semantic search only (no structured milestones)
- **No team collaboration**: Single-user mode only (Phase 4 planned)

## Development

```bash
# Start API server
npm run api

# Test WebSocket
npm run test:ws

# Build TypeScript
npm run build
```

## Troubleshooting

**OAuth redirect_uri_mismatch**

- Ensure Google Cloud Console has exact URI: `http://localhost:3000/calendar/callback`
- Match `.env` `GOOGLE_REDIRECT_URI` value

**Duplicate entry error**

- Database constraint allows one entry per user per day
- To allow multiple: Remove `UNIQUE(user_id, date)` constraint

**Semantic search returns no results**

- Similarity threshold is 0.25 (adjust in `journalAgent.ts`)
- Check embeddings are generated correctly

**WebSocket authentication fails**

- Verify JWT token is valid (not expired)
- Check `SUPABASE_SECRET_KEY` in `.env`

## License

MIT

## Next Phase

**Team Spaces** - Collaborative journals with shared entries, team goals, and role-based permissions.
