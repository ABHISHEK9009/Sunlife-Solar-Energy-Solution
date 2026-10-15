import { createHmac, createHash, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { dispatchCustomerOtp } from "./sms-service";
import { assignLeadToSales } from "./territory-router";

function getAuthSecret(): string {
  const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.AUTH_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CUSTOMER_AUTH_SECRET or AUTH_JWT_SECRET must be configured in production.");
    }
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
 * Neutral OTP dispatch: Does not leak customer name or status prior to authentication.
 */
export async function sendCustomerOtp(rawPhone: string) {
  const cleanPhone = normalizeIndianPhone(rawPhone);

  const now = Date.now();
  const existing = customerOtpCache.get(cleanPhone);

  // 60-second cooldown per phone number
  if (existing && existing.requestedAt && now - existing.requestedAt < 60000) {
    const remaining = Math.ceil((60000 - (now - existing.requestedAt)) / 1000);
    throw new Error(`Please wait ${remaining} seconds before requesting a new OTP.`);
  }

  // Find existing customer, lead, or team member email for backup delivery if available
  const [customer, lead, teamMember] = await Promise.all([
    prisma.customer.findUnique({
      where: { primaryMobile: cleanPhone },
      select: { fullName: true, email: true },
    }),
    prisma.lead.findFirst({
      where: { phone: cleanPhone },
      orderBy: { createdAt: "desc" },
      select: { name: true, email: true },
    }),
    prisma.teamMember?.findFirst
      ? prisma.teamMember.findFirst({
          where: { phone: cleanPhone },
          select: { name: true, email: true },
        })
      : Promise.resolve(null),
  ]);

  const customerName = customer?.fullName || lead?.name || teamMember?.name || "Customer";
  const email = customer?.email || lead?.email || teamMember?.email;

  // Single cryptographically secure 6-digit OTP
  const otp = randomInt(100000, 1000000).toString();
  const otpHash = createHash("sha256").update(otp).digest("hex");
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  // Dispatch OTP through failover hierarchy
  const delivery = await dispatchCustomerOtp({
    phone: cleanPhone,
    otp,
    customerName,
    email,
  });

  if (!delivery.sent) {
    throw new Error(
      delivery.error || "Unable to deliver OTP right now. Please try again or contact support."
    );
  }

  // Store hashed challenge
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
    message: "Verification code sent successfully.",
  };
}

/**
 * Validates OTP and resolves the phone identity to Customer or Lead.
 * Idempotently registers new users as Verified Leads.
 */
export async function verifyCustomerOtp(rawPhone: string, userOtp: string) {
  const cleanPhone = normalizeIndianPhone(rawPhone);
  const trimmedOtp = (userOtp || "").trim();

  if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
    throw new Error("Enter a valid 6-digit verification code.");
  }

  const challenge = customerOtpCache.get(cleanPhone);

  if (!challenge) {
    throw new Error("No active verification code found. Please request a new OTP.");
  }

  const now = Date.now();
  if (challenge.expiresAt < now) {
    customerOtpCache.delete(cleanPhone);
    throw new Error("This verification code has expired. Please request a new one.");
  }

  if (challenge.attempts >= 5) {
    customerOtpCache.delete(cleanPhone);
    throw new Error("Maximum attempts exceeded. Please request a new verification code.");
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
      throw new Error("Maximum attempts exceeded. Please request a new OTP.");
    }
    throw new Error(`Incorrect code. ${remaining} attempts remaining.`);
  }

  // ─── RESOLVE ACCOUNT IDENTITY IN CRM ─────────────────────────────────────
  // 1. Check if an active Customer exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { primaryMobile: cleanPhone },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          projectId: true,
          projectName: true,
          plantCapacityKw: true,
          projectStatus: true,
          installationAddress: true,
        },
      },
    },
  });

  if (existingCustomer) {
    if (existingCustomer.customerStatus !== "ACTIVE" || !existingCustomer.appAccessEnabled) {
      customerOtpCache.delete(cleanPhone);
      throw new Error("This account is currently inactive or suspended. Please contact Sunlife Solar support.");
    }

    // Atomically consume challenge on successful verification
    customerOtpCache.delete(cleanPhone);

    const timestamp = Date.now();

    // Update login timestamp
    await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: { mobileVerified: true, lastAppLogin: new Date() },
    });

    const payload = `${existingCustomer.id}:customer:${cleanPhone}:${timestamp}`;
    const signature = createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
    const accessToken = Buffer.from(`${payload}:${signature}`).toString("base64url");

    return {
      success: true,
      accessToken,
      accountState: "CUSTOMER" as const,
      isNewUser: false,
      profileComplete: true,
      user: {
        id: existingCustomer.id,
        customerId: existingCustomer.customerId,
        name: existingCustomer.fullName,
        phone: existingCustomer.primaryMobile,
        email: existingCustomer.email,
        address: existingCustomer.installationAddress,
        propertyType: existingCustomer.propertyType,
      },
      projects: existingCustomer.projects,
      activeProjectId: existingCustomer.projects.length > 0 ? existingCustomer.projects[0].id : null,
    };
  }

  const timestamp = Date.now();

  // 2. Check for an existing Lead
  let lead = await prisma.lead.findFirst({
    where: {
      phone: cleanPhone,
      status: { notIn: ["CONVERTED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  let isNewUser = false;

  // 3. If no open lead, create a new idempotent Verified Lead skeleton
  if (!lead) {
    isNewUser = true;
    let territory: { salesExecutiveId: string | null; territoryName: string };
    try {
      territory = await assignLeadToSales("Narmadapuram");
    } catch (_) {
      territory = { salesExecutiveId: null, territoryName: "Central Desk" };
    }

    // Generate collision-proof lead ID
    const year = new Date().getFullYear();
    const count = await prisma.lead.count();
    let seq = count + 1;
    let leadCode = `SL-LEAD-${year}-${String(seq).padStart(4, "0")}`;
    const findExistingLead = async (code: string) => {
      if (typeof (prisma.lead as any).findUnique === "function") {
        return await (prisma.lead as any).findUnique({ where: { leadId: code } });
      }
      if (typeof prisma.lead.findFirst === "function") {
        return await prisma.lead.findFirst({ where: { leadId: code } });
      }
      return null;
    };
    while (await findExistingLead(leadCode)) {
      seq++;
      leadCode = `SL-LEAD-${year}-${String(seq).padStart(4, "0")}`;
    }

    lead = await prisma.lead.create({
      data: {
        leadId: leadCode,
        name: "New Applicant",
        phone: cleanPhone,
        city: "Narmadapuram",
        location: "Narmadapuram",
        propertyType: "Residential",
        status: "NEW",
        source: "Sunlife Solar Mobile App",
        leadSource: "Sunlife Solar Mobile App",
        notes: "Registered via Mobile App OTP verification.",
        assignedSalesExecutiveId: territory.salesExecutiveId,
      },
    });
  }

  // Atomically consume challenge on successful verification
  customerOtpCache.delete(cleanPhone);

  const payload = `${lead.id}:lead:${cleanPhone}:${timestamp}`;
  const signature = createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
  const accessToken = Buffer.from(`${payload}:${signature}`).toString("base64url");

  const isProfileComplete = Boolean(
    lead.name && lead.name !== "New Applicant" && lead.city && lead.propertyType
  );

  return {
    success: true,
    accessToken,
    accountState: "LEAD" as const,
    isNewUser,
    profileComplete: isProfileComplete,
    user: {
      id: lead.id,
      leadId: lead.leadId,
      name: lead.name === "New Applicant" ? "" : lead.name,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      propertyType: lead.propertyType,
      monthlyBill: lead.monthlyBill,
      status: lead.status,
    },
    projects: [],
    activeProjectId: null,
  };
}

export interface AuthenticatedUserSession {
  accountState: "CUSTOMER" | "LEAD";
  id: string;
  phone: string;
  customer?: any;
  lead?: any;
}

/**
 * Validates the Authorization Bearer token from incoming request.
 * Automatically handles live state promotion (Lead -> Customer) seamlessly.
 */
export async function authenticateCustomerRequest(request: Request): Promise<any | null> {
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");

    // Standard 5-part format: [entityId, entityType, phone, timestampStr, signature]
    if (parts.length === 5) {
      const [entityId, entityType, phone, timestampStr, signature] = parts;
      const payload = `${entityId}:${entityType}:${phone}:${timestampStr}`;
      const expectedSignature = createHmac("sha256", getAuthSecret()).update(payload).digest("hex");

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

      // 30 days max token lifetime
      const ageMs = Date.now() - parseInt(timestampStr, 10);
      if (ageMs > 30 * 24 * 60 * 60 * 1000) return null;

      // 1. If token was issued for an existing Customer
      if (entityType === "customer") {
        const customer = await prisma.customer.findUnique({
          where: { id: entityId },
        });

        if (
          customer &&
          customer.primaryMobile === phone &&
          customer.customerStatus === "ACTIVE" &&
          customer.appAccessEnabled
        ) {
          return customer;
        }
        return null;
      }

      // 2. If token was issued for a Lead
      if (entityType === "lead") {
        const lead = await prisma.lead.findUnique({ where: { id: entityId } });
        if (!lead || lead.phone !== phone) {
          return null;
        }

        // Check if lead was converted to a Customer
        if (lead.customerId) {
          const convertedCustomer = await prisma.customer.findUnique({
            where: { id: lead.customerId },
          });
          if (
            convertedCustomer &&
            convertedCustomer.customerStatus === "ACTIVE" &&
            convertedCustomer.appAccessEnabled
          ) {
            return convertedCustomer;
          }
        }

        // Check if customer exists by phone
        const activeCustomer = await prisma.customer.findUnique({
          where: { primaryMobile: phone },
        });

        if (
          activeCustomer &&
          activeCustomer.customerStatus === "ACTIVE" &&
          activeCustomer.appAccessEnabled
        ) {
          return activeCustomer;
        }

        // Return customer-like interface for open lead
        return {
          ...lead,
          id: lead.id,
          customerId: lead.leadId || lead.id,
          fullName: lead.name,
          primaryMobile: lead.phone,
          appAccessEnabled: true,
          customerStatus: "LEAD",
          isLead: true,
        };
      }

      return null;
    }

    // Legacy 4-part / 5-part compatibility
    if (parts.length === 4) {
      const [id, customerId, timestampStr, signature] = parts;
      const payload = `${id}:${customerId}:${timestampStr}`;
      const expectedSignature = createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
      return await prisma.customer.findFirst({
        where: { id, customerStatus: "ACTIVE", appAccessEnabled: true },
      });
    }

    return null;
  } catch (err) {
    return null;
  }
}
