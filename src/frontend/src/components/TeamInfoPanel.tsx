import React from "react";
import {
  ArrowLeft,
  UserPlus,
  X,
  Eye,
  EyeOff,
  Copy,
  Mail,
  Crown,
  Trash2,
} from "lucide-react";

// Types
interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member";
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
  showTeamCode: boolean;
  setShowTeamCode: (show: boolean) => void;
  emailInput: string;
  setEmailInput: (email: string) => void;
  pendingEmails: string[];
  setPendingEmails: (emails: string[]) => void;
  getInitials: (name: string) => string;
  getAvatarColor: (email: string) => string;
  handleAddEmail: () => void;
  handleRemovePendingEmail: (email: string) => void;
  handleSendInvites: () => void;
  handleChangeRole: (memberId: string, newRole: "admin" | "member") => void;
  handleRemoveMember: (memberId: string) => void;
}

const TeamInfoPanel: React.FC<TeamInfoPanelProps> = ({
  selectedTeam,
  showTeamInfo,
  setShowTeamInfo,
  isAddingMember,
  setIsAddingMember,
  showTeamCode,
  setShowTeamCode,
  emailInput,
  setEmailInput,
  pendingEmails,
  setPendingEmails,
  getInitials,
  getAvatarColor,
  handleAddEmail,
  handleRemovePendingEmail,
  handleSendInvites,
  handleChangeRole,
  handleRemoveMember,
}) => {
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
          <p className="text-sm sm:text-base text-gray-400">
            {selectedTeam.members.length} members
          </p>
        </div>
      </div>

      {/* Add Member Section */}
      <div className="p-4 sm:p-6 border-b border-gray-800/50">
        {!isAddingMember ? (
          <button
            onClick={() => setIsAddingMember(true)}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white rounded-xl font-semibold hover:opacity-90 transition-all text-sm sm:text-base"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Team Members
          </button>
        ) : (
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
                Invite Members
              </h3>
              <button
                onClick={() => {
                  setIsAddingMember(false);
                  setPendingEmails([]);
                  setShowTeamCode(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Team Code Section */}
            <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-700/50">
              <p className="text-xs sm:text-sm text-gray-400 mb-2">
                Share this code with your team members to join
              </p>
              {!showTeamCode ? (
                <button
                  onClick={() => setShowTeamCode(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Show Team Code
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-gray-800/80 px-3 py-2.5 rounded-lg border border-gray-700/50">
                    <code className="flex-1 text-xs sm:text-sm text-[#4BBEBB] font-mono truncate">
                      {selectedTeam?.id}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTeam?.id || "");
                        // You can add a toast notification here
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowTeamCode(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all text-sm"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide Team Code
                  </button>
                </div>
              )}
            </div>

            {/* Email Input */}
            <div className="flex gap-2 mb-3 sm:mb-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
                  placeholder="Enter email..."
                  className="w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4BBEBB]/50"
                />
              </div>
              <button
                onClick={handleAddEmail}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all text-xs sm:text-sm"
              >
                Add
              </button>
            </div>

            {/* Pending Emails */}
            {pendingEmails.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <p className="text-xs text-gray-400 mb-2">
                  Pending ({pendingEmails.length})
                </p>
                <div className="space-y-2">
                  {pendingEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between bg-gray-800/60 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg"
                    >
                      <span className="text-xs sm:text-sm text-white truncate">
                        {email}
                      </span>
                      <button
                        onClick={() => handleRemovePendingEmail(email)}
                        className="text-red-400 hover:text-red-300 transition-colors ml-2"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Send Invites */}
            {pendingEmails.length > 0 && (
              <button
                onClick={handleSendInvites}
                className="w-full py-1.5 sm:py-2 bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white rounded-lg font-semibold hover:opacity-90 transition-all text-xs sm:text-sm"
              >
                Send {pendingEmails.length} Invite
                {pendingEmails.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}
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
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
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
                    {member.role === "owner" && (
                      <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                    )}
                    {member.status === "pending" && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-500 px-1.5 sm:px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs truncate">
                    {member.email}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {member.role !== "owner" && (
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleChangeRole(
                        member.id,
                        e.target.value as "admin" | "member"
                      )
                    }
                    className="flex-1 bg-gray-700 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4BBEBB]/50"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1 sm:p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamInfoPanel;
