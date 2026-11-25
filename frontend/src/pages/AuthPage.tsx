import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { login, register, hasAuth } from "../utils/auth";
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

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSignin, setIsSignin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (hasAuth()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const signinForm = useForm<SigninFormData>();
  const signupForm = useForm<SignupFormData>();

  const onSigninSubmit: SubmitHandler<SigninFormData> = async (data) => {
    setError("");
    setLoading(true);

    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onSignupSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setError("");
    setLoading(true);

    try {
      const fullName = data.email.split("@")[0];
      await register(data.email, data.password, fullName);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = (mode: "signin" | "signup") => {
    setIsSignin(mode === "signin");
    setError("");
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
      {/* Minimal top bar */}
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

      {/* Centered auth sheet */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <BrandMark className="h-7 w-7 shrink-0" />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              ReflectIQ
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {isSignin ? "Sign in to your journal" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isSignin
              ? "Continue your conversation, goals, and team spaces."
              : "Start capturing reflections and goals through natural chat."}
          </p>

          {/* Segmented mode switch */}
          <div className="mt-6 mb-6 grid grid-cols-2 rounded-lg bg-secondary p-1 border border-border">
            <button
              type="button"
              onClick={() => toggleAuthMode("signin")}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                isSignin
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
                !isSignin
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          {isSignin ? (
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
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Password
                </label>
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

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          ) : (
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
