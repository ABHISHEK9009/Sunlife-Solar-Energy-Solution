import nodemailer from "nodemailer";

// ─── Mask email for safe display ─────────────────────────────────────────────

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  if (localPart.length <= 3) return `${localPart[0]}***@${domain}`;
  return `${localPart.slice(0, 3)}***${localPart.slice(-2)}@${domain}`;
}

// ─── Create SMTP transporter ──────────────────────────────────────────────────

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

// ─── From address ─────────────────────────────────────────────────────────────

export const fromAddress = () =>
  process.env.SMTP_FROM ||
  `Sunlife Solar <${process.env.SMTP_USER || "infosses24@gmail.com"}>`;

// ─── Send a generic email ─────────────────────────────────────────────────────

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
    console.log(`[Mailer]: Email sent to ${maskEmail(options.to)} — "${options.subject}"`);
    return { sent: true };
  } catch (err: any) {
    console.error("[Mailer Error]:", err?.message || err);
    return {
      sent: false,
      error: err?.message || "Failed to send email.",
    };
  }
}
