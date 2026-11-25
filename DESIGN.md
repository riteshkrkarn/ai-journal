# Design System — Studio Index

## Visual Direction

ReflectIQ uses an architectural **Studio Index** visual system: warm mineral paper in daylight by default, paired with a low-glare charcoal-slate evening mode. Hierarchy comes from typography, 1px hairline borders, and disciplined spacing—without emojis, purple gradients, glowing halos, gradient text, or glassmorphic card grids.

## Color Tokens

Defined in `frontend/src/index.css` and toggled via `ThemeContext` (`light` default, `.dark` class on `<html>`):

| Token | Daylight (`:root`) | Evening (`.dark`) | Role |
|---|---|---|---|
| `--background` | `#F5F4F0` | `#0E1013` | Primary page canvas |
| `--card` | `#FFFFFF` | `#16191E` | Elevated sheets, messages, panels |
| `--sidebar` | `#ECEAE3` | `#13161B` | Navigation and context rails |
| `--foreground` | `#141517` | `#F1F2F4` | Primary ink |
| `--muted-foreground` | `#5C5F66` | `#9499A4` | Secondary labels and metadata |
| `--primary` | `#1D4ED8` | `#3B82F6` | Cobalt-ink primary actions & active states |
| `--border` | `#DFDDD4` | `#272B33` | 1px structural hairlines |
| `--success` | `#15803D` | `#22C55E` | Connected status, completed goals |
| `--warning` | `#B45309` | `#F59E0B` | Reconnecting / pending states |
| `--destructive` | `#B91C1C` | `#EF4444` | Errors, overdue deadlines, destructive actions |

## Typography

Loaded in `frontend/index.html`:

- **Display (`--font-display`)**: `Bricolage Grotesque` (500, 600, 700) for headings and brand title.
- **Body (`--font-sans`)**: `Public Sans` (400, 500, 600, 700) for prose, messages, and UI controls.
- **Mono (`--font-mono`)**: `JetBrains Mono` (400, 500) for timestamps, connection badges, invite codes, and `tabular-nums` counters.

## Layout & Surface Conventions

- **Landing (`LandingPage.tsx`)**: Asymmetric two-column opening with an interactive Live Mechanism Preview switching between Daily Reflection, Goal Extraction, and Semantic Recall.
- **Workspace (`ChatBot.tsx`)**: Three-zone layout with a left navigation rail, center conversation stream, and collapsible right live context rail showing active goals, teams, and natural prompt examples.
- **Companion Views (`GoalsPage.tsx`, `CalendarPage.tsx`, `TeamSpace.tsx`, `CreateJoinTeam.tsx`, `Profile.tsx`, `Settings.tsx`)**: Consistent sticky top headers with back navigation, theme toggle, hairline-divided lists, and zero decorative chrome.
