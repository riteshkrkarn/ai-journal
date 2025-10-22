import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../services/supabase";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token and extract user info
 * Usage: Add to protected routes
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or invalid authorization header",
        message: "Please provide a valid Bearer token",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid or expired token",
        message: "Please sign in again",
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email!,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      error: "Authentication failed",
      message: "An error occurred while verifying your token",
    });
  }
}
