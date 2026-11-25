import * as dotenv from "dotenv";
import type { OtpPurpose } from "./otpStore";

dotenv.config();

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface SendEmailResult {
  sent: boolean;
  id?: string | undefined;
  skipped?: boolean | undefined;
}

function buildOtpHtml(code: string, purpose: OtpPurpose): string {
  const heading =
    purpose === "login"
      ? "Sign-in verification code"
      : "Password change verification code";
  const description =
    purpose === "login"
      ? "Use the 6-digit code below to finish signing in to ReflectIQ. This code expires in 10 minutes."
      : "Use the 6-digit code below to verify your password change on ReflectIQ. This code expires in 10 minutes.";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F4F0; padding: 32px 16px; color: #141517;">
      <div style="max-width: 460px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #DFDDD4; border-radius: 12px; padding: 32px;">
        <div style="font-size: 16px; font-weight: 700; color: #141517; margin-bottom: 20px;">
          ReflectIQ
        </div>
        <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 10px 0; color: #141517;">
          ${heading}
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #5C5F66; margin: 0 0 24px 0;">
          ${description}
        </p>
        <div style="background-color: #F5F4F0; border: 1px solid #DFDDD4; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.28em; color: #1D4ED8;">
            ${code}
          </span>
        </div>
        <p style="font-size: 12px; line-height: 1.5; color: #5C5F66; margin: 0;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
}

export async function sendVerificationCodeEmail(
  toEmail: string,
  code: string,
  purpose: OtpPurpose
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "ReflectIQ <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      `[EMAIL] RESEND_API_KEY is not set. Skipping Resend API call for ${toEmail} (${purpose}).`
    );
    return { sent: false, skipped: true };
  }

  const subject =
    purpose === "login"
      ? `${code} is your ReflectIQ sign-in code`
      : `${code} is your ReflectIQ password verification code`;

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      html: buildOtpHtml(code, purpose),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as { id?: string };
  return { sent: true, id: data.id };
}
