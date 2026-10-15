import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLeadId } from "@/lib/crm/sequence-generator";
import { checkRateLimit, buildRateLimitResponse } from "@/lib/security/rate-limiter";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function POST(req: Request) {
  const rateLimit = await checkRateLimit(req, {
    actionName: "QUOTE_FORM_SUBMIT",
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return buildRateLimitResponse(rateLimit);
  }

  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      city,
      propertyType,
      monthlyBill,
      interestedSolution,
      rooftopArea,
      message,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone number are required." },
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
      const leadId = await generateLeadId(tx);

      const lead = await tx.lead.create({
        data: {
          leadId,
          name: name.trim(),
          phone: cleanPhone,
          email: email ? email.trim() : null,
          city: city || "Narmadapuram",
          location: city || "Narmadapuram",
          propertyType: propertyType || "Residential",
          monthlyBill: monthlyBill || null,
          interestedSolution: interestedSolution || "Rooftop Solar",
          rooftopArea: rooftopArea || null,
          message: message ? message.trim() : null,
          notes: message ? message.trim() : null,
          source: "Website Quote Form",
          leadSource: "Website Quote Form",
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
        newValue: `Created lead ${lead.leadId} from Quote Form for ${name}`,
      });

      return { id: lead.id, leadId: lead.leadId };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error creating quote lead:", error);
    return NextResponse.json(
      { error: "Failed to submit quote request. Please try again or call us directly." },
      { status: 500 }
    );
  }
}
