import React, { useState, useEffect } from "react";
import {
  Mail,
  X,
  UserPlus,
  Trash2,
  Crown,
  Send,
  Search,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

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

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isCurrentUser: boolean;
}

// Add props interface for TeamSpace component
interface TeamSpaceProps {
  onBack?: () => void;
}

const TeamSpace: React.FC<TeamSpaceProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamInfo, setShowTeamInfo] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "2",
      senderName: "Sarah Smith",
      text: "Hey team! How is everyone doing?",
      timestamp: "10:15 AM",
      isCurrentUser: false,
    },
    {
      id: "2",
      senderId: "1",
      senderName: "You",
      text: "Doing great! Working on the new features.",
      timestamp: "10:20 AM",
      isCurrentUser: true,
    },
    {
      id: "3",
      senderId: "3",
      senderName: "Mike Johnson",
      text: "Let's schedule a meeting to discuss the roadmap",
      timestamp: "10:30 AM",
      isCurrentUser: false,
    },
  ]);

  // Fetch teams from API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);

        const token = getToken();
        const response = await fetch("http://localhost:3000/teams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }

        const data = await response.json();

        // Fetch members for each team
        const teamsWithMembers = await Promise.all(
          data.teams.map(
            async (team: { id: string; name: string; created_at: string }) => {
              const membersResponse = await fetch(
                `http://localhost:3000/teams/${team.id}/members`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const membersData = await membersResponse.json();

              return {
                id: team.id,
                name: team.name,
                lastMessage: "No messages yet",
                timestamp: new Date(team.created_at).toLocaleDateString(),
                unreadCount: 0,
                members: membersData.members.map(
                  (member: {
                    user_id: string;
                    email: string;
                    full_name: string;
                    role: string;
                    joined_at: string;
                  }) => ({
                    id: member.user_id,
                    email: member.email || "No email",
                    name:
                      member.full_name ||
                      member.email?.split("@")[0] ||
                      "Unknown",
                    role: member.role || "member",
                    joinedAt: new Date(member.joined_at),
                    status: "active",
                  })
                ),
              };
            }
          )
        );

        setTeams(teamsWithMembers);
        if (teamsWithMembers.length > 0) {
          setSelectedTeam(teamsWithMembers[0]);
        }
      } catch (err) {
        console.error("Error fetching teams:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate color for avatar
  const getAvatarColor = (email: string): string => {
    const colors = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-green-500 to-teal-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Handle send message
  const handleSendMessage = () => {
    if (messageInput.trim() === "") return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "1",
      senderName: "You",
      text: messageInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isCurrentUser: true,
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  // Add email to pending list
  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (selectedTeam) {
      const emailExists =
        selectedTeam.members.some((member) => member.email === email) ||
        pendingEmails.includes(email);

      if (emailExists) {
        alert("This email is already added");
        return;
      }
    }

    setPendingEmails([...pendingEmails, email]);
    setEmailInput("");
  };

  // Remove email from pending list
  const handleRemovePendingEmail = (email: string) => {
    setPendingEmails(pendingEmails.filter((e) => e !== email));
  };

  // Send invites
  const handleSendInvites = () => {
    if (pendingEmails.length === 0 || !selectedTeam) return;

    const newMembers: TeamMember[] = pendingEmails.map((email, index) => ({
      id: Date.now().toString() + index,
      email: email,
      name: email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      role: "member",
      joinedAt: new Date(),
      status: "pending",
    }));

    const updatedTeams = teams.map((team) =>
      team.id === selectedTeam.id
        ? { ...team, members: [...team.members, ...newMembers] }
        : team
    );

    setTeams(updatedTeams);
    setSelectedTeam({
      ...selectedTeam,
      members: [...selectedTeam.members, ...newMembers],
    });
    setPendingEmails([]);
    setIsAddingMember(false);

    alert(`Invites sent to ${newMembers.length} member(s)!`);
  };

  // Remove team member
  const handleRemoveMember = (memberId: string) => {
    if (
      !selectedTeam ||
      !window.confirm("Are you sure you want to remove this member?")
    )
      return;

    const updatedMembers = selectedTeam.members.filter(
      (member) => member.id !== memberId
    );
    const updatedTeams = teams.map((team) =>
      team.id === selectedTeam.id ? { ...team, members: updatedMembers } : team
    );

    setTeams(updatedTeams);
    setSelectedTeam({ ...selectedTeam, members: updatedMembers });
  };

  // Change member role
  const handleChangeRole = (memberId: string, newRole: "admin" | "member") => {
    if (!selectedTeam) return;

    const updatedMembers = selectedTeam.members.map((member) =>
      member.id === memberId ? { ...member, role: newRole } : member
    );

    const updatedTeams = teams.map((team) =>
      team.id === selectedTeam.id ? { ...team, members: updatedMembers } : team
    );

    setTeams(updatedTeams);
    setSelectedTeam({ ...selectedTeam, members: updatedMembers });
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4BBEBB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading teams...</p>
        </div>
      </div>
    );
  }

  // Show empty state when no teams
  if (!loading && teams.length === 0) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-4 left-4 p-2 hover:bg-gray-800/50 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] flex items-center justify-center">
            <UserPlus className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No Teams Yet</h2>
          <p className="text-gray-400 mb-6">
            You haven't joined any teams. Create a new team or join an existing
            one to get started.
          </p>
          <button
            onClick={() => navigate("/create-join-team")}
            className="px-8 py-3 bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            Create or Join Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex font-['Inter',sans-serif] overflow-hidden">
      {/* Left Sidebar - Teams List */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-full sm:w-80 md:w-96 bg-[#1a1a1a]/80 backdrop-blur-xl border-r border-gray-800/50 flex flex-col transition-transform duration-300`}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 sm:p-2 hover:bg-gray-800/50 rounded-lg transition-all"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
                Teams
              </h1>
            </div>
            <button className="p-1.5 sm:p-2 hover:bg-gray-800/50 rounded-lg transition-all">
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4BBEBB]/50"
            />
          </div>
        </div>

        {/* Teams List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              onClick={() => {
                setSelectedTeam(team);
                setShowTeamInfo(false);
                setShowSidebar(false);
              }}
              className={`p-3 sm:p-4 border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/30 transition-all ${
                selectedTeam?.id === team.id ? "bg-gray-800/50" : ""
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Team Avatar */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                  {getInitials(team.name)}
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <h3 className="text-sm sm:text-base text-white font-semibold truncate">
                      {team.name}
                    </h3>
                    <span className="text-xs text-gray-400 ml-2">
                      {team.timestamp}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {team.lastMessage}
                  </p>
                </div>

                {/* Unread Badge */}
                {team.unreadCount > 0 && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                    {team.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      {selectedTeam && !showTeamInfo && (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-14 sm:h-16 bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden p-1.5 sm:p-2 hover:bg-gray-800/50 rounded-lg transition-all flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </button>

              {/* Clickable Avatar and Name Container */}
              <div
                onClick={() => setShowTeamInfo(true)}
                className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-800/30 rounded-lg p-1.5 sm:p-2 -m-1.5 sm:-m-2 transition-all flex-1 min-w-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                  {getInitials(selectedTeam.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base text-white font-semibold truncate">
                    {selectedTeam.name}
                  </h2>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedTeam.members.length} members
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDIpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] bg-gray-900/50">
            <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${
                      message.isCurrentUser
                        ? "ml-4 sm:ml-8 md:ml-12"
                        : "mr-4 sm:mr-8 md:mr-12"
                    }`}
                  >
                    {!message.isCurrentUser && (
                      <p className="text-xs text-gray-400 mb-1 ml-2">
                        {message.senderName}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl p-2.5 sm:p-3 ${
                        message.isCurrentUser
                          ? "bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white"
                          : "bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-white"
                      }`}
                    >
                      <p className="text-xs sm:text-sm leading-relaxed break-words">
                        {message.text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          message.isCurrentUser
                            ? "text-white/70"
                            : "text-gray-500"
                        }`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border-t border-gray-800/50 p-3 sm:p-4">
            <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4BBEBB]/50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 sm:px-6 py-2 sm:py-3 font-semibold transition-all flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Info Panel */}
      {selectedTeam && showTeamInfo && (
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
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
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
      )}
    </div>
  );
};

export default TeamSpace;
