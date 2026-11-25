import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import {
  login,
  verifyLoginCode,
  resendLoginCode,
  register as registerUser,
  requestPasswordCode,
  confirmPasswordReset,
  hasAuth,
} from "../utils/auth";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { BrandMark } from "../components/logo";

type SigninFormData = {
  email: string;
  password: string;
};

type SignupFormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthView = "signin" | "signup" | "verify-login" | "reset-password";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>("signin");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);
  const [pendingCreds, setPendingCreds] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [loginCode, setLoginCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password reset state
  const [resetEmail, setResetEmail] = useState("");
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (hasAuth()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((prev) => prev - 1),
      1000
    );
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const signinForm = useForm<SigninFormData>();
  const signupForm = useForm<SignupFormData>();

  const onSigninSubmit: SubmitHandler<SigninFormData> = async (data) => {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const result = await login(data.email, data.password, rememberMe);
      if (result.requiresVerification) {
        setPendingCreds({ email: data.email, password: data.password });
        setLoginCode("");
        setResendCooldown(30);
        setNotice(`We sent a 6-digit verification code to ${data.email}.`);
        setView("verify-login");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCreds) return;

    setError("");
    setNotice("");
    setLoading(true);

    try {
      await verifyLoginCode(
        pendingCreds.email,
        pendingCreds.password,
        loginCode,
        rememberMe
      );
      navigate("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendLoginCode = async () => {
    if (!pendingCreds || resendCooldown > 0) return;
    setError("");
    setNotice("");

    try {
      await resendLoginCode(pendingCreds.email);
      setResendCooldown(30);
      setNotice(`A new verification code was sent to ${pendingCreds.email}.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend code";
      setError(message);
    }
  };

  const onSignupSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const fullName = data.email.split("@")[0];
      await registerUser(data.email, data.password, fullName);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      await requestPasswordCode(resetEmail);
      setResetCodeSent(true);
      setNotice(`Verification code sent to ${resetEmail}.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      await confirmPasswordReset(resetEmail, resetCode, newPassword);
      setNotice("Password updated. You can now sign in with your new password.");
      setResetCodeSent(false);
      setResetCode("");
      setNewPassword("");
      setView("signin");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = (mode: "signin" | "signup") => {
    setView(mode);
    setError("");
    setNotice("");
    signinForm.reset();
    signupForm.reset();
    setShowSigninPassword(false);
    setShowSignupPassword(false);
    setShowConfirmPassword(false);
  };

  const inputClasses =
    "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </button>

        <ThemeToggle compact />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <BrandMark className="h-7 w-7 shrink-0" />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              ReflectIQ
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {view === "signin" && "Sign in to your journal"}
            {view === "signup" && "Create your account"}
            {view === "verify-login" && "Enter verification code"}
            {view === "reset-password" && "Reset your password"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {view === "signin" &&
              "Continue your conversation, goals, and team spaces."}
            {view === "signup" &&
              "Start capturing reflections and goals through natural chat."}
            {view === "verify-login" &&
              "Enter the 6-digit code sent to your email to complete sign in."}
            {view === "reset-password" &&
              "Verify your email with a 6-digit code to set a new password."}
          </p>

          {(view === "signin" || view === "signup") && (
            <div className="mt-6 mb-6 grid grid-cols-2 rounded-lg bg-secondary p-1 border border-border">
              <button
                type="button"
                onClick={() => toggleAuthMode("signin")}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  view === "signin"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => toggleAuthMode("signup")}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  view === "signup"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          {notice && (
            <div className="mt-5 mb-5 rounded-lg border border-border bg-secondary/70 px-3.5 py-2.5 text-sm text-foreground">
              {notice}
            </div>
          )}

          {view === "signin" && (
            <form
              onSubmit={signinForm.handleSubmit(onSigninSubmit)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Email Address"
                  {...signinForm.register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className={inputClasses}
                />
                {signinForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {signinForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-medium text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setNotice("");
                      setResetCodeSent(false);
                      setView("reset-password");
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSigninPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    aria-label="Password"
                    {...signinForm.register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className={`${inputClasses} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSigninPassword(!showSigninPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showSigninPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showSigninPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {signinForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-destructive">
                    {signinForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span>Remember me for 7 days</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending code..." : "Continue"}
              </button>
            </form>
          )}

          {view === "verify-login" && (
            <form onSubmit={handleVerifyLogin} className="space-y-4 mt-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  6-digit verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={loginCode}
                  onChange={(e) =>
                    setLoginCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  required
                  className={`${inputClasses} text-center font-mono text-lg tracking-[0.35em]`}
                />
              </div>

              <button
                type="submit"
                disabled={loading || loginCode.length !== 6}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setView("signin");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to Sign In
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResendLoginCode}
                  className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {view === "reset-password" && (
            <div className="mt-4">
              {!resetCodeSent ? (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Account email
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? "Sending code..." : "Send verification code"}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleConfirmPasswordReset}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      6-digit verification code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) =>
                        setResetCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                      required
                      className={`${inputClasses} text-center font-mono text-lg tracking-[0.35em]`}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
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
                        className={`${inputClasses} pr-10`}
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
                  <button
                    type="submit"
                    disabled={loading || resetCode.length !== 6}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}

              <div className="pt-4 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setView("signin");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {view === "signup" && (
            <form
              onSubmit={signupForm.handleSubmit(onSignupSubmit)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Email Address"
                  {...signupForm.register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className={inputClasses}
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    aria-label="Password"
                    {...signupForm.register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className={`${inputClasses} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showSignupPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showSignupPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-destructive">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    aria-label="Confirm Password"
                    {...signupForm.register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value: string) => {
                        const { password } = signupForm.getValues();
                        return value === password || "Passwords do not match";
                      },
                    })}
                    className={`${inputClasses} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
