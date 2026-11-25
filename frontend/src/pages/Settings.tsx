import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Lock,
  Mail,
  Key,
  Database,
  Download,
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail] = useState("user@example.com");

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
              Settings
            </h1>
          </div>

          <ThemeToggle compact />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 space-y-6">
        {/* Account */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            Account
          </h2>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3.5">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{userEmail}</p>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Appearance
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Switch between warm daylight paper and low-glare evening mode.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </section>

        {/* Authentication */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-primary" />
            Security
          </h2>
          <button
            type="button"
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3.5 text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Change Password
                </p>
                <p className="text-xs text-muted-foreground">
                  Update your account password
                </p>
              </div>
            </div>
            <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
          </button>
        </section>

        {/* Data */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-primary" />
            Data
          </h2>
          <button
            type="button"
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3.5 text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Export Journal Data
                </p>
                <p className="text-xs text-muted-foreground">
                  Download your entries and goals
                </p>
              </div>
            </div>
            <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
          </button>
        </section>
      </main>
    </div>
  );
};

export default Settings;
