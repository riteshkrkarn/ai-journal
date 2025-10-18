import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  BookOpen,
  Search,
  Users,
  Calendar,
  User,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TeamSpace from "./TeamSpace";
import GoalsPage from "./GoalsPage";
import CalendarPage from "./CalendarPage";
import { logout } from "../utils/auth";

const Logo: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-10 h-10">
      <img src="/logo-img.png" alt="logo image" />
    </div>
    <span className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
      ReflectIQ
    </span>
  </div>
);

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
  isTyping?: boolean;
  isError?: boolean;
  isSystem?: boolean;
}

const ChatBot: React.FC = () => {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<
    "chat" | "team" | "goals" | "calendar"
  >("chat");
  const [isConnected, setIsConnected] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const authFailedRef = useRef(false); // Track if auth failed to prevent reconnection loops

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection setup
  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem("jwt_token");

      if (!token) {
        console.error("[WS] No token found, redirecting to auth");
        navigate("/auth", { replace: true });
        return;
      }

      console.log("[WS] Connecting to WebSocket...");
      const ws = new WebSocket("ws://localhost:3000/ws");

      ws.onopen = () => {
        console.log("[WS] Connection opened, sending auth");
        ws.send(JSON.stringify({ type: "auth", token }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WS] Received:", data.type);

          if (data.type === "auth") {
            if (data.status === "authenticated") {
              console.log("[WS] Authenticated successfully");
              setIsConnected(true);
              reconnectAttemptsRef.current = 0; // Reset reconnect attempts
              authFailedRef.current = false; // Reset auth failed flag on successful connection

              setMessages((prev) => {
                const hasConnectionMessage = prev.some(
                  (msg) =>
                    msg.isSystem && msg.text === "Connected to AI Assistant"
                );

                if (hasConnectionMessage) {
                  return prev;
                }

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
          } else if (data.type === "error") {
            setIsWaitingResponse(false);
            console.error("[WS] Error:", data.message);

            if (
              data.message?.includes("authenticated") ||
              data.message?.includes("token")
            ) {
              authFailedRef.current = true; // Mark auth as failed to prevent reconnection
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

      ws.onerror = (error) => {
        console.error("[WS] WebSocket error:", error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("[WS] Connection closed");
        setIsConnected(false);

        // If auth failed, don't reconnect - redirect to login instead
        if (authFailedRef.current) {
          console.log(
            "[WS] Auth failed, redirecting to login instead of reconnecting"
          );
          navigate("/auth", { replace: true });
          return;
        }

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000
          );
          console.log(
            `[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: `Connection lost. Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
              isUser: false,
              isSystem: true,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);

          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
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
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    }, 50);
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === "" || !isConnected || isWaitingResponse) return;

    const userMessage = inputMessage.trim();

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
      console.log("[WS] Sent message:", userMessage);
    } else {
      console.error("[WS] WebSocket not connected");
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex font-['Inter',sans-serif] overflow-hidden m-0 p-0">
      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2a2a2a;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #1a1a1a #000000;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Left Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-black/95 md:bg-black/80 backdrop-blur-xl border-r border-gray-800/50 flex flex-col transition-transform duration-300 overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800/50 flex-shrink-0">
          <Logo />
          <p className="text-xs sm:text-sm mt-1 bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
            Your AI Journal & Assistant
          </p>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-hide">
          <button
            onClick={() => navigateToPage("chat")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#016BFF]/10 to-[#4BBEBB]/10 border border-[#4BBEBB]/30 hover:border-[#4BBEBB]/50 transition-all"
          >
            <BookOpen className="w-5 h-5 text-[#4BBEBB] flex-shrink-0" />
            <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] truncate">
              Journal / Chat
            </span>
          </button>

          <button
            onClick={() => navigateToPage("goals")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800/50 transition-all group"
          >
            <Search className="w-5 h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
            <span className="text-sm font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">
              Goal
            </span>
          </button>

          <button
            onClick={() => navigateToPage("team")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800/50 transition-all group"
          >
            <Users className="w-5 h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
            <span className="text-sm font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">
              Team
            </span>
          </button>

          <button
            onClick={() => navigateToPage("calendar")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800/50 transition-all group"
          >
            <Calendar className="w-5 h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
            <span className="text-sm font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">
              Calendar
            </span>
          </button>
        </div>

        {/* Profile and Settings */}
        <div className="p-3 border-t border-gray-800/50 space-y-2 flex-shrink-0">
          <button
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800/50 transition-all group"
          >
            <User className="w-5 h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
            <span className="text-sm font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">
              Profile
            </span>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800/50 transition-all group"
          >
            <Settings className="w-5 h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
            <span className="text-sm font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">
              Settings
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/30 transition-all group border border-transparent hover:border-red-500/30"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-400 group-hover:text-red-400 truncate">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-gray-800/50 flex items-center px-4 flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/50 rounded-lg mr-3"
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] md:hidden">
            ReflectIQ
          </h1>
        </div>

        {/* Messages Area with custom black scrollbar */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {!isConnected && (
            <div className="fixed top-20 right-4 bg-yellow-900/80 text-yellow-200 px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-yellow-500/30 z-50">
              Connecting to server...
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl px-4">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <img src="/logo-img.png" alt="logo" className="w-12 h-12" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
                  Welcome to ReflectIQ
                </h1>
                <p className="text-lg md:text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#4BBEBB] to-[#016BFF]">
                  Your AI Journal & Assistant
                </p>
                <p className="text-gray-400">How can I help you today?</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.isUser ? "ml-12" : "mr-12"
                    }`}
                  >
                    {!message.isUser && (
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.isError
                              ? "bg-red-500/80"
                              : message.isSystem
                              ? "bg-gray-600"
                              : "bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]"
                          }`}
                        >
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          {message.isError
                            ? "Error"
                            : message.isSystem
                            ? "System"
                            : "ReflectIQ"}
                        </span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-4 ${
                        message.isUser
                          ? "bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white"
                          : message.isError
                          ? "bg-red-900/40 backdrop-blur-sm border border-red-500/30 text-red-200"
                          : message.isSystem
                          ? "bg-gray-700/40 backdrop-blur-sm border border-gray-600/30 text-gray-300 italic"
                          : "bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-white"
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {message.text}
                        {message.isTyping && (
                          <span className="inline-block w-0.5 h-4 bg-[#4BBEBB] ml-1 animate-pulse"></span>
                        )}
                      </p>
                    </div>
                    <p
                      className={`text-xs text-gray-600 mt-1 ${
                        message.isUser ? "text-right" : "text-left"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />

              {isWaitingResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] mr-12">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-500">
                        ReflectIQ
                      </span>
                    </div>
                    <div className="rounded-2xl p-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div
                            className="w-2 h-2 bg-[#4BBEBB] rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-[#4BBEBB] rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-[#4BBEBB] rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-400">
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border-t border-gray-800/50 p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected ? "Message ReflectIQ..." : "Connecting..."
              }
              disabled={!isConnected || isWaitingResponse}
              className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-2xl px-6 py-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4BBEBB]/50 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !inputMessage.trim() || !isConnected || isWaitingResponse
              }
              className="bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl px-6 py-4 font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
