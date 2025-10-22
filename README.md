<p align="center">
  <img src="./server/public/logo.png" alt="ReflectIQ Logo" width="200"/>
</p>

# ReflectIQ

AI-powered journal that autonomously decides what to do based on your conversation. No buttons—just chat naturally.

## What It Does

Talk to the AI like a friend. It automatically:

- Saves journal entries when you share daily experiences
- Creates goals when you mention deadlines
- Searches past entries using semantic meaning
- Tracks goal progress by analyzing your journal
- Schedules Google Calendar events from natural language

## Features

- **Autonomous Journaling** - Auto-detects and saves daily reflections
- **Semantic Search** - Find entries by meaning, not keywords (768-dim vectors)
- **Smart Goal Tracking** - AI monitors progress via journal analysis
- **Calendar Integration** - Natural language → Google Calendar events
- **Real-time Chat** - WebSocket with typing effects and auto-reconnect
- **Multi-user Auth** - Secure JWT-based authentication

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, WebSocket  
**Backend:** Express.js, TypeScript, WebSocket (ws), Supabase PostgreSQL + pgvector  
**AI:** IQ AI ADK v0.3.7, Google Gemini 2.5 Flash, text-embedding-004 (768-dim)  
**Auth:** Supabase Auth, JWT tokens, Google OAuth 2.0

## How It Works

```
1. User Message
   ↓
2. WebSocket → Backend (JWT auth)
   ↓
3. AI Agent (Gemini 2.5 Flash)
   - Analyzes user intent
   - Selects appropriate tool(s)
   ↓
4. Tool Execution
   - Save journal entry (with embedding generation)
   - Search entries (cosine similarity on vectors)
   - Create/track goals
   - Add calendar events
   ↓
5. Response streams back (word-by-word typing effect)
```

**10 Autonomous Tools:**

- Journal: `saveEntry`, `fetchEntry`, `searchEntries`, `getSummary`
- Goals: `setGoal`, `listGoals`, `checkProgress`, `updateStatus`
- Calendar: `addEvent`, `listEvents`

AI picks the right tool automatically—no commands needed.

## Setup

```bash
# 1. Install
git clone <repo-url>
cd ai-journal
npm install

# 2. Configure .env
GOOGLE_API_KEY=<gemini-key>
SUPABASE_URL=<supabase-url>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SECRET_KEY=<service-key>
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/calendar/callback
JWT_SECRET=<random-string>

# 3. Setup Supabase database (SQL in docs)
# 4. Enable Google APIs (Gemini + Calendar)

# 5. Run
npm run api                    # Backend: localhost:3000
cd src/frontend && npm run dev # Frontend: localhost:5173
```

## Usage Examples

**Journaling**

```
You: Today I finished the auth system and deployed to production
AI: Great work! I've saved that to your journal.
```

**Goals**

```
You: I want to complete 15 DSA topics by December 31st
AI: Goal created: "Complete 15 DSA topics". You can check it in the Goals page.
```

**Search**

```
You: When did I work on the calendar feature?
AI: October 11th: "Built Google Calendar OAuth integration..."
```

**Progress**

```
You: How's my DSA goal going?
AI: You've mentioned it 4 times:
    - Oct 10: Binary search practice
    - Oct 12: Dynamic programming
    ...
```

## Contributors

**Ritesh Kumar Karn** - Backend & AI Services  
[LinkedIn](https://www.linkedin.com/in/riteshkrkarn) • [X](https://x.com/riteshkrkarn) • [GitHub](https://github.com/riteshkrkarn)

**Khushi Mishra** - Frontend  
[LinkedIn](https://www.linkedin.com/in/khushi-mishra-06815931b/) • [X](https://x.com/Khushim1109) • [GitHub](https://github.com/Khushi256)

## License

MIT
