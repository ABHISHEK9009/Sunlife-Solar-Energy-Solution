import { Resend } from "resend";

interface SendAgentOtpEmailParams {
  to: string;
  name: string;
  otp: string;
  employeeId?: string | null;
  phone?: string | null;
  role?: string | null;
  territory?: string | null;
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`;
  }
  const visibleStart = localPart.slice(0, 3);
  const visibleEnd = localPart.slice(-2);
  return `${visibleStart}***${visibleEnd}@${domain}`;
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>'"]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[c] || c)
  );

export function generateAgentOtpHtml(params: SendAgentOtpEmailParams): string {
  const name = escapeHtml(params.name);
  const otp = escapeHtml(params.otp);
  const employeeId = escapeHtml(params.employeeId || "SL-AGENT");
  const phone = escapeHtml(params.phone ? `+91 ${params.phone}` : "—");
  const role = escapeHtml(params.role || "Field Operations Partner");
  const territory = escapeHtml(params.territory || "Headquarters");
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${otp} is your Sunlife Agent Login OTP</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #052e2b 0%, #064e3b 50%, #08765c 100%);padding:32px 36px;color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <img src="https://sunlifesolar.in/logo/logo.png" width="160" alt="Sunlife Solar Energy Solution" style="display:block;max-width:160px;height:auto;border:0;" />
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(167,243,208,0.3);border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;letter-spacing:1px;color:#a7f3d0;text-transform:uppercase;">
                      AGENT ACCESS
                    </span>
                  </td>
                </tr>
              </table>
              <div style="font-size:24px;font-weight:800;color:#ffffff;margin-top:24px;line-height:1.2;">
                Agent Portal Login Verification
              </div>
              <div style="font-size:14px;color:#d1fae5;margin-top:6px;line-height:1.4;">
                Field Partner & Operations App Authentication
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              <p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 14px 0;">
                Hello ${name},
              </p>
              <p style="font-size:15px;line-height:24px;color:#475569;margin:0 0 24px 0;">
                A sign-in request was initiated for your Sunlife Solar Field Partner account. Use the secure One-Time Password (OTP) below to authenticate your session:
              </p>

              <!-- Highlighted OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0fdf4;border:2px solid #86efac;border-radius:16px;margin:20px 0 26px 0;">
                <tr>
                  <td align="center" style="padding:26px 20px;">
                    <div style="font-size:11px;font-weight:800;letter-spacing:1.8px;color:#047857;text-transform:uppercase;">
                      YOUR 6-DIGIT LOGIN OTP
                    </div>
                    <div style="font-family:'Courier New',Courier,monospace,sans-serif;font-size:40px;font-weight:900;letter-spacing:10px;color:#064e3b;margin:12px 0 10px 0;user-select:all;">
                      ${otp}
                    </div>
                    <div style="display:inline-block;background:#ffffff;border:1px solid #bbf7d0;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;color:#059669;">
                      ⏱ Expires in 10 minutes
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Account Summary Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">
                      Agent Account Details
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;line-height:22px;">
                      <tr>
                        <td style="color:#64748b;padding:2px 0;width:35%;">Employee ID:</td>
                        <td style="color:#0f172a;font-weight:700;font-family:monospace;padding:2px 0;">${employeeId}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;padding:2px 0;">Role Title:</td>
                        <td style="color:#0f172a;font-weight:600;padding:2px 0;">${role}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;padding:2px 0;">Territory:</td>
                        <td style="color:#0f172a;font-weight:600;padding:2px 0;">${territory}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;padding:2px 0;">Registered Mobile:</td>
                        <td style="color:#0f172a;font-weight:600;padding:2px 0;">${phone}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="border-left:4px solid #f59e0b;background:#fffbeb;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
                <div style="font-size:13px;font-weight:700;color:#b45309;margin-bottom:4px;">
                  🔒 Security Notice
                </div>
                <div style="font-size:12px;line-height:18px;color:#92400e;">
                  Sunlife Solar Energy Solution will never ask for your login OTP or PIN via phone or chat. Never share this code with anyone. If you did not request this login, please notify admin immediately.
                </div>
              </div>

              <!-- Footer Section -->
              <div style="border-top:1px solid #e2e8f0;padding-top:20px;font-size:12px;line-height:19px;color:#64748b;">
                <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">
                  Sunlife Solar Energy Solution
                </div>
                <div>
                  VINAYAK COMPLEX, Near AZAD CHOWK, Malakhedi, Narmadapuram, MP – 461001
                </div>
                <div style="margin-top:4px;">
                  Helpdesk: <a href="mailto:infosses24@gmail.com" style="color:#047857;text-decoration:none;">infosses24@gmail.com</a> · Support: <a href="tel:+917722995100" style="color:#047857;text-decoration:none;">+91 77229 95100</a>
                </div>
                <div style="margin-top:12px;font-size:11px;color:#94a3b8;">
                  © ${currentYear} Sunlife Solar Energy Solution. All rights reserved. · <a href="https://sunlifesolar.in" style="color:#047857;text-decoration:none;">sunlifesolar.in</a>
                </div>
              </div>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAgentOtpEmail(params: SendAgentOtpEmailParams): Promise<{
  sent: boolean;
  maskedEmail: string;
  error?: string;
}> {
  const maskedEmail = maskEmail(params.to);

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || "Sunlife Solar <infosses24@gmail.com>";

    if (!apiKey) {
      console.warn("[Agent Mailer]: RESEND_API_KEY is not configured. Email skipped.");
      return {
        sent: false,
        maskedEmail,
        error: "Email delivery service is currently not configured.",
      };
    }

    const resend = new Resend(apiKey);
    const html = generateAgentOtpHtml(params);
    const text = `Hello ${params.name},\n\nYour Sunlife Solar Agent Portal login OTP is: ${params.otp}\nThis code is valid for 10 minutes.\n\nEmployee ID: ${params.employeeId || "N/A"}\nDo not share this code with anyone.\n\n© Sunlife Solar Energy Solution\nhttps://sunlifesolar.in`;

    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: `${params.otp} is your Sunlife Agent Portal login OTP`,
      html,
      text,
    });

    if (error) {
      console.error("[Agent Mailer Resend Error]:", error);
      return {
        sent: false,
        maskedEmail,
        error: "Failed to dispatch email via delivery service.",
      };
    }

    console.log(`[Agent Mailer]: Successfully sent OTP email to ${maskedEmail} (${params.name})`);
    return {
      sent: true,
      maskedEmail,
    };
  } catch (err: any) {
    console.error("[Agent Mailer Exception]:", err);
    return {
      sent: false,
      maskedEmail,
      error: "Unexpected error during email delivery.",
    };
  }
}
