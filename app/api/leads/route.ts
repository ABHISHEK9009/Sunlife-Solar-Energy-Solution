export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";
import { generateLeadId } from "@/lib/crm/sequence-generator";
import { checkRateLimit, buildRateLimitResponse } from "@/lib/security/rate-limiter";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const where: any = {};

    if (status && status.toUpperCase() !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { leadId: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, leads, estimates] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
      }),
      prisma.calculatorEstimate.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      success: true,
      leads,
      estimates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads from database." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const rateLimit = await checkRateLimit(req, {
    actionName: "LEAD_CREATE_SUBMIT",
    maxRequests: 20,
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
      district,
      location,
      propertyType,
      solarRequirement,
      interestedSolution,
      approxCapacity,
      requestedCapacity,
      leadSource,
      source = "CRM Admin",
      status = "NEW",
      nextFollowUpDate,
      surveyRequestedDate,
      notes,
      message,
      monthlyBill,
      assignedSalesExecutiveId,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone number are required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.toString().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Format location
    const formattedLocation = location?.trim() || (
      city && district ? `${city.trim()}, ${district.trim()}` : (city || district || "Narmadapuram")
    );

    // Parse capacity
    const capInput = approxCapacity || requestedCapacity;
    let capFloat: number | null = null;
    if (capInput && capInput.toString().toLowerCase() !== "not sure") {
      const parsed = parseFloat(capInput.toString().replace(/[^\d.]/g, ""));
      if (!isNaN(parsed) && parsed > 0) {
        capFloat = parsed;
      }
    }

    // Bug #12: interestedSolution takes precedence over solarRequirement
    const solution = interestedSolution || solarRequirement || "On-Grid";
    const reqType = propertyType || "Residential";
    const src = leadSource || source || "Website";
    const followUp = nextFollowUpDate || surveyRequestedDate ? new Date(nextFollowUpDate || surveyRequestedDate) : null;

    // Bug #10: Preserve notes and message independently
    const finalNotes = notes !== undefined ? (notes ? notes.trim() : null) : (message ? message.trim() : null);
    const finalMessage = message !== undefined ? (message ? message.trim() : null) : (notes ? notes.trim() : null);

    // Bug #7 & #15: Concurrency-safe standardized lead ID
    const leadCode = await generateLeadId();

    const lead = await prisma.lead.create({
      data: {
        leadId: leadCode,
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        city: city?.trim() || formattedLocation,
        location: formattedLocation,
        propertyType: reqType,
        monthlyBill: monthlyBill || null,
        interestedSolution: solution,
        requestedCapacity: capFloat,
        message: finalMessage,
        notes: finalNotes,
        source: src,
        leadSource: src,
        status: status || "NEW",
        surveyRequestedDate: followUp,
        assignedSalesExecutiveId: assignedSalesExecutiveId || null,
      },
    });

    await logAuditEvent({
      entityType: "Lead",
      entityId: lead.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      source: "CRM",
      newValue: `Created lead ${lead.leadId} for ${lead.name} (${cleanPhone})`,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("[Leads POST Error]:", error);
    return NextResponse.json({ error: "Failed to create lead." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      status,
      notes,
      message,
      city,
      location,
      propertyType,
      monthlyBill,
      interestedSolution,
      solarRequirement,
      requestedCapacity,
      approxCapacity,
      leadSource,
      surveyRequestedDate,
      nextFollowUpDate,
      assignedSalesExecutiveId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required." }, { status: 400 });
    }

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const followUp = nextFollowUpDate || surveyRequestedDate
      ? new Date(nextFollowUpDate || surveyRequestedDate)
      : undefined;

    const capInput = approxCapacity || requestedCapacity;
    let capFloat: number | undefined = undefined;
    if (capInput !== undefined) {
      if (capInput && capInput.toString().toLowerCase() !== "not sure") {
        const parsed = parseFloat(capInput.toString().replace(/[^\d.]/g, ""));
        capFloat = !isNaN(parsed) && parsed > 0 ? parsed : undefined;
      }
    }

    // Bug #10: Notes and message update independently without overwriting each other
    // Bug #12: interestedSolution takes precedence over solarRequirement
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes ? notes.trim() : null }),
        ...(message !== undefined && { message: message ? message.trim() : null }),
        ...(city !== undefined && { city }),
        ...(location !== undefined && { location }),
        ...(propertyType !== undefined && { propertyType }),
        ...(monthlyBill !== undefined && { monthlyBill }),
        ...(interestedSolution !== undefined
          ? { interestedSolution }
          : solarRequirement !== undefined
          ? { interestedSolution: solarRequirement }
          : {}),
        ...(capFloat !== undefined && { requestedCapacity: capFloat }),
        ...(leadSource !== undefined && { leadSource, source: leadSource }),
        ...(followUp !== undefined && { surveyRequestedDate: followUp }),
        ...(assignedSalesExecutiveId !== undefined && {
          assignedSalesExecutiveId: assignedSalesExecutiveId || null,
        }),
      },
    });

    if (assignedSalesExecutiveId !== undefined && existing.customerId) {
      await prisma.customer
        .update({
          where: { id: existing.customerId },
          data: {
            assignedSalesExecutiveId: assignedSalesExecutiveId || null,
          },
        })
        .catch((e) => console.error("[Update Customer Assigned Agent Error]:", e));

      await prisma.solarProject
        .updateMany({
          where: { customerId: existing.customerId },
          data: {
            assignedSalesExecutiveId: assignedSalesExecutiveId || null,
          },
        })
        .catch((e) => console.error("[Update Project Assigned Agent Error]:", e));
    }

    const isAssignChange =
      assignedSalesExecutiveId !== undefined &&
      assignedSalesExecutiveId !== existing.assignedSalesExecutiveId;

    // Bug #13, #14, #35: Clean audit logging with ASSIGN action and newValueText
    await logAuditEvent({
      entityType: "Lead",
      entityId: id,
      fieldChanged: isAssignChange
        ? "assignedSalesExecutiveId"
        : status && status !== existing.status
        ? "status"
        : "details",
      previousValue: isAssignChange
        ? existing.assignedSalesExecutiveId
        : existing.status,
      newValue: isAssignChange
        ? assignedSalesExecutiveId || "unassigned"
        : status || existing.status,
      action: isAssignChange ? "ASSIGN" : "STATUS_CHANGE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      source: "CRM",
      newValueText: isAssignChange
        ? `Reassigned lead ${existing.name} to agent ${assignedSalesExecutiveId || "Unassigned"}`
        : `Updated lead ${existing.name}: status=${status || existing.status}`,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error("[Leads PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update lead." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required." }, { status: 400 });
    }

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    await prisma.lead.delete({ where: { id } });

    // Bug #30: Preserve snapshot of deleted entity in audit record
    await logAuditEvent({
      entityType: "Lead",
      entityId: id,
      fieldChanged: "all",
      previousValue: JSON.stringify({
        leadId: existing.leadId,
        name: existing.name,
        phone: existing.phone,
        city: existing.city,
        status: existing.status,
      }),
      newValue: "Deleted by administrator",
      action: "DELETE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      source: "CRM",
    });

    return NextResponse.json({ success: true, message: "Lead successfully deleted." });
  } catch (error: any) {
    console.error("[Leads DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete lead." }, { status: 500 });
  }
}
