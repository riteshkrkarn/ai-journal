import { google } from "googleapis";
import { getValidAccessToken } from "./oauth";

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  userId: string,
  event: {
    title: string;
    description?: string;
    startTime: string; // ISO 8601 format
    endTime: string; // ISO 8601 format
    location?: string;
  }
) {
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    throw new Error("Google Calendar not connected. Please authorize first.");
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Fix: Explicitly type the event object and handle undefined properly
  const calendarEvent: {
    summary: string;
    description?: string | null;
    location?: string | null;
    start: {
      dateTime: string;
      timeZone: string;
    };
    end: {
      dateTime: string;
      timeZone: string;
    };
  } = {
    summary: event.title,
    description: event.description || null, // Fix: Convert undefined to null
    location: event.location || null, // Fix: Convert undefined to null
    start: {
      dateTime: event.startTime,
      timeZone: "UTC",
    },
    end: {
      dateTime: event.endTime,
      timeZone: "UTC",
    },
  };

  // Fix: Properly await and type the response
  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: calendarEvent,
  });

  // Fix: Add null checks for response data
  if (!response.data.id || !response.data.htmlLink || !response.data.summary) {
    throw new Error("Failed to create calendar event: incomplete response");
  }

  return {
    id: response.data.id,
    link: response.data.htmlLink,
    title: response.data.summary,
    start: response.data.start?.dateTime || response.data.start?.date || "",
    end: response.data.end?.dateTime || response.data.end?.date || "",
  };
}

/**
 * List upcoming calendar events
 */
export async function listUpcomingEvents(
  userId: string,
  maxResults: number = 10
) {
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    throw new Error("Google Calendar not connected. Please authorize first.");
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items || [];

  return events.map((event) => ({
    id: event.id || "",
    title: event.summary || "Untitled",
    description: event.description || "",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    link: event.htmlLink || "",
  }));
}

/**
 * Parse natural language date/time to ISO format
 * Helper for agent to convert "tomorrow at 3pm" to ISO
 */
export function parseDateTime(
  dateStr: string,
  timeStr: string = "9:00am" // Fix: Provide default value
): { start: string; end: string } {
  const now = new Date();

  // Handle relative dates
  let targetDate = new Date();

  if (dateStr.toLowerCase().includes("today")) {
    targetDate = now;
  } else if (dateStr.toLowerCase().includes("tomorrow")) {
    targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // YYYY-MM-DD format
    targetDate = new Date(dateStr);
  } else {
    // Try parsing as is
    targetDate = new Date(dateStr);
  }

  // Parse time (default 9am if not specified)
  let hours = 9;
  let minutes = 0;

  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      hours = parseInt(timeMatch[1]!);
      minutes = timeMatch[3] ? parseInt(timeMatch[3]) : 0;

      if (timeMatch[4]?.toLowerCase() === "pm" && hours < 12) {
        hours += 12;
      } else if (timeMatch[4]?.toLowerCase() === "am" && hours === 12) {
        hours = 0;
      }
    }
  }

  targetDate.setHours(hours, minutes, 0, 0);

  // Default 1 hour duration
  const startTime = targetDate.toISOString();
  const endDate = new Date(targetDate.getTime() + 60 * 60 * 1000);
  const endTime = endDate.toISOString();

  return { start: startTime, end: endTime };
}
