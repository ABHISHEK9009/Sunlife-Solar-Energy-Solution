import nodemailer from "nodemailer";

// ─── Shared Gmail SMTP transport ────────────────────────────────────────────

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Gmail credentials not configured (GMAIL_USER / GMAIL_APP_PASSWORD).");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export const senderName = "Sunlife Solar";
export const senderEmail = () => process.env.GMAIL_USER || "infosses24@gmail.com";
export const fromAddress = () => `${senderName} <${senderEmail()}>`;

// ─── Send a generic email ────────────────────────────────────────────────────

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const transport = createTransport();
    await transport.sendMail({
      from: fromAddress(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { sent: true };
  } catch (err: any) {
    console.error("[Mailer Error]:", err?.message || err);
    return {
      sent: false,
      error: err?.message || "Failed to send email.",
    };
  }
}
