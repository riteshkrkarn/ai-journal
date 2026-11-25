# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individuals and small teams who want to capture daily reflections, track personal or shared goals, and schedule commitments through natural conversation rather than filling out forms or managing folders.

## Product Purpose

ReflectIQ is an AI-powered conversational journal that autonomously decides what to do from natural language. Users chat naturally—sharing daily experiences, mentioning deadlines, asking about past work, or coordinating with a team—and the assistant automatically saves journal entries (with 768-dimensional semantic embeddings), creates and tracks goals, searches past entries by meaning, and schedules calendar events.

## Positioning

"No buttons—just chat naturally." Unlike manual note-taking apps, habit trackers, or form-heavy productivity suites, ReflectIQ keeps the conversation as the primary input while surfacing structured context (active goals, team spaces, calendar) cleanly alongside it.

## Operating Context

Used across both daytime desk/team sessions and quiet evening reflection, requiring a versatile daylight-first interface with an intentional dark mode toggle. The main workspace stays chat-first while surfacing live context (connection status, active goals, recent context, team access) cleanly beside the conversation.

## Capabilities and Constraints

- **Autonomous Journaling & Semantic Search:** Express + WebSocket (`/ws`) backend with Gemini 2.5 Flash and `text-embedding-004` (768-dim pgvector).
- **Goals:** Personal and team goals (`/goals`, `/goals/team/:teamId`) with completion status and deadlines.
- **Team Collaboration:** Create/join teams (`/teams`, `/teams/:teamId/members`), real-time team chat, team goals (lead-only), and team info panel.
- **Calendar:** Google Calendar integration (`react-big-calendar` in `CalendarPage`).
- **Auth:** JWT-based authentication (`/auth` login and signup, stored in `localStorage` as `jwt_token`).
- **Hard aesthetic constraints:** Zero emojis anywhere in UI chrome or copy, zero purple gradients, zero generic AI slop (no glowing orbs, no gradient text, no glassmorphic card grids).

## Brand Commitments

- Name: **ReflectIQ**
- Existing logo asset: `/logo-img.png` (and `src/assets/landing-page-img.png`).
- Tone: Grounded, calm, editorial precision—honest and direct without hype or gamification.

## Evidence on Hand

- `README.md`: Product overview, 10 autonomous tools, WebSocket flow, usage examples.
- `frontend/src/pages/`: `LandingPage.tsx`, `AuthPage.tsx`, `ChatBot.tsx`, `GoalsPage.tsx`, `CalendarPage.tsx`, `TeamSpace.tsx`, `CreateJoinTeam.tsx`, `About.tsx`, `Profile.tsx`, `Settings.tsx`.

## Product Principles

1. **Conversation is the primary input:** Never force forms where natural language already works; keep structured views (goals, calendar, teams) as quiet, scannable companions.
2. **Daylight clarity, evening calm:** Warm daylight paper-like ground by default, with a true low-glare dark mode toggle that shares the same typographic and structural discipline.
3. **Real functional honesty:** Preserve every API call, WebSocket handler, auth flow, and route; never invent fake metrics or unverified claims.
4. **Restraint over ornament:** Typography, spacing, and hairline structure carry hierarchy—no glowing halos, gradient text, or emoji decoration.
