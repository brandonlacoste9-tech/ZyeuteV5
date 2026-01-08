import { Resend } from "resend";
import { traceExternalAPI } from "./tracer.js";

// Simple direct API key approach - no Replit Connectors needed
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Zyeute <noreply@zyeute.com>";

if (!RESEND_API_KEY) {
  console.warn(
    "⚠️ RESEND_API_KEY not found - email functionality will be disabled",
  );
}

export async function getResendClient() {
  if (!RESEND_API_KEY) {
    throw new Error(
      "Resend API key not configured. Please set RESEND_API_KEY in environment variables.",
    );
  }

  return {
    client: new Resend(RESEND_API_KEY),
    fromEmail: FROM_EMAIL,
  };
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!RESEND_API_KEY) {
      console.warn("Email not sent - Resend API key not configured");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    const { client, fromEmail } = await getResendClient();

    return await traceExternalAPI(
      "resend",
      "emails.send",
      "POST",
      async (span) => {
        span.setAttributes({
          "email.to": to,
          "email.subject": subject,
          "email.from": fromEmail,
        });

        const response = await client.emails.send({
          from: fromEmail,
          to: [to],
          subject,
          html,
        });

        const messageId = response.data?.id;
        span.setAttributes({
          "email.message_id": messageId || "unknown",
          "email.success": true,
        });

        console.log("✅ Email sent successfully:", messageId);
        return {
          success: true,
          messageId,
        };
      },
    );
  } catch (error: any) {
    console.error("❌ Failed to send email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}
