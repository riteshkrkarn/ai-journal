import { Router } from "express";
import type { Request, Response } from "express";
import { supabaseAdmin } from "../../services/supabase";
import { authenticate } from "../middleware/auth";
import { renderTemplate } from "../utils/templateRenderer";
import { createOtp, verifyOtpCode } from "../../services/otpStore";
import { sendVerificationCodeEmail } from "../../services/email";

const router = Router();

/**
 * POST /auth/signup - Create new account
 */
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${
          process.env.API_URL || "http://localhost:3000"
        }/auth/confirm`,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message:
        "Account created successfully. Please check your email to confirm.",
      user: {
        id: data.user?.id,
        email: data.user?.email,
        fullName: fullName,
      },
      session: data.session,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /auth/confirm - Email confirmation callback
 * Supabase sends: ?token_hash=xxx&type=signup (or type=email)
 */
router.get("/confirm", async (req: Request, res: Response) => {
  console.log("[AUTH] /confirm route hit");
  console.log("[AUTH] Query params:", JSON.stringify(req.query));
  console.log("[AUTH] Full URL:", req.originalUrl);

  const { token_hash, type } = req.query;

  // Accept both 'signup' and 'email' types
  if (!token_hash || (type !== "signup" && type !== "email")) {
    console.log(
      "[AUTH] Invalid params - token_hash:",
      !!token_hash,
      "type:",
      type
    );
    return res
      .status(400)
      .send(
        renderTemplate("invalid-link") ||
          `<html><body><h1>Invalid Confirmation Link</h1><p>Missing token_hash or incorrect type. Received type: ${type}</p></body></html>`
      );
  }

  try {
    console.log("[AUTH] Attempting to verify OTP...");

    // Verify the email confirmation token
    // Use 'signup' type for email confirmation
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token_hash as string,
      type: "signup" as any, // Supabase uses 'signup' for email confirmation
    });

    if (error) {
      console.error("[AUTH] Verification error:", error);
      return res.status(400).send(
        renderTemplate("confirmation-failed", {
          ERROR_MESSAGE: error.message,
        }) ||
          `<html><body><h1>Confirmation Failed</h1><p>${error.message}</p></body></html>`
      );
    }

    console.log("[AUTH] Email confirmed successfully for:", data.user?.email);

    // Success! Email confirmed
    res.send(
      renderTemplate("email-confirmed", {
        EMAIL: data.user?.email || "Unknown",
      }) ||
        `<html><body><h1>✅ Email Confirmed!</h1><p>Your email ${data.user?.email} has been verified. You can now sign in.</p><a href="/auth/signin">Go to Sign In</a></body></html>`
    );
  } catch (error: any) {
    console.error("[AUTH] Unexpected error:", error);
    res.status(500).send(
      renderTemplate("server-error", {
        ERROR_MESSAGE: error.message || "Something went wrong",
      }) ||
        `<html><body><h1>Server Error</h1><p>${error.message}</p></body></html>`
    );
  }
});

/**
 * POST /auth/signin - Step 1: Validate credentials & send 6-digit login code
 */
router.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return res
        .status(401)
        .json({ error: error?.message || "Invalid credentials" });
    }

    const otpResult = createOtp(email, "login");
    if ("error" in otpResult) {
      return res.status(429).json({ error: otpResult.error });
    }

    await sendVerificationCodeEmail(email, otpResult.code, "login");

    res.json({
      requiresVerification: true,
      email: data.user.email,
      rememberMe: Boolean(rememberMe),
      message: "Verification code sent to your email",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /auth/verify-login - Step 2: Verify 6-digit code & issue session
 */
router.post("/verify-login", async (req: Request, res: Response) => {
  try {
    const { email, password, code, rememberMe } = req.body;

    if (!email || !password || !code) {
      return res.status(400).json({
        error: "Email, password, and verification code are required",
      });
    }

    const check = verifyOtpCode(email, "login", String(code));
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return res
        .status(401)
        .json({ error: error?.message || "Failed to create session" });
    }

    const keepLoggedIn = Boolean(rememberMe);
    res.json({
      message: "Signed in successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      rememberMe: keepLoggedIn,
      expiresInDays: keepLoggedIn ? 7 : 1,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /auth/resend-login-code - Resend 6-digit sign-in code
 */
router.post("/resend-login-code", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const otpResult = createOtp(email, "login");
    if ("error" in otpResult) {
      return res.status(429).json({ error: otpResult.error });
    }

    await sendVerificationCodeEmail(email, otpResult.code, "login");
    res.json({ message: "New verification code sent to your email" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /auth/password/request-code - Send 6-digit code to modify/reset password
 */
router.post("/password/request-code", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return res.status(500).json({ error: "Failed to verify account" });
    }

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!user) {
      return res.status(404).json({
        error: "No account found with that email address",
      });
    }

    const otpResult = createOtp(normalizedEmail, "password_reset");
    if ("error" in otpResult) {
      return res.status(429).json({ error: otpResult.error });
    }

    await sendVerificationCodeEmail(
      normalizedEmail,
      otpResult.code,
      "password_reset"
    );

    res.json({ message: "Password verification code sent to your email" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /auth/password/confirm - Verify 6-digit code and update password
 */
router.post("/password/confirm", async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: "Email, verification code, and new password are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const check = verifyOtpCode(
      normalizedEmail,
      "password_reset",
      String(code)
    );
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return res.status(500).json({ error: "Failed to look up account" });
    }

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: String(newPassword),
      });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /auth/signout - Logout (protected)
 */
router.post("/signout", authenticate, async (req: Request, res: Response) => {
  try {
    res.json({ message: "Signed out successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /auth/refresh - Refresh access token
 */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    if (!data.session) {
      return res.status(401).json({ error: "Failed to refresh session" });
    }

    res.json({
      message: "Token refreshed successfully",
      session: data.session,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /auth/me - Get current user (protected)
 */
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user profile from auth.users
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authData.user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.full_name,
        created_at: authData.user.created_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
