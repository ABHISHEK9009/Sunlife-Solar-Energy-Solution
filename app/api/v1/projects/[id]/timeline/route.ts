export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";
import { logAuditEvent } from "@/lib/crm/audit-logger";

const VALID_STATUSES = new Set([
  "PENDING",
  "IN_PROGRESS",
  "BLOCKED",
  "WAITING_ON_CUSTOMER",
  "COMPLETED",
  "VERIFIED",
]);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Authenticate either customer or agent/admin
  const [customer, agent, isAdmin] = await Promise.all([
    authenticateCustomerRequest(req),
    authenticateAgentRequest(req),
    authenticateAdminRequest(req),
  ]);

  if (!customer && !agent && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const project = await prisma.solarProject.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
      },
      select: {
        id: true,
        customerId: true,
        assignedEngineerId: true,
        assignedSalesExecutiveId: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Customer can only view their own project
    if (customer && project.customerId !== customer.id) {
      return NextResponse.json({ error: "Forbidden: Cannot access foreign project." }, { status: 403 });
    }

    // Agent can only view if assigned or privileged
    if (!customer && !isAdmin && agent) {
      const isPrivileged = agent.role === "Admin" || agent.role === "Manager";
      const isAssigned = project.assignedEngineerId === agent.id || project.assignedSalesExecutiveId === agent.id;
      if (!isPrivileged && !isAssigned) {
        return NextResponse.json({ error: "Forbidden: Not assigned to this project." }, { status: 403 });
      }
    }

    const isCustomerView = Boolean(customer);
    const timeline = await prisma.projectTimeline.findMany({
      where: {
        projectId: project.id,
        ...(isCustomerView ? { visibleToCustomer: true } : {}),
      },
      orderBy: { eventDateTime: "desc" },
      select: {
        id: true,
        eventType: true,
        eventTitle: true,
        customerDescription: true,
        internalDescription: !isCustomerView,
        eventDateTime: true,
        status: true,
        createdBy: true,
        visibleToCustomer: true,
      },
    });

    return NextResponse.json({ success: true, timeline });
  } catch (error: any) {
    console.error("[Project Timeline GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch timeline." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Only authorized agents or admins can record milestone updates
  const [agent, isAdmin] = await Promise.all([
    authenticateAgentRequest(req),
    authenticateAdminRequest(req),
  ]);

  if (!agent && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Employee or admin access required." }, { status: 401 });
  }

  try {
    const project = await prisma.solarProject.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
      },
      include: {
        customer: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Role & Assignment Authorization Gate
    if (!isAdmin && agent) {
      const isPrivileged = agent.role === "Admin" || agent.role === "Manager";
      const isAssigned =
        project.assignedEngineerId === agent.id ||
        project.assignedSalesExecutiveId === agent.id;
      if (!isPrivileged && !isAssigned) {
        return NextResponse.json(
          { error: "Forbidden: You are not assigned to update this installation project." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      eventType,
      eventTitle,
      customerDescription,
      internalDescription,
      status = "COMPLETED",
      visibleToCustomer = true,
      newProjectStage,
    } = body;

    if (!eventType || !eventTitle) {
      return NextResponse.json({ error: "eventType and eventTitle are required." }, { status: 400 });
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${Array.from(VALID_STATUSES).join(", ")}` },
        { status: 400 }
      );
    }

    // Verification check: Incomplete work cannot be marked VERIFIED
    if (status === "VERIFIED" && !customerDescription && !internalDescription) {
      return NextResponse.json(
        { error: "Cannot verify milestone without completion details or inspection notes." },
        { status: 400 }
      );
    }

    const actorId = agent ? (agent.employeeId || agent.name || agent.id) : "ADMIN";

    const milestoneEvent = await prisma.projectTimeline.create({
      data: {
        projectId: project.id,
        eventType,
        eventTitle,
        customerDescription: customerDescription || `${eventTitle} has been recorded by engineering team.`,
        internalDescription: internalDescription || null,
        status,
        createdBy: actorId,
        visibleToCustomer: Boolean(visibleToCustomer),
      },
    });

    // If newProjectStage is supplied or milestone signifies key stage, update SolarProject
    const updateData: any = { lastStatusUpdate: new Date() };
    if (newProjectStage) {
      updateData.projectStatus = newProjectStage;
    }
    if (eventType === "INSTALLATION_COMPLETED" || newProjectStage === "INSTALLATION_COMPLETED") {
      updateData.installationDate = new Date();
      updateData.projectStatus = "INSTALLATION_COMPLETED";
    }

    if (Object.keys(updateData).length > 1) {
      await prisma.solarProject.update({
        where: { id: project.id },
        data: updateData,
      });
    }

    await logAuditEvent({
      entityType: "SolarProject",
      entityId: project.id,
      fieldChanged: "timeline",
      action: "UPDATE",
      actorId,
      actorType: "EMPLOYEE",
      source: "APP",
      newValue: `Milestone updated: ${eventTitle} (${status})`,
    });

    return NextResponse.json({ success: true, milestone: milestoneEvent });
  } catch (error: any) {
    console.error("[Project Timeline POST Error]:", error);
    return NextResponse.json({ error: "Failed to record installation milestone." }, { status: 500 });
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
    return NextResponse.json({ error: "Unauthorized: Employee or admin access required." }, { status: 401 });
  }

  try {
    const project = await prisma.solarProject.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!isAdmin && agent) {
      const isPrivileged = agent.role === "Admin" || agent.role === "Manager";
      const isAssigned =
        project.assignedEngineerId === agent.id ||
        project.assignedSalesExecutiveId === agent.id;
      if (!isPrivileged && !isAssigned) {
        return NextResponse.json(
          { error: "Forbidden: You are not assigned to update this installation project." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { milestoneId, status, customerDescription, internalDescription } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: "milestoneId is required." }, { status: 400 });
    }

    const existingMilestone = await prisma.projectTimeline.findFirst({
      where: { id: milestoneId, projectId: project.id },
    });

    if (!existingMilestone) {
      return NextResponse.json({ error: "Milestone event not found." }, { status: 404 });
    }

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${Array.from(VALID_STATUSES).join(", ")}` },
        { status: 400 }
      );
    }

    // Incomplete work cannot be falsely verified
    if (status === "VERIFIED" && existingMilestone.status === "PENDING" && !customerDescription) {
      return NextResponse.json(
        { error: "Cannot mark incomplete milestone as VERIFIED without work completion notes." },
        { status: 400 }
      );
    }

    const updated = await prisma.projectTimeline.update({
      where: { id: milestoneId },
      data: {
        ...(status ? { status } : {}),
        ...(customerDescription ? { customerDescription } : {}),
        ...(internalDescription !== undefined ? { internalDescription } : {}),
      },
    });

    const actorId = agent ? (agent.employeeId || agent.name || agent.id) : "ADMIN";
    await logAuditEvent({
      entityType: "ProjectTimeline",
      entityId: milestoneId,
      fieldChanged: "status",
      previousValue: existingMilestone.status || "UNKNOWN",
      newValue: status || existingMilestone.status || "UPDATED",
      action: "UPDATE",
      actorId,
      actorType: "EMPLOYEE",
      source: "APP",
    });

    return NextResponse.json({ success: true, milestone: updated });
  } catch (error: any) {
    console.error("[Project Timeline PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update milestone." }, { status: 500 });
  }
}


