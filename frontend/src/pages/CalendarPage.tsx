import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  Info,
} from "lucide-react";
import { API_BASE_URL } from "../config/env";
import { ThemeToggle } from "../components/ThemeToggle";

interface CalendarPageProps {
  onBack?: () => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ onBack }) => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCalendarStatus();
  }, []);

  const checkCalendarStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jwt_token");

      const res = await fetch(`${API_BASE_URL}/calendar/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
      }
    } catch (error) {
      console.error("[CALENDAR] Status check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem("jwt_token");

      const res = await fetch(`${API_BASE_URL}/calendar/connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.open(data.authUrl, "_blank");
          setTimeout(() => checkCalendarStatus(), 2000);
        }
      }
    } catch (error) {
      console.error("[CALENDAR] Connect error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Back to chat"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
                Google Calendar
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage your calendar integration
              </p>
            </div>
          </div>

          <ThemeToggle compact />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : connected ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Calendar Connected
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Your Google Calendar is connected. You can schedule and review
              events directly through conversation with ReflectIQ.
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Example: "Add a design review meeting tomorrow at 2pm"
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Calendar Not Connected
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Connect your Google Calendar via OAuth so ReflectIQ can schedule
              events when you mention dates and times in chat.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Connect Google Calendar
            </button>
          </div>
        )}

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your calendar connection uses standard Google OAuth 2.0. You can
            review or revoke access anytime from Settings.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;
