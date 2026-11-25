import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, BookOpen, Target, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "./Navbar";

interface SpecimenCase {
  id: string;
  label: string;
  userPrompt: string;
  aiReply: string;
  toolName: string;
  recordTitle: string;
  recordMeta: string;
  timestamp: string;
}

const SPECIMEN_CASES: SpecimenCase[] = [
  {
    id: "journal",
    label: "Daily Reflection",
    userPrompt:
      "Today I finished the auth system and deployed the API to production.",
    aiReply:
      "Saved to your journal under engineering milestones and indexed for semantic search.",
    toolName: "saveEntry",
    recordTitle: "Auth system shipped to production",
    recordMeta: "768-dim vector indexed · Personal Journal",
    timestamp: "18:42",
  },
  {
    id: "goal",
    label: "Goal Extraction",
    userPrompt:
      "I want to complete 15 DSA topics before December 31st.",
    aiReply:
      "Created your goal with a Dec 31 deadline. Mention your progress anytime and I will track it.",
    toolName: "setGoal",
    recordTitle: "Complete 15 DSA topics",
    recordMeta: "Active Goal · Due Dec 31",
    timestamp: "18:44",
  },
  {
    id: "search",
    label: "Semantic Recall",
    userPrompt: "When did I work on the calendar integration?",
    aiReply:
      "Found your Oct 11 entry: Built Google Calendar OAuth callback and event scheduling routes.",
    toolName: "searchEntries",
    recordTitle: "Oct 11 · Calendar OAuth",
    recordMeta: "Matched by meaning · 0.91 similarity",
    timestamp: "18:45",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [activeCaseId, setActiveCaseId] = useState<string>("journal");

  const activeCase =
    SPECIMEN_CASES.find((item) => item.id === activeCaseId) ?? SPECIMEN_CASES[0];

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero: Asymmetric thesis + interactive specimen */}
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
            {/* Left thesis column */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 lg:pr-6"
            >
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.06] text-balance">
                Just talk. Your journal organizes itself.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                ReflectIQ is a conversational journal that listens to natural
                language and decides what to do—saving reflections, extracting
                deadlines into goals, and recalling past entries by meaning.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => navigate("/auth")}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-7 h-12 rounded-lg"
                >
                  Start Journaling
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  onClick={() => navigate("/about")}
                  variant="outline"
                  size="lg"
                  className="border-border bg-card text-foreground hover:bg-secondary font-medium px-7 h-12 rounded-lg"
                >
                  How It Works
                </Button>
              </div>

              {/* Hairline capability index */}
              <div className="mt-12 border-t border-border divide-y divide-border">
                <div className="flex items-start gap-4 py-4">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between w-full gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      Autonomous Entries
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Daily thoughts are captured without forms or tags.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 py-4">
                  <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between w-full gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      Semantic Recall
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Search past work by meaning via 768-dim vectors.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 py-4">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between w-full gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      Goals & Team Spaces
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Deadlines become tracked goals; teams share context live.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right specimen column */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5"
            >
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Specimen header & selector */}
                <div className="border-b border-border bg-secondary/50 px-4 py-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-muted-foreground">
                    Live Mechanism Preview
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Sample data
                  </span>
                </div>

                {/* Mode tabs */}
                <div className="grid grid-cols-3 border-b border-border bg-background/60">
                  {SPECIMEN_CASES.map((item) => {
                    const selected = item.id === activeCase.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveCaseId(item.id)}
                        className={`px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                          selected
                            ? "border-primary text-foreground bg-card"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* Conversation */}
                <div className="p-5 space-y-4">
                  <div className="flex justify-end">
                    <div className="max-w-[88%] rounded-xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                      {activeCase.userPrompt}
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="max-w-[92%] rounded-xl rounded-bl-sm border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground">
                      <div className="mb-1.5 flex items-center justify-between gap-4">
                        <span className="font-mono text-[11px] font-medium text-primary">
                          ReflectIQ
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                          {activeCase.timestamp}
                        </span>
                      </div>
                      {activeCase.aiReply}
                    </div>
                  </div>
                </div>

                {/* Autonomous Tool Output */}
                <div className="border-t border-border bg-secondary/40 px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Autonomous Action
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 font-mono text-[11px] font-medium text-accent-foreground">
                      <Check className="h-3 w-3" />
                      {activeCase.toolName}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {activeCase.recordTitle}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {activeCase.recordMeta}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Secondary strip: Built for real workflows */}
        <section className="border-t border-border bg-card/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Natural Scheduling</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Connect Google Calendar once and schedule events directly from
                  your conversation without switching tabs.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Target className="h-4 w-4 text-primary" />
                  <span>Progress Through Reflection</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Goals stay connected to your daily writing. Ask how a goal is
                  going and get a timeline of every relevant entry.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Shared Team Memory</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Create or join a team with an invite code to share journal
                  updates, collaborate in real time, and track team goals.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>ReflectIQ — Conversational AI Journal</span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="hover:text-foreground transition-colors"
            >
              Architecture & Team
            </button>
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="hover:text-foreground transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
