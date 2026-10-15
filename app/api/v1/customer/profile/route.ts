export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { logAuditEvent } from "@/lib/crm/audit-logger";

function isValidProfilePhoto(url: any): boolean {
  if (url === null || url === undefined || url === "") return true;
  if (typeof url !== "string") return false;
  if (url.length > 2048) return false;

  // Local storage relative path
  if (url.startsWith("/uploads/") || url.startsWith("/images/")) {
    // Prevent directory traversal
    if (url.includes("..")) return false;
    return true;
  }

  // Trusted HTTPS URL
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (!parsed.hostname || parsed.hostname.length < 3) return false;
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const profile = await prisma.customer.findUnique({
    where: { id: customer.id },
    include: {
      assignedSalesExecutive: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, profile });
}

export async function PATCH(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { preferredLanguage, alternateMobile, billingAddress, profilePhoto } = body;

    if (profilePhoto !== undefined && !isValidProfilePhoto(profilePhoto)) {
      return NextResponse.json(
        { error: "Invalid profile photo format. Must be a secure HTTPS URL or supported local upload path." },
        { status: 400 }
      );
    }

    const cleanPhoto =
      profilePhoto === "" || profilePhoto === null
        ? null
        : profilePhoto !== undefined
        ? String(profilePhoto).trim()
        : undefined;

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(preferredLanguage && { preferredLanguage }),
        ...(alternateMobile !== undefined && { alternateMobile }),
        ...(billingAddress !== undefined && { billingAddress }),
        ...(cleanPhoto !== undefined && { profilePhoto: cleanPhoto }),
      },
    });

    await logAuditEvent({
      entityType: "Customer",
      entityId: customer.id,
      fieldChanged: "profile",
      action: "UPDATE",
      actorId: customer.customerId || customer.id,
      actorType: "CUSTOMER",
      source: "APP",
      newValue: "Updated profile preferences",
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
