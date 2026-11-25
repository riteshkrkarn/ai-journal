import { useNavigate } from "react-router-dom";
import {
  Target,
  Search,
  Calendar,
  Brain,
  MessageSquare,
  Lock,
  ArrowRight,
  Code2,
  Database,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "./Navbar";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FEATURES = [
  {
    icon: Brain,
    title: "Autonomous Journaling",
    description:
      "Auto-detects and saves daily reflections. Chat naturally and the assistant decides which tool to run.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description:
      "Find entries by meaning rather than exact keywords using 768-dimensional vector embeddings.",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description:
      "Creates goals when you mention deadlines and checks progress by analyzing your journal history.",
  },
  {
    icon: Calendar,
    title: "Calendar Integration",
    description:
      "Connect Google Calendar over OAuth and schedule events directly from conversation.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Streaming",
    description:
      "WebSocket connection with live responses, reconnect handling, and team collaboration.",
  },
  {
    icon: Lock,
    title: "Authenticated Spaces",
    description:
      "JWT-backed personal journals and invite-code team spaces with lead-only controls.",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "1",
    title: "Send a natural message",
    detail: "Share a reflection, a deadline, or a question about past work.",
  },
  {
    step: "2",
    title: "Intent & tool selection",
    detail: "Gemini 2.5 Flash evaluates context and picks from 10 autonomous tools.",
  },
  {
    step: "3",
    title: "Structured persistence",
    detail: "Entries are embedded into pgvector, goals are updated, or events are scheduled.",
  },
  {
    step: "4",
    title: "Grounded response",
    detail: "The assistant replies in real time with what was saved or found.",
  },
];

const USAGE_EXAMPLES = [
  {
    title: "Journaling",
    user: "Today I finished the auth system and deployed to production.",
    ai: "Great work! I have saved that to your journal.",
  },
  {
    title: "Goals",
    user: "I want to complete 15 DSA topics by December 31st.",
    ai: "Goal created: Complete 15 DSA topics. You can check it in the Goals page.",
  },
  {
    title: "Semantic Search",
    user: "When did I work on the calendar feature?",
    ai: "October 11th: Built Google Calendar OAuth integration.",
  },
];

const TECH_STACK = [
  {
    icon: Code2,
    category: "Frontend",
    tech: "React 19, TypeScript, Vite, Tailwind CSS, WebSocket",
  },
  {
    icon: Database,
    category: "Backend & Vector Store",
    tech: "Express.js, TypeScript, ws, Supabase PostgreSQL + pgvector",
  },
  {
    icon: Brain,
    category: "AI & Embeddings",
    tech: "IQ AI ADK, Google Gemini 2.5 Flash, text-embedding-004 (768-dim)",
  },
  {
    icon: Lock,
    category: "Auth & Calendar",
    tech: "Supabase Auth, JWT tokens, Google OAuth 2.0",
  },
];

const DEVELOPERS = [
  {
    name: "Ritesh Kumar Karn",
    role: "Backend & AI Services",
    initial: "RK",
    twitter: "https://x.com/riteshkrkarn",
    github: "https://github.com/riteshkrkarn",
  },
  {
    name: "Khushi Mishra",
    role: "Frontend",
    initial: "KM",
    twitter: "https://x.com/Khushim1109",
    github: "https://github.com/Khushi256",
  },
];

function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Header */}
        <section className="max-w-3xl pb-12 border-b border-border">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            How ReflectIQ works
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            ReflectIQ replaces manual forms and folder hierarchies with a single
            conversational stream backed by autonomous tool execution and
            semantic vector search.
          </p>
        </section>

        {/* Capabilities */}
        <section className="py-12 border-b border-border">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-8">
            Core Capabilities
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <feature.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-display text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section className="py-12 border-b border-border">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-8">
            Request Pipeline
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-border bg-card p-5"
              >
                <span className="font-mono text-xs font-medium text-primary">
                  Step {item.step}
                </span>
                <h3 className="mt-2 font-display text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Examples */}
        <section className="py-12 border-b border-border">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-8">
            Conversation Examples
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {USAGE_EXAMPLES.map((example) => (
              <div
                key={example.title}
                className="rounded-xl border border-border bg-card p-5 space-y-4"
              >
                <h3 className="font-display text-base font-semibold text-foreground">
                  {example.title}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-mono text-[11px] text-muted-foreground block mb-1">
                      You
                    </span>
                    <p className="text-foreground leading-relaxed">
                      "{example.user}"
                    </p>
                  </div>
                  <div className="border-t border-border pt-3">
                    <span className="font-mono text-[11px] text-primary block mb-1">
                      ReflectIQ
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      "{example.ai}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-12 border-b border-border">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-8">
            Technical Architecture
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {TECH_STACK.map((item) => (
              <div
                key={item.category}
                className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-5"
              >
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.category}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.tech}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contributors */}
        <section className="py-12 border-b border-border">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-2">
            Contributors
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Built by engineers focused on calm, autonomous personal software.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {DEVELOPERS.map((dev) => (
              <div
                key={dev.name}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary font-mono text-sm font-semibold text-foreground border border-border">
                    {dev.initial}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {dev.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{dev.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={dev.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${dev.name} on X`}
                    className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <XIcon />
                  </a>
                  <a
                    href={dev.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${dev.name} on GitHub`}
                    className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pt-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Ready to try conversational journaling?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in or create an account to open your workspace.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/auth")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-border bg-card text-foreground hover:bg-secondary"
            >
              Home
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default About;
