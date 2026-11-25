import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Circle, Info } from "lucide-react";
import { API_BASE_URL } from "../config/env";
import { ThemeToggle } from "../components/ThemeToggle";

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
}

interface GoalsPageProps {
  onBack?: () => void;
}

const GoalsPage: React.FC<GoalsPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");
  const [myGoals, setMyGoals] = useState<Goal[]>([]);
  const [teamGoals, setTeamGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasTeams, setHasTeams] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jwt_token");

      const myRes = await fetch(`${API_BASE_URL}/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (myRes.ok) {
        const data = await myRes.json();
        setMyGoals(data.goals || []);
      }

      const teamsRes = await fetch(`${API_BASE_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        if (teamsData.teams && teamsData.teams.length > 0) {
          setHasTeams(true);
          const firstTeam = teamsData.teams[0];

          const teamGoalsRes = await fetch(
            `${API_BASE_URL}/goals/team/${firstTeam.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (teamGoalsRes.ok) {
            const teamGoalsData = await teamGoalsRes.json();
            setTeamGoals(teamGoalsData.goals || []);
          }
        } else {
          setHasTeams(false);
          setActiveTab("my");
        }
      }
    } catch (error) {
      console.error("[GOALS] Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (deadline: string) => {
    return Boolean(deadline) && new Date(deadline) < new Date();
  };

  const goalsToDisplay = activeTab === "my" ? myGoals : teamGoals;
  const stats = {
    total: goalsToDisplay.length,
    completed: goalsToDisplay.filter((g) => g.completed).length,
    active: goalsToDisplay.filter((g) => !g.completed).length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Back to chat"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
                Goals
              </h1>
              <p className="text-xs text-muted-foreground">
                Track personal and team commitments
              </p>
            </div>
          </div>

          <ThemeToggle compact />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {/* Segmented Tabs */}
        <div className="mb-6 flex items-center gap-1 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "my"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Personal Goals
          </button>
          {hasTeams && (
            <button
              type="button"
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "team"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Team Goals
            </button>
          )}
        </div>

        {/* Summary Strip */}
        {!loading && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Total</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground tabular-nums">
                {stats.total}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Active</p>
              <p className="mt-1 font-display text-2xl font-bold text-primary tabular-nums">
                {stats.active}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Completed
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-success tabular-nums">
                {stats.completed}
              </p>
            </div>
          </div>
        )}

        {/* Goals List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : goalsToDisplay.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="font-display text-base font-semibold text-foreground">
              {activeTab === "my" ? "No personal goals yet" : "No team goals yet"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {activeTab === "my"
                ? "Mention a deadline in your journal chat and ReflectIQ will create a goal automatically."
                : "Team leads can create shared goals directly from Team Space."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {goalsToDisplay.map((goal) => {
              const overdue = isOverdue(goal.deadline) && !goal.completed;
              return (
                <div
                  key={goal.id}
                  className="flex items-start gap-3.5 p-4 sm:p-5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {goal.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3
                        className={`text-sm font-semibold ${
                          goal.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {goal.title}
                      </h3>
                      {goal.deadline && (
                        <span
                          className={`font-mono text-xs tabular-nums ${
                            overdue
                              ? "font-medium text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {overdue ? "Overdue · " : "Due "}
                          {formatDate(goal.deadline)}
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Guidance Note */}
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Goals are managed through natural conversation. Ask ReflectIQ in
            chat to create a goal, check progress against your journal entries,
            or mark a goal complete.
          </p>
        </div>
      </main>
    </div>
  );
};

export default GoalsPage;
