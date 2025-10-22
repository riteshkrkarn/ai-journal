import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

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

      // Fetch personal goals
      const myRes = await fetch("http://localhost:3000/goals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (myRes.ok) {
        const data = await myRes.json();
        console.log("[GOALS] Personal goals:", data.goals);
        setMyGoals(data.goals || []);
      } else {
        console.error("[GOALS] Failed to fetch personal goals:", myRes.status);
      }

      // Get user's teams first
      const teamsRes = await fetch("http://localhost:3000/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        console.log("[GOALS] Teams data:", teamsData);
        if (teamsData.teams && teamsData.teams.length > 0) {
          setHasTeams(true);
          const firstTeam = teamsData.teams[0];
          console.log("[GOALS] First team:", firstTeam);

          // Fetch team goals for first team
          const teamGoalsRes = await fetch(
            `http://localhost:3000/goals/team/${firstTeam.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (teamGoalsRes.ok) {
            const teamGoalsData = await teamGoalsRes.json();
            console.log("[GOALS] Team goals:", teamGoalsData.goals);
            setTeamGoals(teamGoalsData.goals || []);
          } else {
            console.error(
              "[GOALS] Failed to fetch team goals:",
              teamGoalsRes.status
            );
          }
        } else {
          console.log("[GOALS] No teams found");
          setHasTeams(false);
          setActiveTab("my");
        }
      } else {
        console.error("[GOALS] Failed to fetch teams:", teamsRes.status);
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
    return new Date(deadline) < new Date() && deadline;
  };

  const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => (
    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/60 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {goal.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold ${
              goal.completed ? "line-through text-gray-500" : "text-white"
            }`}
          >
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-sm text-gray-400 mt-1">{goal.description}</p>
          )}
          {goal.deadline && (
            <p
              className={`text-xs mt-2 ${
                isOverdue(goal.deadline) && !goal.completed
                  ? "text-red-400 font-semibold"
                  : "text-gray-500"
              }`}
            >
              {isOverdue(goal.deadline) && !goal.completed
                ? "Overdue: "
                : "Due: "}
              {formatDate(goal.deadline)}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const goalsToDisplay = activeTab === "my" ? myGoals : teamGoals;
  const stats = {
    total: goalsToDisplay.length,
    completed: goalsToDisplay.filter((g) => g.completed).length,
    active: goalsToDisplay.filter((g) => !g.completed).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
              Goals
            </h1>
            <p className="text-sm text-gray-400">
              Track your personal and team goals
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800/50">
          <button
            onClick={() => setActiveTab("my")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "my"
                ? "border-b-2 border-[#4BBEBB] text-[#4BBEBB]"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            My Goals
          </button>
          {hasTeams && (
            <button
              onClick={() => setActiveTab("team")}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === "team"
                  ? "border-b-2 border-[#4BBEBB] text-[#4BBEBB]"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Team Goals
            </button>
          )}
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.completed}
              </p>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
            </div>
          </div>
        )}

        {/* Goals List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-gray-700 border-t-[#4BBEBB] rounded-full"></div>
            </div>
          </div>
        ) : goalsToDisplay.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {activeTab === "my"
                ? "No personal goals yet. Create one through chat!"
                : "No team goals yet. Only leads can create team goals."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goalsToDisplay.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-gradient-to-r from-[#016BFF]/10 to-[#4BBEBB]/10 border border-[#4BBEBB]/30 rounded-xl p-6">
          <p className="text-sm text-gray-300">
            <span className="font-semibold">💡 Tip:</span> Goals are created
            through chat with the AI. Ask to{" "}
            <span className="text-[#4BBEBB]">create a goal</span> or{" "}
            <span className="text-[#4BBEBB]">mark a goal complete</span>. Team
            leads can manage team goals.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
