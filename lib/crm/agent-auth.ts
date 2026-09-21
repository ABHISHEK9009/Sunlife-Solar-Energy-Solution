import { createHmac, createHash, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendAgentOtpEmail, maskEmail } from "@/lib/crm/agent-mailer";

function getAgentAuthSecret(): string {
  const secret = process.env.AGENT_AUTH_SECRET || process.env.AUTH_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AGENT_AUTH_SECRET or AUTH_JWT_SECRET must be configured in production.");
    }
    return "sunlife_agent_auth_development_secret_2026";
  }
  return secret;
}

interface AgentChallenge {
  otpHash: string;
  expiresAt: number;
  requestedAt: number;
  attempts: number;
  purpose: "AGENT_LOGIN";
}

declare global {
  var __agentLoginChallenges: Map<string, AgentChallenge> | undefined;
}

const agentLoginChallenges =
  globalThis.__agentLoginChallenges ||
  (globalThis.__agentLoginChallenges = new Map<string, AgentChallenge>());

/**
 * Normalizes Indian mobile numbers
 */
function normalizeIndianMobile(input: string): string {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  throw new Error("Please enter a valid 10-digit mobile number.");
}

/**
 * Generate a cryptographically secure 6-digit OTP and send to the agent's verified email
 */
export async function sendAgentOtp(mobileInput: string) {
  const cleanMobile = normalizeIndianMobile(mobileInput);

  // Look up active agent by unambiguous exact mobile match
  const member = await prisma.teamMember.findFirst({
    where: {
      OR: [
        { phone: cleanMobile },
        { phone: `+91${cleanMobile}` },
        { phone: `+91 ${cleanMobile}` },
      ],
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
  const existing = agentLoginChallenges.get(cacheKey);
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
  // Prefix purpose to ensure login challenge cannot cross-validate with email-verification
  const otpHash = createHash("sha256").update(`LOGIN:${otp}`).digest("hex");
  const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes

  // Persist challenge purpose-separated hash in DB
  await prisma.teamMember.update({
    where: { id: member.id },
    data: {
      verificationCodeHash: `LOGIN:${otpHash}`,
      verificationExpiresAt: expiresAt,
    },
  });

  // Track attempts and cooldown in shared instance memory cache
  agentLoginChallenges.set(cacheKey, {
    otpHash,
    expiresAt: expiresAt.getTime(),
    requestedAt: now,
    attempts: 0,
    purpose: "AGENT_LOGIN",
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
 * Securely verify the entered OTP with atomic consumption
 */
export async function verifyAgentOtp(mobileInput: string, userOtp: string) {
  const cleanMobile = normalizeIndianMobile(mobileInput);
  const cleanOtp = (userOtp || "").trim();

  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    throw new Error("Enter a valid 6-digit OTP.");
  }

  // Look up agent by exact mobile match
  const member = await prisma.teamMember.findFirst({
    where: {
      OR: [
        { phone: cleanMobile },
        { phone: `+91${cleanMobile}` },
        { phone: `+91 ${cleanMobile}` },
      ],
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
  const challenge = agentLoginChallenges.get(cacheKey);
  const currentAttempts = challenge?.attempts || 0;

  // Brute force protection: max 5 failed attempts
  if (currentAttempts >= 5) {
    await prisma.teamMember.update({
      where: { id: member.id },
      data: {
        verificationCodeHash: null,
        verificationExpiresAt: null,
      },
    });
    agentLoginChallenges.delete(cacheKey);
    throw new Error("Too many failed attempts. Please request a new OTP.");
  }

  // Check expiration (10 minutes limit)
  const now = new Date();
  if (!member.verificationExpiresAt || member.verificationExpiresAt < now) {
    throw new Error("This OTP has expired. Please request a new OTP.");
  }

  // Check purpose separation
  if (!member.verificationCodeHash || !member.verificationCodeHash.startsWith("LOGIN:")) {
    throw new Error("Invalid challenge purpose. Please request a new OTP.");
  }

  // Check cryptographic hash of OTP with purpose prefix
  const expectedHash = member.verificationCodeHash.slice(6); // remove "LOGIN:"
  const incomingHash = createHash("sha256").update(`LOGIN:${cleanOtp}`).digest("hex");

  const incomingBuffer = Buffer.from(incomingHash);
  const expectedBuffer = Buffer.from(expectedHash);

  const isMatch =
    incomingBuffer.length === expectedBuffer.length &&
    timingSafeEqual(incomingBuffer, expectedBuffer);

  if (!isMatch) {
    if (challenge) {
      challenge.attempts = currentAttempts + 1;
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
      agentLoginChallenges.delete(cacheKey);
      throw new Error("Too many failed attempts. Please request a new OTP.");
    }
    throw new Error("Incorrect OTP. Please try again.");
  }

  // Single-use guarantee: Invalidate OTP atomically upon successful verification
  await prisma.teamMember.update({
    where: { id: member.id },
    data: {
      verificationCodeHash: null,
      verificationExpiresAt: null,
      emailVerifiedAt: member.emailVerifiedAt || now,
    },
  });
  agentLoginChallenges.delete(cacheKey);

  // Generate signed production session access token
  const timestamp = Date.now();
  const employeeIdentifier = member.employeeId || member.id;
  const payload = `${member.id}:${employeeIdentifier}:agent:${timestamp}`;
  const signature = createHmac("sha256", getAgentAuthSecret())
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
      territory: member.territory || "Headquarters",
      department: member.department || "Operations",
    },
  };
}

/**
 * Validates the Authorization Bearer token for Agent routes
 */
export async function authenticateAgentRequest(request: Request) {
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 5) return null;

    const [id, employeeId, role, timestampStr, signature] = parts;
    if (role !== "agent") return null;

    const payload = `${id}:${employeeId}:${role}:${timestampStr}`;
    const expectedSignature = createHmac("sha256", getAgentAuthSecret())
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
