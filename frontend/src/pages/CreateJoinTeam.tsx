import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { getToken } from "../utils/auth";
import { ArrowLeft, Users } from "lucide-react";
import { API_BASE_URL } from "../config/env";
import { ThemeToggle } from "../components/ThemeToggle";

type CreateTeamFormData = {
  teamName: string;
};

type JoinTeamFormData = {
  inviteCode: string;
};

const CreateJoinTeam: React.FC = () => {
  const navigate = useNavigate();
  const [isCreate, setIsCreate] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createForm = useForm<CreateTeamFormData>();
  const joinForm = useForm<JoinTeamFormData>();

  const onCreateSubmit: SubmitHandler<CreateTeamFormData> = async (data) => {
    setError("");
    setLoading(true);

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: data.teamName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create team");
      }

      navigate("/teamspace");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create team failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onJoinSubmit: SubmitHandler<JoinTeamFormData> = async (data) => {
    setError("");
    setLoading(true);

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/teams/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: data.inviteCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to join team");
      }

      navigate("/teamspace");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Join team failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (mode: "create" | "join") => {
    setIsCreate(mode === "create");
    createForm.reset();
    joinForm.reset();
    setError("");
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/teamspace")}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Team Space</span>
        </button>

        <ThemeToggle compact />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <Users className="h-5 w-5" />
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {isCreate ? "Create a team" : "Join a team"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isCreate
              ? "Start a shared journal space and invite teammates with a code."
              : "Enter the 6-character invite code shared by your team lead."}
          </p>

          <div className="mt-6 mb-6 grid grid-cols-2 rounded-lg bg-secondary p-1 border border-border">
            <button
              type="button"
              onClick={() => toggleMode("create")}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                isCreate
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => toggleMode("join")}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                !isCreate
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Join
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          {isCreate ? (
            <form
              onSubmit={createForm.handleSubmit(onCreateSubmit)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Team name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Product Engineering"
                  aria-label="Team Name"
                  {...createForm.register("teamName", {
                    required: "Team name is required",
                    minLength: {
                      value: 3,
                      message: "Team name must be at least 3 characters",
                    },
                    maxLength: {
                      value: 50,
                      message: "Team name must be less than 50 characters",
                    },
                  })}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                {createForm.formState.errors.teamName && (
                  <p className="mt-1 text-xs text-destructive">
                    {createForm.formState.errors.teamName.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Team"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={joinForm.handleSubmit(onJoinSubmit)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Invite code
                </label>
                <input
                  type="text"
                  placeholder="ABC123"
                  aria-label="Invite Code"
                  maxLength={6}
                  {...joinForm.register("inviteCode", {
                    required: "Invite code is required",
                    pattern: {
                      value: /^[A-Z0-9]{6}$/i,
                      message:
                        "Invite code must be 6 characters (letters and numbers)",
                    },
                  })}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-center font-mono text-lg tracking-widest uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                {joinForm.formState.errors.inviteCode && (
                  <p className="mt-1 text-xs text-destructive">
                    {joinForm.formState.errors.inviteCode.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Joining..." : "Join Team"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJoinTeam;
