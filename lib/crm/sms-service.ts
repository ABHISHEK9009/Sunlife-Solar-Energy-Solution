import { sendMail, maskEmail } from "./mailer";

interface SendCustomerOtpOptions {
  phone: string;
  otp: string;
  customerName?: string | null;
  email?: string | null;
  isNewUser?: boolean;
}

interface DeliveryResult {
  sent: boolean;
  channel: "WHATSAPP" | "SMS" | "EMAIL" | "DEV_SANDBOX";
  destination: string;
  error?: string;
}

/**
 * Dispatches an authoritative OTP to the customer via:
 * 1. WhatsApp Gateway (Baileys service)
 * 2. Fast2SMS / Twilio SMS Gateway
 * 3. Registered Email (if provided)
 * 4. Development / Testing Sandbox (strictly environment-gated)
 */
export async function dispatchCustomerOtp(options: SendCustomerOtpOptions): Promise<DeliveryResult> {
  const { phone, otp, customerName = "Valued Customer", email } = options;
  const maskedDest = `+91 ******${phone.slice(-4)}`;

  // 1. WhatsApp Gateway (High Priority)
  const whatsappUrl = process.env.WHATSAPP_GATEWAY_URL;
  const whatsappKey = process.env.WHATSAPP_API_KEY;

  if (whatsappUrl && whatsappKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s fast timeout

      const waRes = await fetch(`${whatsappUrl.replace(/\/$/, "")}/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": whatsappKey,
        },
        body: JSON.stringify({
          phone: `91${phone}`,
          message: `Your Sunlife Solar verification code is *${otp}*.\n\nValid for 10 minutes. Please do not share this code with anyone.`,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (waRes.ok) {
        const waData = await waRes.json().catch(() => null);
        if (waData?.success || waData?.status === "SENT" || waData?.status === "QUEUED") {
          return {
            sent: true,
            channel: "WHATSAPP",
            destination: maskedDest,
          };
        }
      }
    } catch (err: any) {
      console.warn("[WhatsApp Gateway Fast-Failover]:", err?.message || err);
      // Immediately proceed to SMS / Email failover
    }
  }

  // 2. Fast2SMS Provider
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey && !fast2SmsKey.includes("your_fast2sms")) {
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
          destination: maskedDest,
        };
      }
    } catch (err: any) {
      console.error("[Fast2SMS Error]:", err?.message);
    }
  }

  // 3. Twilio Provider
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom && !twilioSid.includes("your_twilio")) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        To: `+91${phone}`,
        From: twilioFrom,
        Body: `${otp} is your verification code for Sunlife Solar. Valid for 10 minutes.`,
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
          destination: maskedDest,
        };
      }
    } catch (err: any) {
      console.error("[Twilio SMS Error]:", err?.message);
    }
  }

  // 4. Email Fallback
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    try {
      const mailRes = await sendMail({
        to: email,
        subject: `${otp} is your Sunlife Solar verification code`,
        html: `
          <div style="font-family:sans-serif;padding:24px;max-width:500px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#064e3b;margin-bottom:8px;">Sunlife Solar</h2>
            <p>Dear ${customerName || "Customer"},</p>
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

  // 5. Development / Testing Sandbox (Permitted when SMS gateways are unconfigured or in non-production)
  const isDevOrTest = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_OTP === "true";
  if (isDevOrTest) {
    console.log(`\n======================================================`);
    console.log(`[SUNLIFE OTP DISPATCH - DEV SANDBOX]`);
    console.log(`Mobile: +91 ${phone}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Expires in: 10 minutes`);
    console.log(`======================================================\n`);

    return {
      sent: true,
      channel: "DEV_SANDBOX",
      destination: maskedDest,
    };
  }

  return {
    sent: false,
    channel: "DEV_SANDBOX",
    destination: maskedDest,
    error: "Unable to dispatch verification SMS right now. Please try again or contact Sunlife Solar support.",
  };
}
