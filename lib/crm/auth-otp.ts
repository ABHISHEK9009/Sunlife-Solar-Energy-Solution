import { createHmac, createHash, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { dispatchCustomerOtp } from "./sms-service";

function getAuthSecret(): string {
  const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.AUTH_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CUSTOMER_AUTH_SECRET or AUTH_JWT_SECRET must be configured in production.");
    }
    // Safe deterministic development secret
    return "sunlife_customer_auth_development_secret_2026";
  }
  return secret;
}

interface CustomerChallenge {
  otpHash: string;
  expiresAt: number;
  attempts: number;
  requestedAt: number;
}

declare global {
  var __customerOtpCache: Map<string, CustomerChallenge> | undefined;
}

const customerOtpCache =
  globalThis.__customerOtpCache ||
  (globalThis.__customerOtpCache = new Map<string, CustomerChallenge>());

/**
 * Normalizes Indian mobile number to 10 digits
 */
export function normalizeIndianPhone(input: string): string {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  throw new Error("Please enter a valid 10-digit mobile number.");
}

/**
 * Generates a cryptographically secure 6-digit OTP and dispatches to customer.
 * Enforces cooldown, attempt tracking, hashed storage, and delivery verification.
 */
export async function sendCustomerOtp(rawPhone: string) {
  const cleanPhone = normalizeIndianPhone(rawPhone);

  const customer = await prisma.customer.findUnique({
    where: { primaryMobile: cleanPhone },
  });

  // Generic security response if customer does not exist or access disabled
  if (!customer || !customer.appAccessEnabled || customer.customerStatus !== "ACTIVE") {
    throw new Error(
      "We could not verify this account. Please check your mobile number or contact Sunlife Solar support."
    );
  }

  const now = Date.now();
  const existing = customerOtpCache.get(cleanPhone);

  // 60 seconds request cooldown
  if (existing && existing.requestedAt && now - existing.requestedAt < 60000) {
    const remaining = Math.ceil((60000 - (now - existing.requestedAt)) / 1000);
    throw new Error(`Please wait ${remaining} seconds before requesting a new OTP.`);
  }

  // Cryptographically secure 6-digit OTP
  const otp = randomInt(100000, 1000000).toString();
  const otpHash = createHash("sha256").update(otp).digest("hex");
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  // Attempt real delivery
  const delivery = await dispatchCustomerOtp({
    phone: cleanPhone,
    otp,
    customerName: customer.fullName,
    email: customer.email,
  });

  if (!delivery.sent) {
    throw new Error(
      delivery.error ||
        "Unable to deliver OTP right now. SMS service is unavailable. Please contact support."
    );
  }

  // Store hashed challenge in shared cache
  customerOtpCache.set(cleanPhone, {
    otpHash,
    expiresAt,
    attempts: 0,
    requestedAt: now,
  });

  return {
    success: true,
    maskedMobile: delivery.destination,
    deliveryChannel: delivery.channel,
    expiresInSeconds: 600,
    cooldownSeconds: 60,
  };
}

/**
 * Validates the entered OTP with single-use atomic consumption and brute-force protection.
 */
export async function verifyCustomerOtp(rawPhone: string, userOtp: string) {
  const cleanPhone = normalizeIndianPhone(rawPhone);
  const trimmedOtp = (userOtp || "").trim();

  if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
    throw new Error("Enter a valid 6-digit OTP.");
  }

  const customerRecord = await prisma.customer.findUnique({
    where: { primaryMobile: cleanPhone },
  });

  if (!customerRecord || !customerRecord.appAccessEnabled || customerRecord.customerStatus !== "ACTIVE") {
    throw new Error(
      "We could not verify this account. Please check your mobile number or contact Sunlife Solar support."
    );
  }

  const challenge = customerOtpCache.get(cleanPhone);
  if (!challenge) {
    throw new Error("No active OTP found. Please request a new verification code.");
  }

  const now = Date.now();
  if (challenge.expiresAt < now) {
    customerOtpCache.delete(cleanPhone);
    throw new Error("This OTP has expired. Please request a new verification code.");
  }

  // Max 5 attempts
  if (challenge.attempts >= 5) {
    customerOtpCache.delete(cleanPhone);
    throw new Error("Maximum verification attempts exceeded. Please request a new OTP.");
  }

  const incomingHash = createHash("sha256").update(trimmedOtp).digest("hex");
  const incomingBuffer = Buffer.from(incomingHash);
  const targetBuffer = Buffer.from(challenge.otpHash);

  const isMatch =
    incomingBuffer.length === targetBuffer.length &&
    timingSafeEqual(incomingBuffer, targetBuffer);

  if (!isMatch) {
    challenge.attempts += 1;
    const remaining = 5 - challenge.attempts;
    if (remaining <= 0) {
      customerOtpCache.delete(cleanPhone);
      throw new Error("Maximum verification attempts exceeded. Please request a new OTP.");
    }
    throw new Error("Incorrect OTP entered. Please try again.");
  }

  // Single-use guarantee: Atomically consume challenge immediately
  customerOtpCache.delete(cleanPhone);

  // Update customer login metadata
  const customer = await prisma.customer.update({
    where: { id: customerRecord.id },
    data: {
      mobileVerified: true,
      lastAppLogin: new Date(),
    },
  });

  // Generate signed access token
  const timestamp = Date.now();
  const payload = `${customer.id}:${customer.customerId}:customer:${timestamp}`;
  const signature = createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("hex");

  const accessToken = Buffer.from(`${payload}:${signature}`).toString("base64url");

  return {
    success: true,
    accessToken,
    customer: {
      id: customer.id,
      customerId: customer.customerId,
      fullName: customer.fullName,
      primaryMobile: customer.primaryMobile,
      email: customer.email,
      installationAddress: customer.installationAddress,
      propertyType: customer.propertyType,
      preferredLanguage: customer.preferredLanguage,
    },
  };
}

/**
 * Validates the Authorization Bearer token from the incoming Request
 */
export async function authenticateCustomerRequest(request: Request) {
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 5) {
      // Legacy 4-part compatibility
      if (parts.length === 4) {
        const [id, customerId, timestampStr, signature] = parts;
        const payload = `${id}:${customerId}:${timestampStr}`;
        const expectedSignature = createHmac("sha256", getAuthSecret())
          .update(payload)
          .digest("hex");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSignature);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
        return await prisma.customer.findFirst({
          where: { id, customerStatus: "ACTIVE", appAccessEnabled: true },
        });
      }
      return null;
    }

    const [id, customerId, role, timestampStr, signature] = parts;
    if (role !== "customer") return null;

    const payload = `${id}:${customerId}:${role}:${timestampStr}`;
    const expectedSignature = createHmac("sha256", getAuthSecret())
      .update(payload)
      .digest("hex");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    // Check token age (30 days limit)
    const ageMs = Date.now() - parseInt(timestampStr, 10);
    if (ageMs > 30 * 24 * 60 * 60 * 1000) {
      return null;
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer || !customer.appAccessEnabled || customer.customerStatus !== "ACTIVE") {
      return null;
    }

    return customer;
  } catch (err) {
    return null;
  }
}
