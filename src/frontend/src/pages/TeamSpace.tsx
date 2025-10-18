import React, { useState, useEffect } from "react";
import { Send, Search, MoreVertical, ArrowLeft, Users } from "lucide-react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import TeamInfoPanel from "../components/TeamInfoPanel";

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
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");

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
                timestamp: team.created_at, // Store ISO string for formatting
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

  // Connect to team WebSocket when a team is selected
  useEffect(() => {
    if (!selectedTeam) {
      // Disconnect if no team selected
      if (ws) {
        ws.close();
        setWs(null);
        setIsConnected(false);
      }
      return;
    }

    // Create WebSocket connection (same endpoint as personal chat)
    const websocket = new WebSocket("ws://localhost:3000/ws");

    websocket.onopen = () => {
      console.log("[Team Chat] Connected");

      // Authenticate with team context
      const token = getToken();
      websocket.send(
        JSON.stringify({
          type: "auth",
          token,
          teamId: selectedTeam.id, // This tells the backend to use team agent
        })
      );
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[Team WS] Received:", data);

      if (data.type === "authenticated") {
        setIsConnected(true);
        console.log("[Team WS] Authenticated for team:", selectedTeam.name);
      } else if (data.type === "message") {
        // User message echo
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            senderId: "user",
            senderName: "You",
            text: data.content,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isCurrentUser: true,
          },
        ]);
      } else if (data.type === "stream") {
        // AI streaming response
        setIsStreaming(true);
        setStreamingMessage((prev) => prev + data.content);
      } else if (data.type === "stream_end") {
        // Stream complete
        setIsStreaming(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            senderId: "ai",
            senderName: "Team Assistant",
            text: streamingMessage + data.content,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isCurrentUser: false,
          },
        ]);
        setStreamingMessage("");
      } else if (data.type === "error") {
        console.error("[Team WS] Error:", data.error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            senderId: "system",
            senderName: "System",
            text: `Error: ${data.error}`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isCurrentUser: false,
          },
        ]);
      }
    };

    websocket.onerror = (error) => {
      console.error("[Team WS] Error:", error);
      setIsConnected(false);
    };

    websocket.onclose = () => {
      console.log("[Team WS] Disconnected");
      setIsConnected(false);
    };

    setWs(websocket);

    // Cleanup on unmount or team change
    return () => {
      websocket.close();
    };
  }, [selectedTeam, ws, streamingMessage]);

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

  // Format timestamp - show time if today, date if older
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();

    // Reset hours/minutes/seconds for date comparison
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const isToday = dateOnly.getTime() === todayOnly.getTime();

    if (isToday) {
      // Show time for today's messages
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      // Show date for older messages
      const yesterday = new Date(todayOnly);
      yesterday.setDate(yesterday.getDate() - 1);

      if (dateOnly.getTime() === yesterday.getTime()) {
        return "Yesterday";
      } else {
        // Show month and day for older messages
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      }
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (messageInput.trim() === "" || !ws || !isConnected) return;

    // Send message through WebSocket
    ws.send(
      JSON.stringify({
        type: "message",
        content: messageInput,
      })
    );

    setMessageInput("");
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
            <Users className="w-12 h-12 text-white" />
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
                      {formatTimestamp(team.timestamp)}
                    </span>
                  </div>
                  {/* <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {team.lastMessage}
                  </p> */}
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

          {/* Create/Join Team Button */}
          <div className="p-3 sm:p-4">
            <button
              onClick={() => navigate("/create-join-team")}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Create or Join Team
            </button>
          </div>
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
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] opacity-20 flex items-center justify-center">
                    <Send className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    No journal entries yet
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto">
                    Start journaling! Write your thoughts and ask the AI to
                    fetch team insights anytime.
                  </p>
                </div>
              </div>
            ) : (
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

                {/* Streaming AI Response */}
                {isStreaming && streamingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] mr-4 sm:mr-8 md:mr-12">
                      <p className="text-xs text-gray-400 mb-1 ml-2">
                        Team Assistant
                      </p>
                      <div className="rounded-2xl p-2.5 sm:p-3 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-white">
                        <p className="text-xs sm:text-sm leading-relaxed break-words">
                          {streamingMessage}
                          <span className="inline-block w-1 h-4 bg-[#4BBEBB] ml-1 animate-pulse"></span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border-t border-gray-800/50 p-3 sm:p-4">
            {/* Connection Status */}
            {!isConnected && (
              <div className="max-w-4xl mx-auto mb-2 text-center">
                <p className="text-xs text-yellow-500">
                  Connecting to team chat...
                </p>
              </div>
            )}
            <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  isConnected
                    ? "Ask AI to save journals, search entries, set goals..."
                    : "Connecting..."
                }
                disabled={!isConnected || isStreaming}
                className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4BBEBB]/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || !isConnected || isStreaming}
                className="bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 sm:px-6 py-2 sm:py-3 font-semibold transition-all flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Info Panel */}
      {selectedTeam && (
        <TeamInfoPanel
          selectedTeam={selectedTeam}
          showTeamInfo={showTeamInfo}
          setShowTeamInfo={setShowTeamInfo}
          isAddingMember={isAddingMember}
          setIsAddingMember={setIsAddingMember}
          getInitials={getInitials}
          getAvatarColor={getAvatarColor}
          handleRemoveMember={handleRemoveMember}
        />
      )}
    </div>
  );
};

export default TeamSpace;
