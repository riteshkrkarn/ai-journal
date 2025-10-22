import React, { useState, useEffect } from "react";
import { ArrowLeft, Eye, Copy, Crown, Trash2, Check } from "lucide-react";
import { getToken } from "../utils/auth";
import { API_BASE_URL } from "../config/env";

// Types
interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: "lead" | "member";
  avatar?: string;
  joinedAt: Date;
  status: "active" | "pending";
}

interface Team {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  members: TeamMember[];
}

interface TeamInfoPanelProps {
  selectedTeam: Team;
  showTeamInfo: boolean;
  setShowTeamInfo: (show: boolean) => void;
  isAddingMember: boolean;
  setIsAddingMember: (adding: boolean) => void;
  getInitials: (name: string) => string;
  getAvatarColor: (email: string) => string;
  handleRemoveMember: (memberId: string) => void;
}

const TeamInfoPanel: React.FC<TeamInfoPanelProps> = ({
  selectedTeam,
  showTeamInfo,
  setShowTeamInfo,
  isAddingMember,
  setIsAddingMember,
  getInitials,
  getAvatarColor,
  handleRemoveMember,
}) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loadingInviteCode, setLoadingInviteCode] = useState(false);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCurrentUserLead, setIsCurrentUserLead] = useState(false);

  // Check if current user is lead
  useEffect(() => {
    const checkIfLead = () => {
      const token = getToken();
      if (!token) return;

      try {
        // Decode JWT to get user ID
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentUserId = payload.sub;

        // Check if current user is the lead
        const leadMember = selectedTeam.members.find((m) => m.role === "lead");
        setIsCurrentUserLead(leadMember?.id === currentUserId);
      } catch (error) {
        console.error("Failed to check user role:", error);
      }
    };

    checkIfLead();
  }, [selectedTeam]);

  // Fetch invite code when showing invite section
  useEffect(() => {
    const fetchInviteCode = async () => {
      if (!isAddingMember || !isCurrentUserLead) return;

      setLoadingInviteCode(true);
      setInviteCodeError(null);

      try {
        const token = getToken();
        const response = await fetch(
          `${API_BASE_URL}/teams/${selectedTeam.id}/invite-code`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch invite code");
        }

        const data = await response.json();
        setInviteCode(data.inviteCode);
      } catch (error) {
        console.error("Error fetching invite code:", error);
        setInviteCodeError("Failed to load invite code");
      } finally {
        setLoadingInviteCode(false);
      }
    };

    fetchInviteCode();
  }, [isAddingMember, isCurrentUserLead, selectedTeam.id]);

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!selectedTeam || !showTeamInfo) return null;

  return (
    <div className="flex-1 bg-[#1a1a1a]/80 backdrop-blur-xl flex flex-col overflow-y-auto">
      {/* Info Header */}
      <div className="p-4 sm:p-6 bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-gray-800/50">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => setShowTeamInfo(false)}
            className="p-1.5 sm:p-2 hover:bg-gray-800/50 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
            Team Info
          </h2>
        </div>

        {/* Team Avatar & Name */}
        <div className="text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] flex items-center justify-center text-white font-bold text-xl sm:text-2xl mb-3 sm:mb-4">
            {getInitials(selectedTeam.name)}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {selectedTeam.name}
          </h3>
          <p className="text-sm sm:text-base text-gray-400 mb-3">
            {selectedTeam.members.length} members
          </p>

          {/* Team Invite Code - Only visible to leads */}
          {isCurrentUserLead && (
            <div className="mt-4 space-y-3">
              {!isAddingMember ? (
                <button
                  onClick={() => setIsAddingMember(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg font-medium transition-all text-sm border border-gray-700/50 mx-auto"
                >
                  <Eye className="w-4 h-4" />
                  Show Team Code
                </button>
              ) : (
                <div className="bg-gradient-to-r from-[#016BFF]/10 to-[#4BBEBB]/10 border-2 border-[#4BBEBB]/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400">Team Invite Code</p>
                    <button
                      onClick={() => setIsAddingMember(false)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Hide
                    </button>
                  </div>
                  {loadingInviteCode ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4BBEBB]"></div>
                    </div>
                  ) : inviteCodeError ? (
                    <p className="text-red-400 text-xs text-center py-2">
                      {inviteCodeError}
                    </p>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <code className="text-2xl sm:text-3xl text-white font-mono font-bold tracking-[0.3em]">
                        {inviteCode || "------"}
                      </code>
                      <button
                        onClick={handleCopyInviteCode}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                  {copied && (
                    <p className="text-green-400 text-xs text-center animate-pulse mt-1">
                      Copied!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
          Members ({selectedTeam.members.length})
        </h3>

        <div className="space-y-2 sm:space-y-3">
          {selectedTeam.members.map((member) => (
            <div
              key={member.id}
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 sm:p-4 hover:bg-gray-800/60 transition-all"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Avatar */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r ${getAvatarColor(
                    member.email
                  )} flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0`}
                >
                  {getInitials(member.name)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h4 className="text-white font-semibold text-xs sm:text-sm truncate">
                      {member.name}
                    </h4>
                    {member.role === "lead" && (
                      <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded-md">
                        <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 flex-shrink-0" />
                        <span className="text-[10px] sm:text-xs font-semibold text-yellow-500">
                          Lead
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs truncate">
                    {member.email}
                  </p>
                </div>

                {/* Remove button - Only visible to leads and only for non-lead members */}
                {isCurrentUserLead && member.role !== "lead" && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1 sm:p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamInfoPanel;
