import { sendMail, maskEmail } from "./mailer";

interface SendCustomerOtpOptions {
  phone: string;
  otp: string;
  customerName: string;
  email?: string | null;
}

interface DeliveryResult {
  sent: boolean;
  channel: "SMS" | "EMAIL" | "NONE";
  destination: string;
  error?: string;
}

/**
 * Dispatches an authoritative OTP to the customer via SMS Gateway or authorized email.
 * Returns sent: true ONLY when a configured delivery provider accepted the transmission.
 */
export async function dispatchCustomerOtp(options: SendCustomerOtpOptions): Promise<DeliveryResult> {
  const { phone, otp, customerName, email } = options;

  // 1. Fast2SMS Provider
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: phone,
        }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.return === true) {
        return {
          sent: true,
          channel: "SMS",
          destination: `+91 ******${phone.slice(-4)}`,
        };
      }
    } catch (err: any) {
      console.error("[SMS Gateway Error]:", err?.message);
    }
  }

  // 2. Twilio Provider
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        To: `+91${phone}`,
        From: twilioFrom,
        Body: `${otp} is your verification OTP for Sunlife Solar Customer Portal. Valid for 10 minutes. Do not share this code.`,
      });
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );
      if (response.ok) {
        return {
          sent: true,
          channel: "SMS",
          destination: `+91 ******${phone.slice(-4)}`,
        };
      }
    } catch (err: any) {
      console.error("[Twilio SMS Error]:", err?.message);
    }
  }

  // 3. Fallback to registered verified customer email if configured
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    try {
      const mailRes = await sendMail({
        to: email,
        subject: `${otp} is your Sunlife Solar login code`,
        html: `
          <div style="font-family:sans-serif;padding:24px;max-width:500px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#064e3b;margin-bottom:8px;">Sunlife Solar</h2>
            <p>Dear ${customerName},</p>
            <p>Your one-time login verification code is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#047857;background:#f0fdf4;padding:16px;border-radius:8px;text-align:center;margin:16px 0;">
              ${otp}
            </div>
            <p style="font-size:13px;color:#64748b;">This code expires in 10 minutes. Please do not share this code with anyone.</p>
          </div>
        `,
      });
      if (mailRes.sent) {
        return {
          sent: true,
          channel: "EMAIL",
          destination: maskEmail(email),
        };
      }
    } catch (err: any) {
      console.error("[Customer Email Delivery Error]:", err?.message);
    }
  }

  // Neither SMS provider nor Email accepted the dispatch
  return {
    sent: false,
    channel: "NONE",
    destination: `+91 ******${phone.slice(-4)}`,
    error:
      "SMS delivery service is unconfigured. Set FAST2SMS_API_KEY, TWILIO_ACCOUNT_SID, or configure a verified customer email to enable real-time OTP delivery.",
  };
}
