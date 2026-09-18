import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { logAuditEvent } from "@/lib/crm/audit-logger";

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

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(preferredLanguage && { preferredLanguage }),
        ...(alternateMobile !== undefined && { alternateMobile }),
        ...(billingAddress !== undefined && { billingAddress }),
        ...(profilePhoto !== undefined && { profilePhoto }),
      },
    });

    await logAuditEvent({
      entityType: "Customer",
      entityId: customer.id,
      fieldChanged: "profile",
      action: "UPDATE",
      actorId: customer.customerId,
      actorType: "CUSTOMER",
      source: "APP",
      newValue: "Updated profile preferences",
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
