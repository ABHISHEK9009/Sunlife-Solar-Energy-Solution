export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";
import { logAuditEvent } from "@/lib/crm/audit-logger";

const VALID_TECH_STATUSES = new Set([
  "ASSIGNED",
  "VISIT_SCHEDULED",
  "TECHNICIAN_VISITING",
  "WORK_COMPLETED",
]);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const [agent, isAdmin] = await Promise.all([
    authenticateAgentRequest(req),
    authenticateAdminRequest(req),
  ]);

  if (!agent && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const ticket = await prisma.serviceTicket.findFirst({
      where: {
        OR: [{ id }, { ticketId: id }],
      },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            fullName: true,
            primaryMobile: true,
            installationAddress: true,
          },
        },
        project: {
          select: {
            id: true,
            projectId: true,
            projectName: true,
            plantCapacityKw: true,
            solarType: true,
            discom: true,
            installationAddress: true,
          },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Service ticket not found" }, { status: 404 });
    }

    const isPrivileged = isAdmin || agent?.role === "Admin" || agent?.role === "Manager";
    if (!isPrivileged && agent && ticket.assignedTechnicianId !== agent.id) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this service ticket." }, { status: 403 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("[Agent Ticket Detail Error]:", error);
    return NextResponse.json({ error: "Failed to fetch ticket." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const [agent, isAdmin] = await Promise.all([
    authenticateAgentRequest(req),
    authenticateAdminRequest(req),
  ]);

  if (!agent && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const ticket = await prisma.serviceTicket.findFirst({
      where: {
        OR: [{ id }, { ticketId: id }],
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Service ticket not found" }, { status: 404 });
    }

    const isPrivileged = isAdmin || agent?.role === "Admin" || agent?.role === "Manager";
    if (!isPrivileged && agent && ticket.assignedTechnicianId !== agent.id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot update a ticket not assigned to you." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      status,
      scheduledVisit,
      visitTimeRange,
      resolutionDetails,
      internalNotes,
      customerVisibleNotes,
      attachments,
    } = body;

    if (status && !VALID_TECH_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Technicians can set: ${Array.from(VALID_TECH_STATUSES).join(", ")}. Final RESOLVED requires customer confirmation.`,
        },
        { status: 400 }
      );
    }

    // Work completion gate: Cannot mark WORK_COMPLETED without diagnosis/repair notes
    if (status === "WORK_COMPLETED" && !resolutionDetails && !ticket.resolutionDetails) {
      return NextResponse.json(
        { error: "Cannot mark work as completed without repair/diagnosis notes (resolutionDetails)." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (scheduledVisit) updateData.scheduledVisit = new Date(scheduledVisit);
    if (visitTimeRange) updateData.visitTimeRange = visitTimeRange;
    if (resolutionDetails) updateData.resolutionDetails = resolutionDetails;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (customerVisibleNotes !== undefined) updateData.customerVisibleNotes = customerVisibleNotes;

    const updated = await prisma.serviceTicket.update({
      where: { id: ticket.id },
      data: updateData,
    });

    // Save repair evidence attachments if supplied
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const actorId = agent ? (agent.employeeId || agent.name || agent.id) : "ADMIN";
      for (const att of attachments) {
        if (att.fileUrl) {
          await prisma.ticketAttachment.create({
            data: {
              ticketId: ticket.id,
              fileUrl: att.fileUrl,
              fileType: att.fileType || "IMAGE",
              uploadedBy: actorId,
            },
          });
        }
      }
    }

    const actorId = agent ? (agent.employeeId || agent.name || agent.id) : "ADMIN";
    await logAuditEvent({
      entityType: "ServiceTicket",
      entityId: ticket.id,
      fieldChanged: "status",
      previousValue: ticket.status,
      newValue: status || ticket.status,
      action: "UPDATE",
      actorId,
      actorType: "EMPLOYEE",
      source: "APP",
    });

    const refreshed = await prisma.serviceTicket.findUnique({
      where: { id: ticket.id },
      include: { attachments: true },
    });

    return NextResponse.json({ success: true, ticket: refreshed });
  } catch (error: any) {
    console.error("[Agent Ticket PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update ticket." }, { status: 500 });
  }
}
