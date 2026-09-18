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

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status: newStage,
        ...(notes ? { notes } : {}),
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
