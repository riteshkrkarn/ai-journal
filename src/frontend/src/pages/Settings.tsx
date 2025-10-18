import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Lock, 
  Shield,
  Database,
  Download,
  Trash2,
  Mail,
  Key,
  Chrome
} from "lucide-react";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail] = useState("user@example.com"); // Get from auth context

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 font-['Inter',sans-serif] overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#016BFF] rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4BBEBB] rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: #000000;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #2a2a2a;
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-gray-800/50 px-6 py-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
              Settings
            </h1>
            <div className="w-20"></div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto scrollbar-custom p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Account Section */}
            <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#4BBEBB]" />
                Account
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-xl">
                  <Mail className="w-5 h-5 text-[#4BBEBB]" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-white font-medium">{userEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Authentication Section */}
            <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#4BBEBB]" />
                Authentication
              </h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-gray-400 group-hover:text-[#4BBEBB]" />
                    <div className="text-left">
                      <h3 className="text-white font-medium">Change Password</h3>
                      <p className="text-sm text-gray-400">Update your account password</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <Chrome className="w-5 h-5 text-gray-400 group-hover:text-[#4BBEBB]" />
                    <div className="text-left">
                      <h3 className="text-white font-medium">Google OAuth</h3>
                      <p className="text-sm text-gray-400">Manage Google account connection</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </button>

                <div className="p-4 bg-gray-800/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-[#4BBEBB]" />
                    <h3 className="text-white font-medium">Security</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Your account is secured with JWT-based authentication and Supabase Auth. 
                    All sessions are encrypted and automatically expire for your protection.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#4BBEBB]" />
                Data Management
              </h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-gray-400 group-hover:text-[#4BBEBB]" />
                    <div className="text-left">
                      <h3 className="text-white font-medium">Export Data</h3>
                      <p className="text-sm text-gray-400">Download your journal entries and goals</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </button>

                <div className="p-4 bg-gray-800/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-5 h-5 text-[#4BBEBB]" />
                    <h3 className="text-white font-medium">Database</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Your data is stored securely in Supabase PostgreSQL with pgvector for semantic search. 
                    All entries are encrypted and backed up automatically.
                  </p>
                </div>

                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-red-900/30 transition-all group border border-transparent hover:border-red-500/30">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
                    <div className="text-left">
                      <h3 className="text-white group-hover:text-red-400 font-medium">Delete Account</h3>
                      <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-red-400 rotate-180" />
                </button>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">About ReflectIQ</h2>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]"></div>
                  <span>Version 1.0.0</span>
                </div>
                <p className="leading-relaxed">
                  AI-powered journal that autonomously decides what to do based on your conversation. 
                  No buttons—just chat naturally.
                </p>
                <div className="pt-2 space-y-2">
                  <p className="text-white font-medium">Tech Stack:</p>
                  <ul className="space-y-1 pl-4">
                    <li>• React 18, TypeScript, Vite, Tailwind CSS</li>
                    <li>• Express.js, WebSocket, Supabase PostgreSQL</li>
                    <li>• Google Gemini 2.5 Flash, text-embedding-004</li>
                    <li>• Supabase Auth, JWT tokens, Google OAuth 2.0</li>
                  </ul>
                </div>
                <div className="flex gap-4 pt-4">
                  <a href="#" className="text-[#4BBEBB] hover:underline">Privacy Policy</a>
                  <a href="#" className="text-[#4BBEBB] hover:underline">Terms of Service</a>
                  <a href="https://github.com/riteshkrkarn/ai-journal" target="_blank" rel="noopener noreferrer" className="text-[#4BBEBB] hover:underline">GitHub</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
