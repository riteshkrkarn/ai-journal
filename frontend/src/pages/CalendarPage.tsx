import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL } from "../config/env";

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
          // Poll for connection status after opening OAuth
          setTimeout(() => checkCalendarStatus(), 2000);
        }
      }
    } catch (error) {
      console.error("[CALENDAR] Connect error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
              Google Calendar
            </h1>
            <p className="text-sm text-gray-400">
              Manage your calendar connection
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-gray-700 border-t-[#4BBEBB] rounded-full"></div>
            </div>
          </div>
        ) : connected ? (
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Calendar Connected</h2>
            <p className="text-gray-400 mb-6">
              Your Google Calendar is connected and ready to use. You can now
              add events through chat with your AI assistant.
            </p>
            <p className="text-sm text-gray-500">
              💡 Try saying things like "Add a meeting tomorrow at 2pm" in chat
            </p>
          </div>
        ) : (
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Calendar Not Connected</h2>
            <p className="text-gray-400 mb-6">
              Connect your Google Calendar to add events through chat with your
              AI assistant.
            </p>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#4BBEBB]/20 transition-all"
            >
              Connect to Google Calendar
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-gradient-to-r from-[#016BFF]/10 to-[#4BBEBB]/10 border border-[#4BBEBB]/30 rounded-xl p-6">
          <p className="text-sm text-gray-300">
            <span className="font-semibold">ℹ️ Info:</span> Your calendar
            connection is secure and uses OAuth. You can disconnect at any time
            from your settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
