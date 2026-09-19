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
      propertyType,
      monthlyBill,
      interestedSolution,
      rooftopArea,
      message,
      source = "CRM Admin",
      status = "NEW",
      assignedSalesExecutiveId,
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

    const leadCount = await prisma.lead.count();
    const leadCode = `SL-LEAD-${new Date().getFullYear()}-${String(leadCount + 1).padStart(3, "0")}`;

    const lead = await prisma.lead.create({
      data: {
        leadId: leadCode,
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        city: city || "Narmadapuram",
        propertyType: propertyType || "Residential",
        monthlyBill: monthlyBill || null,
        interestedSolution: interestedSolution || "Rooftop Solar",
        rooftopArea: rooftopArea || null,
        message: message ? message.trim() : null,
        source,
        leadSource: source,
        status,
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
    const { id, status, notes, message, city, monthlyBill, interestedSolution, assignedSalesExecutiveId } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required." }, { status: 400 });
    }

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(message !== undefined && { message }),
        ...(city !== undefined && { city }),
        ...(monthlyBill !== undefined && { monthlyBill }),
        ...(interestedSolution !== undefined && { interestedSolution }),
        ...(assignedSalesExecutiveId !== undefined && { assignedSalesExecutiveId: assignedSalesExecutiveId || null }),
      },
    });

    await logAuditEvent({
      entityType: "Lead",
      entityId: id,
      fieldChanged: status && status !== existing.status ? "status" : "details",
      previousValue: existing.status,
      newValue: status || existing.status,
      action: "STATUS_CHANGE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      source: "CRM",
      newValueText: `Updated lead ${existing.name}: status=${status || existing.status}`,
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
