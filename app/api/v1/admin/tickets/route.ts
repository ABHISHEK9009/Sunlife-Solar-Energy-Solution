import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET() {
  try {
    const tickets = await prisma.serviceTicket.findMany({
      orderBy: { submittedDate: "desc" },
      include: {
        customer: { select: { customerId: true, fullName: true, primaryMobile: true } },
        project: { select: { projectId: true, projectName: true } },
        assignedTechnician: { select: { id: true, name: true, phone: true } },
        attachments: true,
      },
      take: 100,
    });
    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tickets." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, assignedTechnicianId, scheduledVisit, resolutionDetails, internalNotes } = body;

    const existing = await prisma.serviceTicket.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const updated = await prisma.serviceTicket.update({
      where: { id },
      data: {
        ...(status && {
          status,
          ...(status === "RESOLVED" ? { resolvedDate: new Date() } : {}),
        }),
        ...(assignedTechnicianId !== undefined && { assignedTechnicianId }),
        ...(scheduledVisit && { scheduledVisit: new Date(scheduledVisit) }),
        ...(resolutionDetails !== undefined && { resolutionDetails }),
        ...(internalNotes !== undefined && { internalNotes }),
      },
    });

    await logAuditEvent({
      entityType: "ServiceTicket",
      entityId: id,
      fieldChanged: "status",
      previousValue: existing.status,
      newValue: status || existing.status,
      action: "STATUS_CHANGE",
      actorId: "ADMIN",
      actorType: "ADMIN",
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update ticket." }, { status: 500 });
  }
}
