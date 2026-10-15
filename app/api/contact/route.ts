import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLeadId } from "@/lib/crm/sequence-generator";
import { checkRateLimit, buildRateLimitResponse } from "@/lib/security/rate-limiter";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function POST(req: Request) {
  const rateLimit = await checkRateLimit(req, {
    actionName: "CONTACT_FORM_SUBMIT",
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return buildRateLimitResponse(rateLimit);
  }

  try {
    const body = await req.json();
    const { fullName, phone, email, city, monthlyBill, requirement, message } =
      body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: "Full Name and Phone Number are required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const inquiry = await tx.contactInquiry.create({
        data: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          email: email ? email.trim() : null,
          city: city || "Narmadapuram",
          monthlyBill: monthlyBill || null,
          requirement: requirement || null,
          message: message ? message.trim() : null,
        },
      });

      const leadId = await generateLeadId(tx);

      const lead = await tx.lead.create({
        data: {
          leadId,
          name: fullName.trim(),
          phone: cleanPhone,
          email: email ? email.trim() : null,
          city: city || "Narmadapuram",
          location: city || "Narmadapuram",
          propertyType: requirement || "Residential",
          monthlyBill: monthlyBill || null,
          message: message ? message.trim() : null,
          notes: message ? message.trim() : null,
          source: "Contact Us Page",
          leadSource: "Contact Us Page",
          status: "NEW",
        },
      });

      await logAuditEvent({
        entityType: "Lead",
        entityId: lead.id,
        fieldChanged: "all",
        action: "CREATE",
        actorId: cleanPhone,
        actorType: "CUSTOMER",
        source: "API",
        client: tx,
        newValue: `Created lead ${lead.leadId} from Contact Form for ${fullName}`,
      });

      return { inquiryId: inquiry.id, leadId: lead.leadId };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error creating contact inquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please call 7722995100 directly." },
      { status: 500 }
    );
  }
}
