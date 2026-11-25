import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  BookOpen,
  Target,
  Users,
  Calendar,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  PanelRight,
  Circle,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TeamSpace from "./TeamSpace";
import GoalsPage from "./GoalsPage";
import CalendarPage from "./CalendarPage";
import { logout } from "../utils/auth";
import { API_BASE_URL, WS_BASE_URL } from "../config/env";
import { ThemeToggle } from "../components/ThemeToggle";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
  isTyping?: boolean;
  isError?: boolean;
  isSystem?: boolean;
}

interface ContextGoal {
  id: string;
  title: string;
  deadline?: string;
  completed: boolean;
}

interface ContextTeam {
  id: string;
  name: string;
}

const STARTER_PROMPTS = [
  "Today I shipped the authentication flow and cleaned up the API routes.",
  "I want to finish 15 system design topics by the end of next month.",
  "What did I work on last week regarding calendar integration?",
];

const ChatBot: React.FC = () => {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showContextRail, setShowContextRail] = useState(true);
  const [currentPage, setCurrentPage] = useState<
    "chat" | "team" | "goals" | "calendar"
  >("chat");
  const [isConnected, setIsConnected] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);

  const [contextGoals, setContextGoals] = useState<ContextGoal[]>([]);
  const [contextTeams, setContextTeams] = useState<ContextTeam[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const authFailedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchLiveContext = useCallback(async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return;

    try {
      setLoadingContext(true);
      const [goalsRes, teamsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/goals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setContextGoals(goalsData.goals || []);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setContextTeams(teamsData.teams || []);
      }
    } catch (error) {
      console.error("[CONTEXT] Failed to fetch live context:", error);
    } finally {
      setLoadingContext(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveContext();
  }, [fetchLiveContext]);

  const simulateTyping = (text: string, messageId: number) => {
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
    }, 35);
  };

  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem("jwt_token");

      if (!token) {
        navigate("/auth", { replace: true });
        return;
      }

      const ws = new WebSocket(`${WS_BASE_URL}/ws`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "auth", token }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "auth") {
            if (data.status === "authenticated") {
              setIsConnected(true);
              reconnectAttemptsRef.current = 0;
              authFailedRef.current = false;

              setMessages((prev) => {
                const hasConnectionMessage = prev.some(
                  (msg) =>
                    msg.isSystem && msg.text === "Connected to AI Assistant"
                );
                if (hasConnectionMessage) return prev;

                return [
                  ...prev,
                  {
                    id: Date.now(),
                    text: "Connected to AI Assistant",
                    isUser: false,
                    isSystem: true,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                ];
              });
            }
          } else if (data.type === "message") {
            setIsWaitingResponse(false);
            const newMessage: Message = {
              id: Date.now(),
              text: data.content,
              isUser: false,
              timestamp: data.timestamp
                ? new Date(data.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
            };

            setMessages((prev) => [
              ...prev,
              { ...newMessage, text: "", isTyping: true },
            ]);
            simulateTyping(data.content, newMessage.id);
            fetchLiveContext();
          } else if (data.type === "error") {
            setIsWaitingResponse(false);

            if (
              data.message?.includes("authenticated") ||
              data.message?.includes("token")
            ) {
              authFailedRef.current = true;
              navigate("/auth", { replace: true });
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: data.message || "An error occurred",
                isUser: false,
                isError: true,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
          }
        } catch (error) {
          console.error("[WS] Failed to parse message:", error);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);

        if (authFailedRef.current) {
          navigate("/auth", { replace: true });
          return;
        }

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000
          );

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: `Connection lost. Reconnecting (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`,
              isUser: false,
              isSystem: true,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);

          reconnectTimeoutRef.current = window.setTimeout(
            connectWebSocket,
            delay
          );
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: "Connection failed after multiple attempts. Please refresh the page.",
              isUser: false,
              isError: true,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [navigate, fetchLiveContext]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
      if (window.innerWidth < 1280) {
        setShowContextRail(false);
      } else {
        setShowContextRail(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sendText = (rawText: string) => {
    if (rawText.trim() === "" || !isConnected || isWaitingResponse) return;

    const userMessage = rawText.trim();

    const newMessage: Message = {
      id: Date.now(),
      text: userMessage,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsWaitingResponse(true);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          message: userMessage,
        })
      );
    } else {
      setIsWaitingResponse(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Not connected to server. Please wait...",
          isUser: false,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  };

  const handleSendMessage = () => {
    sendText(inputMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const navigateToPage = (page: "chat" | "team" | "goals" | "calendar") => {
    setCurrentPage(page);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleBackToChat = () => {
    setCurrentPage("chat");
    fetchLiveContext();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (currentPage === "team") {
    return <TeamSpace onBack={handleBackToChat} />;
  }

  if (currentPage === "goals") {
    return <GoalsPage onBack={handleBackToChat} />;
  }

  if (currentPage === "calendar") {
    return <CalendarPage onBack={handleBackToChat} />;
  }

  const activeGoals = contextGoals.filter((g) => !g.completed).slice(0, 4);
  const completedCount = contextGoals.filter((g) => g.completed).length;

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden">
      {/* Left Navigation Rail */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200`}
      >
        {/* Brand */}
        <div className="h-14 px-4 border-b border-sidebar-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-img.png"
              alt="ReflectIQ mark"
              className="h-6 w-6 rounded object-contain"
            />
            <span className="font-display text-base font-bold tracking-tight text-sidebar-foreground">
              ReflectIQ
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => navigateToPage("chat")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border text-sm font-medium text-foreground shadow-2xs"
          >
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Journal / Chat</span>
          </button>

          <button
            type="button"
            onClick={() => navigateToPage("goals")}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <span className="flex items-center gap-3 truncate">
              <Target className="h-4 w-4 shrink-0" />
              <span>Goals</span>
            </span>
            {contextGoals.length > 0 && (
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {activeGoals.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateToPage("team")}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <span className="flex items-center gap-3 truncate">
              <Users className="h-4 w-4 shrink-0" />
              <span>Team Space</span>
            </span>
            {contextTeams.length > 0 && (
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {contextTeams.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateToPage("calendar")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate">Calendar</span>
          </button>
        </nav>

        {/* Bottom Account Controls */}
        <div className="p-3 border-t border-sidebar-border space-y-1 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="truncate">Settings</span>
          </button>

          <div className="pt-1 flex items-center gap-2">
            <ThemeToggle className="flex-1 justify-center" />
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Center Conversation Stage */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-base font-semibold text-foreground truncate">
              Personal Journal
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium ${
                isConnected
                  ? "border-border bg-background text-foreground"
                  : "border-warning/30 bg-warning/10 text-warning"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isConnected ? "bg-success" : "bg-warning animate-pulse"
                }`}
              />
              {isConnected ? "Connected" : "Connecting"}
            </span>

            <button
              type="button"
              onClick={() => setShowContextRail(!showContextRail)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showContextRail
                  ? "border-primary/40 bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Toggle live context panel"
            >
              <PanelRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Context</span>
            </button>
          </div>
        </header>

        {/* Stream + Right Context Rail */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Messages Column */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              {messages.length === 0 ? (
                <div className="mx-auto flex h-full max-w-xl flex-col justify-center">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    What is on your mind today?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Write naturally. ReflectIQ saves journal entries, creates
                    goals from deadlines, and searches your history by meaning.
                  </p>

                  <div className="mt-6 space-y-2">
                    <p className="font-mono text-[11px] font-medium text-muted-foreground">
                      Try starting with
                    </p>
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setInputMessage(prompt)}
                        className="w-full text-left rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground hover:border-primary/50 hover:bg-secondary/40 transition-colors"
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-5">
                  {messages.map((message) => {
                    if (message.isSystem) {
                      return (
                        <div
                          key={message.id}
                          className="flex items-center justify-center py-1"
                        >
                          <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 font-mono text-[11px] text-muted-foreground">
                            {message.text} · {message.timestamp}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[78%] ${
                            message.isUser ? "items-end" : "items-start"
                          } flex flex-col`}
                        >
                          {!message.isUser && (
                            <div className="mb-1.5 flex items-center gap-2">
                              <span className="font-mono text-[11px] font-medium text-primary">
                                {message.isError ? "Error" : "ReflectIQ"}
                              </span>
                              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                                {message.timestamp}
                              </span>
                            </div>
                          )}

                          <div
                            className={`rounded-xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                              message.isUser
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : message.isError
                                ? "border border-destructive/30 bg-destructive/10 text-destructive rounded-bl-sm"
                                : "border border-border bg-card text-foreground rounded-bl-sm shadow-2xs"
                            }`}
                          >
                            {message.text}
                            {message.isTyping && (
                              <span className="ml-1 inline-block h-4 w-0.5 bg-primary align-middle animate-pulse" />
                            )}
                          </div>

                          {message.isUser && (
                            <span className="mt-1 font-mono text-[11px] text-muted-foreground tabular-nums">
                              {message.timestamp}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isWaitingResponse && (
                    <div className="flex justify-start">
                      <div className="rounded-xl rounded-bl-sm border border-border bg-card px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            Thinking
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border bg-card/80 px-4 py-3.5 sm:px-6 shrink-0">
              <div className="mx-auto flex max-w-3xl items-center gap-2.5">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isConnected
                      ? "Write a reflection, goal, or question..."
                      : "Connecting to assistant..."
                  }
                  disabled={!isConnected || isWaitingResponse}
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={
                    !inputMessage.trim() || !isConnected || isWaitingResponse
                  }
                  aria-label="Send message"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Context Rail */}
          {showContextRail && (
            <aside className="hidden lg:flex w-80 border-l border-border bg-sidebar/50 flex-col overflow-y-auto p-4 space-y-6 shrink-0">
              {/* Active Goals */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-sm font-semibold text-foreground">
                    Active Goals
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigateToPage("goals")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View all
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>

                {loadingContext ? (
                  <p className="text-xs text-muted-foreground">Loading goals...</p>
                ) : activeGoals.length === 0 ? (
                  <div className="rounded-lg border border-border bg-card p-3.5 text-xs text-muted-foreground">
                    No active goals yet. Mention a deadline in chat to create
                    one automatically.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeGoals.map((goal) => (
                      <div
                        key={goal.id}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-start gap-2">
                          <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground leading-snug">
                              {goal.title}
                            </p>
                            {goal.deadline && (
                              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                Due{" "}
                                {new Date(goal.deadline).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {completedCount > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <span className="tabular-nums">
                          {completedCount} completed
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Teams */}
              <section className="border-t border-border pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-sm font-semibold text-foreground">
                    Teams
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigateToPage("team")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Open
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>

                {loadingContext ? (
                  <p className="text-xs text-muted-foreground">Loading teams...</p>
                ) : contextTeams.length === 0 ? (
                  <div className="rounded-lg border border-border bg-card p-3.5 text-xs text-muted-foreground">
                    No teams yet. Open Team Space to create or join one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contextTeams.slice(0, 3).map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => navigateToPage("team")}
                        className="w-full flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-left text-xs font-medium text-foreground hover:border-primary/50 transition-colors"
                      >
                        <span className="truncate">{team.name}</span>
                        <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Natural Commands Reference */}
              <section className="border-t border-border pt-5">
                <h2 className="font-display text-sm font-semibold text-foreground mb-2.5">
                  What you can say
                </h2>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="rounded-lg border border-border bg-card p-2.5">
                    <span className="font-medium text-foreground block">
                      Save a reflection
                    </span>
                    "Today I wrapped up the database migration."
                  </li>
                  <li className="rounded-lg border border-border bg-card p-2.5">
                    <span className="font-medium text-foreground block">
                      Track a deadline
                    </span>
                    "I need to finish the API docs by Friday."
                  </li>
                  <li className="rounded-lg border border-border bg-card p-2.5">
                    <span className="font-medium text-foreground block">
                      Search by meaning
                    </span>
                    "When did I last work on OAuth?"
                  </li>
                </ul>
              </section>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
