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
    <div className="flex-1 bg-background text-foreground flex flex-col overflow-y-auto">
      {/* Info Header */}
      <div className="p-4 sm:p-6 bg-card border-b border-border">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setShowTeamInfo(false)}
            className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Back to team chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-display text-lg font-bold text-foreground">
            Team Info
          </h2>
        </div>

        {/* Team Avatar & Name */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-xl bg-secondary border border-border flex items-center justify-center font-mono text-lg font-bold text-foreground mb-3">
            {getInitials(selectedTeam.name)}
          </div>
          <h3 className="font-display text-xl font-bold text-foreground mb-1">
            {selectedTeam.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {selectedTeam.members.length} members
          </p>

          {/* Team Invite Code - Only visible to leads */}
          {isCurrentUserLead && (
            <div className="mt-4 max-w-sm mx-auto">
              {!isAddingMember ? (
                <button
                  type="button"
                  onClick={() => setIsAddingMember(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors text-xs border border-border"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Show Invite Code
                </button>
              ) : (
                <div className="bg-secondary/50 border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[11px] text-muted-foreground">
                      Team Invite Code
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddingMember(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Hide
                    </button>
                  </div>
                  {loadingInviteCode ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-border border-t-primary" />
                    </div>
                  ) : inviteCodeError ? (
                    <p className="text-destructive text-xs text-center py-2">
                      {inviteCodeError}
                    </p>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <code className="text-2xl text-foreground font-mono font-bold tracking-[0.25em]">
                        {inviteCode || "------"}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyInviteCode}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                  {copied && (
                    <p className="text-success text-xs text-center mt-1">
                      Copied to clipboard
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 p-4 sm:p-6 max-w-2xl w-full mx-auto">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">
          Members ({selectedTeam.members.length})
        </h3>

        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {selectedTeam.members.map((member) => (
            <div
              key={member.id}
              className="p-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-lg border border-border flex items-center justify-center font-mono text-xs font-semibold shrink-0 ${getAvatarColor(
                  member.email
                )}`}
              >
                {getInitials(member.name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-foreground font-semibold text-sm truncate">
                    {member.name}
                  </h4>
                  {member.role === "lead" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-accent-foreground rounded-md font-mono text-[10px] font-medium">
                      <Crown className="w-3 h-3 shrink-0" />
                      Lead
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs truncate">
                  {member.email}
                </p>
              </div>

              {isCurrentUserLead && member.role !== "lead" && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  aria-label={`Remove ${member.name}`}
                  className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamInfoPanel;
