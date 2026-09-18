import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET() {
  try {
    const subsidies = await prisma.subsidyRecord.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        customer: { select: { customerId: true, fullName: true, primaryMobile: true } },
        project: { select: { projectId: true, projectName: true, plantCapacityKw: true } },
        history: { orderBy: { timestamp: "desc" }, take: 5 },
      },
      take: 100,
    });
    return NextResponse.json({ success: true, subsidies });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subsidies." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, currentStatus, portalRegistrationNumber, approvedSubsidy, remarks } = body;

    const existing = await prisma.subsidyRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Subsidy record not found" }, { status: 404 });

    const fromStatus = existing.currentStatus;
    const toStatus = currentStatus || fromStatus;

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.subsidyRecord.update({
        where: { id },
        data: {
          currentStatus: toStatus,
          lastUpdatedDate: new Date(),
          ...(portalRegistrationNumber && { portalRegistrationNumber }),
          ...(approvedSubsidy !== undefined && { approvedSubsidy: parseFloat(approvedSubsidy) }),
        },
      });

      if (fromStatus !== toStatus) {
        await tx.subsidyHistory.create({
          data: {
            subsidyRecordId: id,
            fromStatus,
            toStatus,
            changedBy: "ADMIN",
            changeRemarks: remarks || `Advanced status to ${toStatus}`,
          },
        });
      }

      return record;
    });

    await logAuditEvent({
      entityType: "SubsidyRecord",
      entityId: id,
      fieldChanged: "currentStatus",
      previousValue: fromStatus,
      newValue: toStatus,
      action: "STATUS_CHANGE",
      actorId: "ADMIN",
      actorType: "ADMIN",
    });

    return NextResponse.json({ success: true, subsidy: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update subsidy." }, { status: 500 });
  }
}
