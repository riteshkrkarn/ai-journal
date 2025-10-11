import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import {
  getAuthUrl,
  exchangeCodeForTokens,
  hasCalendarAccess,
  revokeCalendarAccess,
} from "../../services/oauth";
import {
  createCalendarEvent,
  listUpcomingEvents,
} from "../../services/calender";

const router = Router();

/**
 * GET /calendar/connect
 * Get OAuth URL to connect Google Calendar
 */
router.get("/connect", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Check if already connected
    const hasAccess = await hasCalendarAccess(userId);

    if (hasAccess) {
      return res.json({
        message: "Google Calendar already connected",
        connected: true,
      });
    }

    // Generate OAuth URL
    const authUrl = getAuthUrl(userId);

    return res.json({
      message: "Click the URL to authorize Google Calendar",
      authUrl,
      connected: false,
    });
  } catch (error) {
    console.error("Connect calendar error:", error);
    return res.status(500).json({
      error: "Failed to generate authorization URL",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /calendar/callback
 * OAuth callback - exchanges code for tokens
 */
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Authorization Failed</h1>
            <p>Missing authorization code</p>
          </body>
        </html>
      `);
    }

    const userId = state as string;

    if (!userId) {
      return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Authorization Failed</h1>
            <p>Missing user ID</p>
          </body>
        </html>
      `);
    }

    // Exchange code for tokens
    await exchangeCodeForTokens(code, userId);

    return res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 50px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #667eea;
              margin: 0 0 20px 0;
              font-size: 48px;
            }
            p {
              color: #666;
              font-size: 18px;
              line-height: 1.6;
            }
            .success {
              color: #10b981;
              font-size: 24px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅</h1>
            <div class="success">Calendar Connected!</div>
            <p>You can now use calendar features in your AI Journal.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #999;">
              You can close this window.
            </p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Calendar callback error:", error);
    return res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Authorization Failed</h1>
          <p>${error instanceof Error ? error.message : "Unknown error"}</p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /calendar/status
 * Check if user has connected Google Calendar
 */
router.get("/status", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const connected = await hasCalendarAccess(userId);

    return res.json({
      connected,
      message: connected
        ? "Google Calendar is connected"
        : "Google Calendar not connected",
    });
  } catch (error) {
    console.error("Calendar status error:", error);
    return res.status(500).json({
      error: "Failed to check calendar status",
    });
  }
});

/**
 * DELETE /calendar/disconnect
 * Revoke Google Calendar access
 */
router.delete(
  "/disconnect",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      await revokeCalendarAccess(userId);

      return res.json({
        message: "Google Calendar disconnected successfully",
      });
    } catch (error) {
      console.error("Calendar disconnect error:", error);
      return res.status(500).json({
        error: "Failed to disconnect calendar",
      });
    }
  }
);

/**
 * POST /calendar/events
 * Create a calendar event (for testing, agent will use this internally)
 */
router.post("/events", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, startTime, endTime, location } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "title, startTime, and endTime are required",
      });
    }

    const event = await createCalendarEvent(userId, {
      title,
      description,
      startTime,
      endTime,
      location,
    });

    return res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    return res.status(500).json({
      error: "Failed to create event",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /calendar/events
 * List upcoming events
 */
router.get("/events", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const events = await listUpcomingEvents(userId, limit);

    return res.json({
      events,
      count: events.length,
    });
  } catch (error) {
    console.error("List events error:", error);
    return res.status(500).json({
      error: "Failed to list events",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
