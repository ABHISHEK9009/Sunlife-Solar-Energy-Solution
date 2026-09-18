import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

const ALLOWED_PROJECT_STATUSES = [
  "ENQUIRY",
  "SURVEY_SCHEDULED",
  "SURVEY_COMPLETED",
  "DESIGN_PREPARED",
  "QUOTATION_PENDING",
  "QUOTATION_APPROVED",
  "ORDER_CONFIRMED",
  "DOCUMENTS_PENDING",
  "DOCUMENTS_SUBMITTED",
  "MATERIAL_PENDING",
  "MATERIAL_DISPATCHED",
  "INSTALLATION_SCHEDULED",
  "INSTALLATION_IN_PROGRESS",
  "INSTALLATION_COMPLETED",
  "NET_METERING_PENDING",
  "NET_METER_INSTALLED",
  "SUBSIDY_PROCESSING",
  "ACTIVE",
  "ON_HOLD",
  "CANCELLED",
] as const;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    const projects = await prisma.solarProject.findMany({
      where: {
        AND: [
          status ? { projectStatus: status } : {},
          customerId ? { customerId } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            customerId: true,
            fullName: true,
            primaryMobile: true,
            installationAddress: true,
          },
        },
        assignedEngineer: { select: { name: true, phone: true } },
        assignedSalesExecutive: { select: { name: true, phone: true } },
        subsidy: { select: { currentStatus: true, expectedSubsidy: true } },
        _count: { select: { timeline: true, documents: true, payments: true } },
      },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch projects." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      newStatus,
      customerRemarks,
      internalNotes,
      actorId = "ADMIN",
    } = body;

    if (!projectId || !newStatus) {
      return NextResponse.json({ error: "projectId and newStatus are required." }, { status: 400 });
    }

    if (!ALLOWED_PROJECT_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid project status "${newStatus}". Must be one of: ${ALLOWED_PROJECT_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const currentProject = await prisma.solarProject.findUnique({
      where: { id: projectId },
      include: { customer: true },
    });

    if (!currentProject) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const oldStatus = currentProject.projectStatus;

    return await prisma.$transaction(async (tx) => {
      // 1. Update project status
      const updatedProject = await tx.solarProject.update({
        where: { id: projectId },
        data: {
          projectStatus: newStatus,
          lastStatusUpdate: new Date(),
          ...(newStatus === "INSTALLATION_COMPLETED" && !currentProject.installationDate
            ? { installationDate: new Date() }
            : {}),
          ...(newStatus === "ACTIVE" && !currentProject.commissioningDate
            ? { commissioningDate: new Date() }
            : {}),
        },
      });

      // 2. Format customer-facing status title & description
      const readableStatus = newStatus.replace(/_/g, " ");
      const customerText =
        customerRemarks ||
        `Your solar project status has transitioned to "${readableStatus}". Our operations team is actively working on the next milestone.`;

      // 3. Create Timeline Event
      await tx.projectTimeline.create({
        data: {
          projectId: updatedProject.id,
          eventType: newStatus,
          eventTitle: `Project Status: ${readableStatus}`,
          customerDescription: customerText,
          internalDescription: internalNotes || `Status updated from ${oldStatus} to ${newStatus} by ${actorId}`,
          visibleToCustomer: true,
          createdBy: actorId,
        },
      });

      // 4. Create in-app notification for the customer
      await tx.notification.create({
        data: {
          customerId: currentProject.customerId,
          projectId: updatedProject.id,
          notificationType: "PROJECT_STATUS_UPDATE",
          title: `Project Update: ${readableStatus}`,
          message: customerText,
          deliveryChannel: "IN_APP",
          relatedScreenDeepLink: `/projects/${updatedProject.id}/timeline`,
        },
      });

      // 5. Audit Log
      await logAuditEvent({
        entityType: "SolarProject",
        entityId: updatedProject.id,
        fieldChanged: "projectStatus",
        previousValue: oldStatus,
        newValue: newStatus,
        action: "STATUS_CHANGE",
        actorId,
        actorType: "ADMIN",
        source: "CRM",
        newValueText: `Status transitioned from ${oldStatus} to ${newStatus}`,
      } as any);

      return NextResponse.json({
        success: true,
        project: updatedProject,
        message: `Project status successfully updated to ${readableStatus}.`,
      });
    });
  } catch (error: any) {
    console.error("[Admin Projects PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update project status." }, { status: 500 });
  }
}
