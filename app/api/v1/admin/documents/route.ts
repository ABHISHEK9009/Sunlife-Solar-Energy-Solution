export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { uploadedDate: "desc" },
      include: {
        customer: { select: { customerId: true, fullName: true, primaryMobile: true } },
        project: { select: { projectId: true, projectName: true } },
      },
      take: 100,
    });
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, verificationStatus, customerCanView } = body;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(verificationStatus && { verificationStatus, verifiedBy: "ADMIN" }),
        ...(customerCanView !== undefined && { customerCanView }),
      },
    });

    await logAuditEvent({
      entityType: "Document",
      entityId: id,
      fieldChanged: "verificationStatus",
      action: "STATUS_CHANGE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Document verification set to ${verificationStatus}`,
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update document." }, { status: 500 });
  }
}
