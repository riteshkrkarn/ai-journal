import { google } from "googleapis";
import { supabaseAdmin } from "./supabase";

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/calendar/callback";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  REDIRECT_URI
);

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl(userId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state: userId, // Pass userId in state to identify user after redirect
    prompt: "consent", // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  userId: string
): Promise<any> {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Failed to get tokens from Google");
  }

  // Calculate expiry time
  const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

  // Store tokens in database
  const { error } = await supabaseAdmin.from("calendar_tokens").upsert({
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to store tokens: ${error.message}`);
  }

  return tokens;
}

/**
 * Get valid access token for user (refreshes if expired)
 */
export async function getValidAccessToken(
  userId: string
): Promise<string | null> {
  // Get tokens from database
  const { data, error } = await supabaseAdmin
    .from("calendar_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if token is expired
  const expiresAt = new Date(data.expires_at);
  const now = new Date();

  // If token still valid (with 5 min buffer), return it
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return data.access_token;
  }

  // Token expired, refresh it
  oauth2Client.setCredentials({
    refresh_token: data.refresh_token,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("Failed to refresh token");
    }

    // Update database with new token
    const newExpiresAt = new Date(
      Date.now() + (credentials.expiry_date || 3600 * 1000)
    );

    await supabaseAdmin
      .from("calendar_tokens")
      .update({
        access_token: credentials.access_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return credentials.access_token;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return null;
  }
}

/**
 * Check if user has connected Google Calendar
 */
export async function hasCalendarAccess(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("calendar_tokens")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  return !!data;
}

/**
 * Revoke calendar access (disconnect)
 */
export async function revokeCalendarAccess(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("calendar_tokens")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to revoke access: ${error.message}`);
  }
}
