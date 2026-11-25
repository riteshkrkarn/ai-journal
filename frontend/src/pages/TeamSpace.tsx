import React, { useState, useEffect, useRef } from "react";
import { Send, Search, MoreVertical, ArrowLeft, Users } from "lucide-react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import TeamInfoPanel from "../components/TeamInfoPanel";
import { API_BASE_URL, WS_BASE_URL } from "../config/env";

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
  isTyping?: boolean;
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
  const wsRef = useRef<WebSocket | null>(null); // Use ref instead of state
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");

  // Fetch teams from API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);

        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/teams`, {
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
                `${API_BASE_URL}/teams/${team.id}/members`,
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
    if (!selectedTeam?.id) {
      console.log("[Team Chat] No team selected, skipping connection");
      return;
    }

    console.log("[Team Chat] Setting up WebSocket for team:", selectedTeam.id);

    // Create WebSocket connection (same endpoint as personal chat)
    const websocket = new WebSocket(`${WS_BASE_URL}/ws`);
    let streamBuffer = ""; // Local buffer for streaming messages

    websocket.onopen = () => {
      console.log("[Team Chat] Connected");

      // Authenticate with team context
      const token = getToken();
      if (!token) {
        console.error("[Team Chat] No auth token available");
        websocket.close();
        return;
      }

      console.log("[Team Chat] Sending auth with teamId:", selectedTeam.id);
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

      if (data.type === "auth" && data.status === "authenticated") {
        setIsConnected(true);
        console.log("[Team WS] Authenticated for team:", selectedTeam.name);
      } else if (data.type === "message") {
        // AI response - use typing effect
        setIsStreaming(false);
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: "ai",
          senderName: "Team Assistant",
          text: data.content,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isCurrentUser: false,
        };

        // Add actual response with typing effect
        setMessages((prev) => [
          ...prev,
          { ...newMessage, text: "", isTyping: true },
        ]);
        simulateTyping(data.content, newMessage.id);
      } else if (data.type === "stream") {
        // AI streaming response
        setIsStreaming(true);
        streamBuffer += data.content;
        setStreamingMessage(streamBuffer);
      } else if (data.type === "stream_end") {
        // Stream complete
        setIsStreaming(false);
        const finalMessage = streamBuffer + data.content;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            senderId: "ai",
            senderName: "Team Assistant",
            text: finalMessage,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isCurrentUser: false,
          },
        ]);
        streamBuffer = "";
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
      wsRef.current = null;
    };

    wsRef.current = websocket;

    // Cleanup on unmount or team change
    return () => {
      console.log("[Team Chat] Cleaning up connection");
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam?.id]); // Only depend on team ID, not the whole object to prevent reconnection loops

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate subtle tonal badge color for avatar
  const getAvatarColor = (email: string): string => {
    const colors = [
      "bg-secondary text-foreground",
      "bg-accent text-accent-foreground",
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

  // Simulate typing effect for AI responses
  const simulateTyping = (text: string, messageId: string) => {
    let currentText = "";
    const words = text.split(" ");
    let wordIndex = 0;

    const typingInterval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? " " : "") + words[wordIndex];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, text: currentText, isTyping: true }
              : msg
          )
        );
        wordIndex++;
      } else {
        clearInterval(typingInterval);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isTyping: false } : msg
          )
        );
      }
    }, 50);
  };

  // Handle send message
  const handleSendMessage = () => {
    console.log("[Team Chat] handleSendMessage called");
    console.log("[Team Chat] messageInput:", messageInput);
    console.log("[Team Chat] ws:", wsRef.current ? "exists" : "null");
    console.log("[Team Chat] isConnected:", isConnected);
    console.log("[Team Chat] isStreaming:", isStreaming);

    if (messageInput.trim() === "") {
      console.log("[Team Chat] Message is empty, returning");
      return;
    }
    if (!wsRef.current) {
      console.log("[Team Chat] WebSocket is null, returning");
      return;
    }
    if (!isConnected) {
      console.log("[Team Chat] Not connected, returning");
      return;
    }
    if (isStreaming) {
      console.log("[Team Chat] Already streaming, returning");
      return;
    }

    const userMessage = messageInput.trim();
    console.log("[Team Chat] Sending message:", userMessage);

    // Add user message to UI immediately
    setMessages((prev) => {
      console.log("[Team Chat] Adding message to UI");
      return [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: "user",
          senderName: "You",
          text: userMessage,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isCurrentUser: true,
        },
      ];
    });

    // Send message through WebSocket
    try {
      console.log("[Team Chat] Sending via WebSocket...");
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          message: userMessage,
        })
      );
      console.log("[Team Chat] Message sent successfully");
    } catch (error) {
      console.error("[Team Chat] Error sending message:", error);
    }

    setMessageInput("");
    setIsStreaming(true); // Expect AI response
    console.log("[Team Chat] handleSendMessage complete");
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
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="h-6 w-6 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  // Show empty state when no teams
  if (!loading && teams.length === 0) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center p-4 relative">
        <div className="text-center max-w-md rounded-xl border border-border bg-card p-8">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="absolute top-4 left-4 rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-secondary text-primary flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            No Teams Yet
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            You have not joined any teams. Create a new team or join an existing
            one with an invite code.
          </p>
          <button
            type="button"
            onClick={() => navigate("/create-join-team")}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Create or Join Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      {/* Left Sidebar - Teams List */}
      <aside
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-full sm:w-80 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200`}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Back to journal"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
                Team Space
              </h1>
            </div>
            <button
              type="button"
              onClick={() => navigate("/create-join-team")}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              + New
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Teams List */}
        <div className="flex-1 overflow-y-auto divide-y divide-sidebar-border">
          {filteredTeams.map((team) => {
            const isSelected = selectedTeam?.id === team.id;
            return (
              <div
                key={team.id}
                onClick={() => {
                  setSelectedTeam(team);
                  setShowTeamInfo(false);
                  setShowSidebar(false);
                }}
                className={`p-3.5 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-card text-foreground"
                    : "hover:bg-sidebar-accent/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center font-mono text-xs font-semibold text-foreground shrink-0">
                    {getInitials(team.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {team.name}
                      </h3>
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">
                        {formatTimestamp(team.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {team.members.length} members
                    </p>
                  </div>

                  {team.unreadCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-mono text-[11px] font-medium shrink-0">
                      {team.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-sidebar-border">
          <button
            type="button"
            onClick={() => navigate("/create-join-team")}
            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            Create or Join Team
          </button>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      {selectedTeam && !showTeamInfo && (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <header className="h-14 bg-card/90 border-b border-border flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setShowSidebar(true)}
                className="md:hidden p-1.5 hover:bg-secondary rounded-lg transition-colors shrink-0"
                aria-label="Open teams list"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => setShowTeamInfo(true)}
                className="flex items-center gap-3 text-left hover:bg-secondary/60 rounded-lg px-2 py-1 -ml-2 transition-colors min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center font-mono text-xs font-semibold text-foreground shrink-0">
                  {getInitials(selectedTeam.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-sm font-semibold text-foreground truncate">
                    {selectedTeam.name}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedTeam.members.length} members · Click for info
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowTeamInfo(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Team details"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2 max-w-sm px-4">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    No team journal entries yet
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Share updates with your team or ask the assistant to search
                    team entries and track shared goals.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[85%] sm:max-w-[75%]">
                      {!message.isCurrentUser && (
                        <p className="font-mono text-[11px] text-muted-foreground mb-1">
                          {message.senderName}
                        </p>
                      )}
                      <div
                        className={`rounded-xl px-4 py-3 ${
                          message.isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card border border-border text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed break-words">
                          {message.text}
                          {message.isTyping && (
                            <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
                          )}
                        </p>
                        <p
                          className={`font-mono text-[11px] mt-1.5 tabular-nums ${
                            message.isCurrentUser
                              ? "text-primary-foreground/75"
                              : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isStreaming && !streamingMessage && (
                  <div className="flex justify-start">
                    <div className="rounded-xl rounded-bl-sm border border-border bg-card px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        Team Assistant is thinking...
                      </span>
                    </div>
                  </div>
                )}

                {isStreaming && streamingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-xl rounded-bl-sm border border-border bg-card px-4 py-3 text-foreground">
                      <p className="text-sm leading-relaxed break-words">
                        {streamingMessage}
                        <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="bg-card/90 border-t border-border p-3.5 sm:p-4 shrink-0">
            {!isConnected && (
              <div className="max-w-3xl mx-auto mb-2">
                <p className="font-mono text-[11px] text-warning">
                  Connecting to team chat...
                </p>
              </div>
            )}
            <div className="max-w-3xl mx-auto flex gap-2.5">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  isConnected
                    ? "Ask AI to save journals, search entries, or set team goals..."
                    : "Connecting..."
                }
                disabled={!isConnected || isStreaming}
                className="flex-1 bg-background border border-input rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!messageInput.trim() || !isConnected || isStreaming}
                aria-label="Send team message"
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
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
