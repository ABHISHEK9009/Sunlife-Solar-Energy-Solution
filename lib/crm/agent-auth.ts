import { createHmac, createHash, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendAgentOtpEmail, maskEmail } from "@/lib/crm/agent-mailer";

const OTP_SECRET = process.env.ADMIN_PASSWORD || "sunlife_otp_jwt_secret_token_key_2026";

interface AgentOtpCacheEntry {
  otpHash: string;
  expiresAt: number;
  requestedAt: number;
  attempts: number;
}

declare global {
  var __agentOtpCache: Map<string, AgentOtpCacheEntry> | undefined;
}

const agentOtpCache =
  globalThis.__agentOtpCache ||
  (globalThis.__agentOtpCache = new Map<string, AgentOtpCacheEntry>());

/**
 * Clean and extract 10-digit mobile number from input
 */
function extractMobileNumber(input: string): string {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length < 10) {
    throw new Error(
      "We could not verify this account. Please check your mobile number or contact your administrator."
    );
  }
  return digits.slice(-10);
}

/**
 * Generate a cryptographically secure 6-digit OTP and send to the agent's verified email
 */
export async function sendAgentOtp(mobileInput: string) {
  const cleanMobile = extractMobileNumber(mobileInput);

  // Look up active agent by mobile number in CRM database
  const member = await prisma.teamMember.findFirst({
    where: {
      phone: { contains: cleanMobile },
      activeStatus: true,
      employeeAccessEnabled: true,
    },
  });

  if (!member) {
    throw new Error(
      "We could not verify this account. Please check your mobile number or contact your administrator."
    );
  }

  const email = member.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      "No registered email address found for this account. Please contact your administrator."
    );
  }

  const cacheKey = member.id;
  const existing = agentOtpCache.get(cacheKey);
  const now = Date.now();

  // Rate limiting / cooldown: 60 seconds between OTP requests
  if (existing && existing.requestedAt && now - existing.requestedAt < 60000) {
    const remainingSeconds = Math.ceil((60000 - (now - existing.requestedAt)) / 1000);
    throw new Error(
      `Please wait ${remainingSeconds} seconds before requesting a new OTP.`
    );
  }

  // Generate cryptographically secure 6-digit numeric OTP
  const otp = randomInt(100000, 1000000).toString();
  const otpHash = createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes

  // Persist hashed OTP & expiry in PostgreSQL database
  await prisma.teamMember.update({
    where: { id: member.id },
    data: {
      verificationCodeHash: otpHash,
      verificationExpiresAt: expiresAt,
    },
  });

  // Track attempts and cooldown in memory cache
  agentOtpCache.set(cacheKey, {
    otpHash,
    expiresAt: expiresAt.getTime(),
    requestedAt: now,
    attempts: 0,
  });

  // Dispatch professional branded HTML email to agent's verified email address
  const emailResult = await sendAgentOtpEmail({
    to: email,
    name: member.name,
    otp,
    employeeId: member.employeeId,
    phone: member.phone,
    role: member.role,
    territory: member.territory,
  });

  if (!emailResult.sent) {
    throw new Error(
      "Unable to deliver OTP to your registered email. Please contact your administrator."
    );
  }

  const maskedEmail = maskEmail(email);

  return {
    success: true,
    maskedEmail,
    message: `OTP has been sent to your registered email address (${maskedEmail}).`,
    expiresInSeconds: 600,
    cooldownSeconds: 60,
  };
}

/**
 * Securely verify the entered OTP against PostgreSQL database record
 */
export async function verifyAgentOtp(mobileInput: string, userOtp: string) {
  const cleanMobile = extractMobileNumber(mobileInput);
  const cleanOtp = (userOtp || "").trim();

  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    throw new Error("Enter a valid 6-digit OTP.");
  }

  // Look up agent by mobile number
  const member = await prisma.teamMember.findFirst({
    where: {
      phone: { contains: cleanMobile },
      activeStatus: true,
      employeeAccessEnabled: true,
    },
  });

  if (!member) {
    throw new Error(
      "We could not verify this account. Please check your mobile number or contact your administrator."
    );
  }

  const cacheKey = member.id;
  const cacheEntry = agentOtpCache.get(cacheKey);
  const currentAttempts = cacheEntry?.attempts || 0;

  // Brute force protection: max 5 failed attempts
  if (currentAttempts >= 5) {
    await prisma.teamMember.update({
      where: { id: member.id },
      data: {
        verificationCodeHash: null,
        verificationExpiresAt: null,
      },
    });
    agentOtpCache.delete(cacheKey);
    throw new Error("Too many failed attempts. Please request a new OTP.");
  }

  // Check expiration (10 minutes limit)
  const now = new Date();
  if (!member.verificationExpiresAt || member.verificationExpiresAt < now) {
    throw new Error("This OTP has expired. Please request a new OTP.");
  }

  // Check cryptographic hash of OTP
  const incomingHash = createHash("sha256").update(cleanOtp).digest("hex");
  if (!member.verificationCodeHash || member.verificationCodeHash !== incomingHash) {
    if (cacheEntry) {
      cacheEntry.attempts = currentAttempts + 1;
    }
    const remaining = 5 - (currentAttempts + 1);
    if (remaining <= 0) {
      await prisma.teamMember.update({
        where: { id: member.id },
        data: {
          verificationCodeHash: null,
          verificationExpiresAt: null,
        },
      });
      agentOtpCache.delete(cacheKey);
      throw new Error("Too many failed attempts. Please request a new OTP.");
    }
    throw new Error("Incorrect OTP. Please try again.");
  }

  // Single-use guarantee: Invalidate OTP immediately upon successful verification
  await prisma.teamMember.update({
    where: { id: member.id },
    data: {
      verificationCodeHash: null,
      verificationExpiresAt: null,
      emailVerifiedAt: member.emailVerifiedAt || now,
    },
  });
  agentOtpCache.delete(cacheKey);

  // Generate signed production session access token
  const timestamp = Date.now();
  const employeeIdentifier = member.employeeId || member.id;
  const payload = `${member.id}:${employeeIdentifier}:agent:${timestamp}`;
  const signature = createHmac("sha256", OTP_SECRET)
    .update(payload)
    .digest("hex");

  const accessToken = Buffer.from(`${payload}:${signature}`).toString("base64url");

  return {
    success: true,
    accessToken,
    agent: {
      id: member.id,
      employeeId: member.employeeId || member.id,
      name: member.name,
      role: member.role,
      category: member.category,
      phone: member.phone,
      email: member.email,
      territory: member.territory || "Jaipur Central",
      department: member.department || "Operations",
    },
  };
}

/**
 * Validates the Authorization Bearer token for Agent routes
 */
export async function authenticateAgentRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 5) return null;

    const [id, employeeId, role, timestampStr, signature] = parts;
    if (role !== "agent") return null;

    const payload = `${id}:${employeeId}:${role}:${timestampStr}`;
    const expectedSignature = createHmac("sha256", OTP_SECRET)
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

    const member = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!member || member.activeStatus === false || member.employeeAccessEnabled === false) {
      return null;
    }

    return member;
  } catch (err) {
    return null;
  }
}
