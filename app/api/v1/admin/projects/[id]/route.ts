export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const project = await prisma.solarProject.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
      },
      include: {
        customer: true,
        assignedEngineer: { select: { id: true, name: true, phone: true } },
        assignedSalesExecutive: { select: { id: true, name: true, phone: true } },
        timeline: { orderBy: { eventDateTime: "desc" } },
        quotations: { orderBy: { versionNumber: "desc" } },
        documents: { orderBy: { uploadedDate: "desc" } },
        payments: { orderBy: { createdAt: "asc" } },
        subsidy: {
          include: {
            history: { orderBy: { timestamp: "desc" } },
          },
        },
        monitoring: {
          include: {
            readings: { orderBy: { timestamp: "desc" }, take: 15 },
          },
        },
        surveys: { orderBy: { scheduledDateTime: "desc" } },
        tickets: { orderBy: { submittedDate: "desc" } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch project command center data." }, { status: 500 });
  }
}

// Add Timeline Milestone Event
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { eventType, eventTitle, customerDescription, internalDescription, visibleToCustomer = true } = body;

    if (!eventTitle || !customerDescription) {
      return NextResponse.json({ error: "Event title and customer description are required." }, { status: 400 });
    }

    const project = await prisma.solarProject.findFirst({
      where: { OR: [{ id }, { projectId: id }] },
    });

    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const timeline = await prisma.projectTimeline.create({
      data: {
        projectId: project.id,
        eventType: eventType || "MILESTONE_UPDATE",
        eventTitle,
        customerDescription,
        internalDescription: internalDescription || null,
        visibleToCustomer: Boolean(visibleToCustomer),
        createdBy: "ADMIN",
      },
    });

    if (visibleToCustomer) {
      await prisma.notification.create({
        data: {
          customerId: project.customerId,
          projectId: project.id,
          notificationType: "TIMELINE_UPDATE",
          title: eventTitle,
          message: customerDescription,
          deliveryChannel: "IN_APP",
          relatedScreenDeepLink: `/projects/${project.id}/timeline`,
        },
      });
    }

    await logAuditEvent({
      entityType: "SolarProject",
      entityId: project.id,
      fieldChanged: "timeline",
      action: "CREATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Logged timeline event: ${eventTitle}`,
    });

    return NextResponse.json({ success: true, timeline });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create timeline event." }, { status: 500 });
  }
}

// Update Equipment Hardware Specs
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      panelBrandModel,
      panelQuantity,
      inverterBrandModel,
      inverterSerialNumber,
      warrantyStartDate,
      warrantyEndDate,
      discom,
      consumerNumber,
    } = body;

    const project = await prisma.solarProject.findFirst({
      where: { OR: [{ id }, { projectId: id }] },
    });

    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const updated = await prisma.solarProject.update({
      where: { id: project.id },
      data: {
        ...(panelBrandModel !== undefined && { panelBrandModel }),
        ...(panelQuantity !== undefined && { panelQuantity: parseInt(panelQuantity, 10) }),
        ...(inverterBrandModel !== undefined && { inverterBrandModel }),
        ...(inverterSerialNumber !== undefined && { inverterSerialNumber }),
        ...(warrantyStartDate && { warrantyStartDate: new Date(warrantyStartDate) }),
        ...(warrantyEndDate && { warrantyEndDate: new Date(warrantyEndDate) }),
        ...(discom && { discom }),
        ...(consumerNumber !== undefined && { consumerNumber }),
      },
    });

    await logAuditEvent({
      entityType: "SolarProject",
      entityId: project.id,
      fieldChanged: "hardwareSpecs",
      action: "UPDATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: "Updated equipment specifications & warranty details",
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update project specs." }, { status: 500 });
  }
}
