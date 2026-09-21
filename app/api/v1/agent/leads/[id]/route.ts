import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const { stage, status, notes } = body;

    const newStage = stage || status;
    if (!newStage) {
      return NextResponse.json({ error: "Stage/status is required." }, { status: 400 });
    }

    const ALLOWED_LEAD_STATUSES = [
      "NEW",
      "CONTACTED",
      "SURVEY_SCHEDULED",
      "SURVEY_COMPLETED",
      "QUOTATION_SENT",
      "NEGOTIATION",
      "CONVERTED",
      "LOST",
    ];

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    // Verify agent is assigned, or lead is unassigned, or agent is administrator/manager
    const isAssigned =
      !existingLead.assignedSalesExecutiveId ||
      existingLead.assignedSalesExecutiveId === agent.id;

    if (!isAssigned && agent.role !== "Admin" && agent.role !== "Manager") {
      return NextResponse.json(
        { error: "Access denied. This lead is assigned to another representative." },
        { status: 403 }
      );
    }

    const normalizedStage = newStage.toUpperCase().replace(/\s+/g, "_");
    const validStatus = ALLOWED_LEAD_STATUSES.find(
      (s) => s === normalizedStage || s === newStage
    );

    if (!validStatus) {
      return NextResponse.json(
        {
          error: `Invalid lead status "${newStage}". Allowed values: ${ALLOWED_LEAD_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status: validStatus,
        assignedSalesExecutiveId: existingLead.assignedSalesExecutiveId || agent.id,
        ...(notes ? { notes: notes.trim() } : {}),
      },
    });

    try {
      await logAuditEvent({
        entityType: "Lead",
        entityId: id,
        fieldChanged: "status",
        previousValue: existingLead.status,
        newValue: newStage,
        action: "UPDATE",
        actorId: agent.employeeId || agent.id,
        actorType: "EMPLOYEE",
        source: "APP",
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      lead: {
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        location: updated.location || updated.city,
        stage: updated.status,
        monthlyBill: `₹${updated.monthlyBill}/month`,
        notes: updated.notes,
        createdAt: updated.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[Agent Lead PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update lead." }, { status: 500 });
  }
}
