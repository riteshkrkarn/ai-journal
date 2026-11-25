import crypto from "crypto";

export type OtpPurpose = "login" | "password_reset";

interface OtpRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;

const store = new Map<string, OtpRecord>();

function makeKey(email: string, purpose: OtpPurpose): string {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function createOtp(
  email: string,
  purpose: OtpPurpose
): { code: string } | { error: string; retryAfterSeconds: number } {
  const key = makeKey(email, purpose);
  const existing = store.get(key);
  const now = Date.now();

  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000
    );
    return {
      error: `Please wait ${retryAfterSeconds}s before requesting a new code`,
      retryAfterSeconds,
    };
  }

  const code = String(crypto.randomInt(100000, 1000000));
  store.set(key, {
    codeHash: hashCode(code),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now,
  });

  return { code };
}

export function verifyOtpCode(
  email: string,
  purpose: OtpPurpose,
  submittedCode: string
): { valid: true } | { valid: false; error: string } {
  const key = makeKey(email, purpose);
  const record = store.get(key);

  if (!record) {
    return { valid: false, error: "No verification code found. Request a new one." };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(key);
    return { valid: false, error: "Verification code expired. Request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(key);
    return {
      valid: false,
      error: "Too many incorrect attempts. Request a new code.",
    };
  }

  const normalized = submittedCode.trim();
  if (hashCode(normalized) !== record.codeHash) {
    record.attempts += 1;
    store.set(key, record);
    return { valid: false, error: "Invalid verification code." };
  }

  store.delete(key);
  return { valid: true };
}
