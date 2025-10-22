import { WebSocket } from "ws";
import { teamAgent } from "../../agents/assistant/teamAgent";
import { supabaseAdmin } from "../../services/supabase";

interface TeamConnection {
  ws: WebSocket;
  userId: string;
  teamId: string;
}

// Store active team connections
const teamConnections = new Map<string, TeamConnection>();

/**
 * Handle team WebSocket connections
 */
export function handleTeamWebSocket(ws: WebSocket, request: any) {
  let userId: string | null = null;
  let teamId: string | null = null;
  let runner: any = null;

  console.log("[TEAM WS] New connection attempt");

  ws.on("message", async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      console.log("[TEAM WS] Received:", message);

      // Handle authentication
      if (message.type === "auth") {
        const { token, teamId: requestedTeamId } = message;

        if (!token || !requestedTeamId) {
          ws.send(
            JSON.stringify({
              type: "error",
              error: "Token and teamId are required",
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
                error: "Invalid or expired token",
              })
            );
            return;
          }

          userId = user.id;
          teamId = requestedTeamId;

          console.log(
            `[TEAM WS] Authenticated user ${userId} for team ${teamId}`
          );

          // Initialize team agent
          runner = await teamAgent(userId!, teamId!);

          // Store connection
          const connectionKey = `${userId}-${teamId}`;
          teamConnections.set(connectionKey, {
            ws,
            userId: userId!,
            teamId: teamId!,
          });

          ws.send(JSON.stringify({ type: "authenticated" }));
        } catch (error: any) {
          console.error("[TEAM WS] Auth error:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              error: error.message || "Authentication failed",
            })
          );
          ws.close();
        }
        return;
      }

      // Handle chat messages
      if (message.type === "message") {
        if (!userId || !teamId || !runner) {
          ws.send(
            JSON.stringify({
              type: "error",
              error: "Not authenticated",
            })
          );
          return;
        }

        const userMessage = message.content;

        // Send user message back to confirm receipt
        ws.send(
          JSON.stringify({
            type: "message",
            role: "user",
            content: userMessage,
          })
        );

        try {
          // Stream AI response
          const stream = await runner.stream(userMessage);

          let fullResponse = "";
          for await (const chunk of stream) {
            const text = chunk.content || "";
            fullResponse += text;

            ws.send(
              JSON.stringify({
                type: "stream",
                content: text,
              })
            );
          }

          // Send end marker
          ws.send(
            JSON.stringify({
              type: "stream_end",
              fullMessage: fullResponse,
            })
          );
        } catch (error: any) {
          console.error("[TEAM WS] Stream error:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              error: error.message || "Failed to process message",
            })
          );
        }
        return;
      }
    } catch (error: any) {
      console.error("[TEAM WS] Message handling error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          error: "Failed to process message",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("[TEAM WS] Connection closed");
    if (userId && teamId) {
      const connectionKey = `${userId}-${teamId}`;
      teamConnections.delete(connectionKey);
    }
  });

  ws.on("error", (error) => {
    console.error("[TEAM WS] WebSocket error:", error);
  });
}

/**
 * Setup team WebSocket server
 */
export function setupTeamWebSocket(server: any) {
  const { WebSocketServer } = require("ws");
  const wss = new WebSocketServer({ server, path: "/ws/team" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[TEAM WS] New team connection");
    handleTeamWebSocket(ws, null);
  });

  console.log("[TEAM WS] Team WebSocket server initialized on /ws/team");
}
