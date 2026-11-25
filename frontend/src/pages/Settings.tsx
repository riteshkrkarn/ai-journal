import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Lock,
  Mail,
  Key,
  Database,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  getProfile,
  requestPasswordCode,
  confirmPasswordReset,
} from "../utils/auth";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("Loading...");

  // Change password with verification code state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    getProfile()
      .then((data) => {
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        }
      })
      .catch(() => {
        setUserEmail("Unknown");
      });
  }, []);

  const handleSendPasswordCode = async () => {
    if (!userEmail || userEmail === "Loading..." || userEmail === "Unknown") {
      setPwError("Unable to determine your account email.");
      return;
    }

    setPwError("");
    setPwSuccess("");
    setPwLoading(true);
    try {
      await requestPasswordCode(userEmail);
      setCodeSent(true);
    } catch (err) {
      setPwError(
        err instanceof Error ? err.message : "Failed to send verification code"
      );
    } finally {
      setPwLoading(false);
    }
  };

  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setPwLoading(true);

    try {
      await confirmPasswordReset(userEmail, code, newPassword);
      setPwSuccess("Password updated successfully.");
      setIsChangingPassword(false);
      setCodeSent(false);
      setCode("");
      setNewPassword("");
    } catch (err) {
      setPwError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setPwLoading(false);
    }
  };

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

        {/* Security */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-primary" />
            Security
          </h2>

          {pwSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{pwSuccess}</span>
            </div>
          )}

          {!isChangingPassword ? (
            <button
              type="button"
              onClick={() => {
                setPwError("");
                setPwSuccess("");
                setIsChangingPassword(true);
              }}
              className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3.5 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Change Password
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Verify with a 6-digit email code to set a new password
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </button>
          ) : (
            <div className="rounded-lg border border-border bg-background p-4 space-y-4">
              {pwError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {pwError}
                </div>
              )}

              {!codeSent ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    We will send a 6-digit verification code to{" "}
                    <span className="font-medium text-foreground">
                      {userEmail}
                    </span>
                    .
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendPasswordCode}
                      disabled={pwLoading}
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {pwLoading ? "Sending..." : "Send Verification Code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(false)}
                      className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleConfirmPasswordChange}
                  className="space-y-3"
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      6-digit verification code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                      required
                      className="w-full rounded-lg border border-input bg-card px-3 py-2 font-mono text-sm tracking-[0.25em] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        minLength={6}
                        required
                        className="w-full rounded-lg border border-input bg-card px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showNewPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={pwLoading || code.length !== 6}
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {pwLoading ? "Updating..." : "Update Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCodeSent(false);
                      }}
                      className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
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
