import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
  isTyping?: boolean;
  isError?: boolean;
  isSystem?: boolean;
  isToolCall?: boolean;
  toolName?: string;
  toolResult?: unknown;
}

interface TeamChatProps {
  teamId: string;
  teamName: string;
}

const TeamChat: React.FC<TeamChatProps> = ({ teamId, teamName }) => {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
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

  // WebSocket connection setup
  useEffect(() => {
    const connectWebSocket = () => {
      const token = getToken();

      if (!token) {
        console.error("[TEAM-WS] No token found, redirecting to auth");
        navigate("/auth", { replace: true });
        return;
      }

      console.log(`[TEAM-WS] Connecting to team ${teamId}...`);
      const ws = new WebSocket("ws://localhost:3000/team-chat");

      ws.onopen = () => {
        console.log("[TEAM-WS] Connection opened, sending auth");
        // Send authentication with teamId
        ws.send(JSON.stringify({ type: "auth", token, teamId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[TEAM-WS] Received:", data.type);

          if (data.type === "auth") {
            if (data.status === "authenticated") {
              console.log("[TEAM-WS] Authenticated successfully");
              setIsConnected(true);
              reconnectAttemptsRef.current = 0;
              authFailedRef.current = false;

              // Add system message
              setMessages((prev) => {
                const hasConnectionMessage = prev.some(
                  (msg) =>
                    msg.isSystem &&
                    msg.text === `Connected to ${teamName} team chat`
                );

                if (hasConnectionMessage) {
                  return prev;
                }

                return [
                  ...prev,
                  {
                    id: Date.now(),
                    text: `Connected to ${teamName} team chat`,
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
          } else if (data.type === "thinking") {
            // AI is thinking
            setIsWaitingResponse(false);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: "AI is thinking...",
                isUser: false,
                isTyping: true,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
          } else if (data.type === "response") {
            // Remove "thinking" message and add actual response
            setMessages((prev) => {
              const filtered = prev.filter((msg) => !msg.isTyping);
              return [
                ...filtered,
                {
                  id: Date.now(),
                  text: data.content,
                  isUser: false,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ];
            });
          } else if (data.type === "tool-call") {
            // Show tool being called
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: `Using tool: ${data.toolName}`,
                isUser: false,
                isToolCall: true,
                toolName: data.toolName,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
          } else if (data.type === "tool-result") {
            // Show tool result
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: `Tool result: ${JSON.stringify(data.result).substring(
                  0,
                  100
                )}...`,
                isUser: false,
                toolResult: data.result,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
          } else if (data.type === "done") {
            setIsWaitingResponse(false);
          } else if (data.type === "error") {
            setIsWaitingResponse(false);
            console.error("[TEAM-WS] Error:", data.message);

            // Check if auth error or membership error
            if (
              data.message?.includes("authenticated") ||
              data.message?.includes("token") ||
              data.message?.includes("not a member")
            ) {
              authFailedRef.current = true;
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  text: data.message || "Access denied",
                  isUser: false,
                  isError: true,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ]);
              // Close connection
              ws.close();
              return;
            }

            // Add error message to chat
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
          console.error("[TEAM-WS] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[TEAM-WS] WebSocket error:", error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("[TEAM-WS] Connection closed");
        setIsConnected(false);

        // Don't reconnect if auth failed
        if (authFailedRef.current) {
          console.log("[TEAM-WS] Auth/membership failed, not reconnecting");
          return;
        }

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `[TEAM-WS] Reconnecting (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );

          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectWebSocket();
          }, 2000 * reconnectAttemptsRef.current);
        } else {
          console.log("[TEAM-WS] Max reconnect attempts reached");
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: "Connection lost. Please refresh the page.",
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

    // Connect when component mounts or teamId changes
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [teamId, teamName, navigate]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsWaitingResponse(true);

    // Send message via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          message: inputMessage,
        })
      );
    }

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B1120]">
      {/* Connection Status */}
      <div className="p-2 border-b border-gray-700 bg-[#0F1729]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <span className="text-xs text-gray-500">Team Chat</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-2">
              Start chatting with your team's AI assistant
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.isUser
                  ? "bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white"
                  : message.isError
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : message.isSystem
                  ? "bg-gray-700/30 text-gray-400 text-sm italic"
                  : message.isToolCall
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : message.isTyping
                  ? "bg-[#1A2942] text-gray-300 flex items-center gap-2"
                  : "bg-[#1A2942] text-white"
              }`}
            >
              {message.isTyping && <Loader2 className="w-4 h-4 animate-spin" />}
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.text}
              </p>
              <p className="text-xs opacity-60 mt-1">{message.timestamp}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-[#0F1729]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isConnected ? "Ask your team's AI assistant..." : "Connecting..."
            }
            disabled={!isConnected || isWaitingResponse}
            className="flex-1 bg-[#1A2942] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4BBEBB] disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected || isWaitingResponse}
            className="bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {isWaitingResponse && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Waiting for response...
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamChat;
