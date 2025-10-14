import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { getToken } from "../utils/auth";
import { ArrowLeft, Users } from "lucide-react";

// Types for form data
type CreateTeamFormData = {
  teamName: string;
};

type JoinTeamFormData = {
  teamId: string;
};

const CreateJoinTeam: React.FC = () => {
  const navigate = useNavigate();
  const [isCreate, setIsCreate] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Separate forms for create and join
  const createForm = useForm<CreateTeamFormData>();
  const joinForm = useForm<JoinTeamFormData>();

  const onCreateSubmit: SubmitHandler<CreateTeamFormData> = async (data) => {
    setError("");
    setLoading(true);

    try {
      const token = getToken();
      const response = await fetch("http://localhost:3000/teams", {
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

      // Navigate back to teams page
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
      const response = await fetch(
        `http://localhost:3000/teams/${data.teamId}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to join team");
      }

      // Navigate back to teams page
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
    <div className="h-screen w-full flex items-center justify-center bg-gray-950 p-4 sm:p-6 lg:p-8 font-['Inter',sans-serif] overflow-hidden">
      <div className="w-full max-w-md bg-[#121212] p-8 sm:p-10 rounded-3xl shadow-2xl shadow-[#4BBEBB]/20 border border-gray-800">
        {/* Back Button */}
        <button
          onClick={() => navigate("/teamspace")}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Teams</span>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
          {isCreate ? "Create Team" : "Join Team"}
        </h1>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Toggle Buttons */}
        <div className="flex mb-8 bg-gray-800 p-1 rounded-xl shadow-inner shadow-gray-900/50">
          <button
            type="button"
            onClick={() => toggleMode("create")}
            className={`w-1/2 py-2 text-md font-semibold rounded-lg transition-all duration-300 ${
              isCreate
                ? "bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-black shadow-md shadow-cyan-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => toggleMode("join")}
            className={`w-1/2 py-2 text-md font-semibold rounded-lg transition-all duration-300 ${
              !isCreate
                ? "bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-black shadow-md shadow-cyan-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Join
          </button>
        </div>

        {/* Create Team Form */}
        {isCreate ? (
          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-5"
          >
            {/* Team Name Input */}
            <div>
              <input
                type="text"
                placeholder="Team Name"
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
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4BBEBB] focus:border-transparent outline-none transition duration-200 shadow-inner"
              />
              {createForm.formState.errors.teamName && (
                <p className="text-red-400 text-sm mt-1">
                  {createForm.formState.errors.teamName.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Creating..." : "Create Team"}
            </button>

            <p className="text-gray-400 text-sm text-center mt-4">
              You'll be the owner of this team and can invite members later.
            </p>
          </form>
        ) : (
          /* Join Team Form */
          <form
            onSubmit={joinForm.handleSubmit(onJoinSubmit)}
            className="space-y-5"
          >
            {/* Team ID Input */}
            <div>
              <input
                type="text"
                placeholder="Team ID"
                aria-label="Team ID"
                {...joinForm.register("teamId", {
                  required: "Team ID is required",
                })}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4BBEBB] focus:border-transparent outline-none transition duration-200 shadow-inner"
              />
              {joinForm.formState.errors.teamId && (
                <p className="text-red-400 text-sm mt-1">
                  {joinForm.formState.errors.teamId.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Joining..." : "Join Team"}
            </button>

            <p className="text-gray-400 text-sm text-center mt-4">
              Ask your team admin for the Team ID to join.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateJoinTeam;
