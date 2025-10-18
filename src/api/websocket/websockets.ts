import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { journalAgent } from "../../agents/assistant/journalAgent";
import { teamAgent } from "../../agents/assistant/teamAgent";
import { supabaseAdmin } from "../../services/supabase";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  teamId?: string;
  isAuthenticated?: boolean;
}

export function setupWebSocket(server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: AuthenticatedWebSocket) => {
    console.log("[WS] New connection established");

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("[WS] Received message:", message.type);

        // Handle authentication
        if (message.type === "auth") {
          const { token, teamId } = message;

          if (!token) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Token is required",
              })
            );
            return;
          }

          try {
            // Verify JWT token with Supabase
            const {
              data: { user },
              error,
            } = await supabaseAdmin.auth.getUser(token);

            if (error || !user) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Invalid or expired token",
                })
              );
              return;
            }

            // Store userId and optional teamId in WebSocket connection
            ws.userId = user.id;
            ws.teamId = teamId || undefined;
            ws.isAuthenticated = true;

            const context = teamId ? ` for team ${teamId}` : "";
            console.log(`[WS] User authenticated: ${user.id}${context}`);
            ws.send(
              JSON.stringify({
                type: "auth",
                status: "authenticated",
                userId: user.id,
                teamId: teamId || null,
              })
            );
          } catch (authError: any) {
            console.error("[WS] Auth error:", authError);
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Authentication failed",
              })
            );
          }
          return;
        }

        // Handle chat messages
        if (message.type === "chat") {
          // Check authentication
          if (!ws.isAuthenticated || !ws.userId) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Not authenticated. Send auth message first.",
              })
            );
            return;
          }

          const { message: userMessage } = message;

          if (!userMessage) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Message content is required",
              })
            );
            return;
          }

          const context = ws.teamId ? ` (Team: ${ws.teamId})` : "";
          console.log(`[WS] User ${ws.userId}${context}: ${userMessage}`);

          // Initialize agent based on context (team or personal)
          const { runner } = ws.teamId
            ? await teamAgent(ws.userId, ws.teamId)
            : await journalAgent(ws.userId);

          // Get AI response
          const response = await runner.ask(userMessage);

          console.log(`[WS] Response: ${response.substring(0, 100)}...`);

          // Send response back
          ws.send(
            JSON.stringify({
              type: "message",
              content: response,
              timestamp: new Date().toISOString(),
            })
          );
        }
      } catch (error: any) {
        console.error("[WS] Error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: error.message || "Internal server error",
          })
        );
      }
    });

    ws.on("close", () => {
      console.log(
        `[WS] Connection closed${ws.userId ? ` for user ${ws.userId}` : ""}`
      );
    });

    ws.on("error", (error) => {
      console.error("[WS] WebSocket error:", error);
    });
  });

  console.log("[WS] WebSocket server initialized on /ws");
}
