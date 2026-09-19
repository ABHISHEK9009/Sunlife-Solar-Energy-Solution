export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });

    const estimates = await prisma.calculatorEstimate.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, leads, estimates });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads from database." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const solution = solarRequirement || interestedSolution || "On-Grid";
    const reqType = propertyType || "Residential";
    const src = leadSource || source || "Website";
    const followUp = nextFollowUpDate || surveyRequestedDate ? new Date(nextFollowUpDate || surveyRequestedDate) : null;
    const remark = notes || message || null;

    const leadCount = await prisma.lead.count();
    const leadCode = `SL-LEAD-${new Date().getFullYear()}-${String(leadCount + 1).padStart(3, "0")}`;

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
        message: remark,
        notes: remark,
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

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes, message: notes }),
        ...(message !== undefined && { message, notes: message }),
        ...(city !== undefined && { city }),
        ...(location !== undefined && { location }),
        ...(propertyType !== undefined && { propertyType }),
        ...(monthlyBill !== undefined && { monthlyBill }),
        ...(interestedSolution !== undefined && { interestedSolution }),
        ...(solarRequirement !== undefined && { interestedSolution: solarRequirement }),
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
    } as any);

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

    await logAuditEvent({
      entityType: "Lead",
      entityId: id,
      fieldChanged: "all",
      previousValue: existing.name,
      newValue: null,
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
