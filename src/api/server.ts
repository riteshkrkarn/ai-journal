import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { createServer } from "http";
import authRoutes from "./routes/auth";
import entriesRoutes from "./routes/entries";
import goalsRoutes from "./routes/goals";
import calendarRoutes from "./routes/calender";
import { setupWebSocket } from "./websocket/websockets.ts";
import aiRoutes from "./routes/ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging (development)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/auth", authRoutes);
app.use("/entries", entriesRoutes);
app.use("/goals", goalsRoutes);
app.use("/calendar", calendarRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Create HTTP server
const server = createServer(app);

// Setup WebSocket
setupWebSocket(server);
app.use("/ai", aiRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`
🚀 AI Journal API Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 HTTP:       http://localhost:${PORT}
🏥 Health:     http://localhost:${PORT}/health
🔐 Auth:       http://localhost:${PORT}/auth/*
📔 Entries:    http://localhost:${PORT}/entries/*
🎯 Goals:      http://localhost:${PORT}/goals/*
📅 Calendar:   http://localhost:${PORT}/calendar/*
💬 WebSocket:  ws://localhost:${PORT}/ws
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
