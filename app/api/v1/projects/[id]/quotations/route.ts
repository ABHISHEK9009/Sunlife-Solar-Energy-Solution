export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = params;

  try {
    const quotations = await prisma.quotation.findMany({
      where: {
        projectId: id,
        project: { customerId: customer.id },
      },
      orderBy: { versionNumber: "desc" },
    });

    return NextResponse.json({
      success: true,
      quotations,
      latestQuotation: quotations.length > 0 ? quotations[0] : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch quotations." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const { quotationId, action, remarks } = body; // action: "APPROVE" | "REQUEST_REVISION"

    if (!quotationId || !["APPROVE", "REQUEST_REVISION"].includes(action)) {
      return NextResponse.json({ error: "Invalid action or quotationId." }, { status: 400 });
    }

    const quotation = await prisma.quotation.findFirst({
      where: {
        id: quotationId,
        projectId: id,
        project: { customerId: customer.id },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REVISION_REQUESTED";

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        approvalStatus: newStatus,
        approvedDate: action === "APPROVE" ? new Date() : null,
        customerRemarks: remarks || null,
      },
    });

    // Create a timeline entry and audit log
    await prisma.projectTimeline.create({
      data: {
        projectId: id,
        eventType: action === "APPROVE" ? "QUOTATION_APPROVED" : "QUOTATION_REVISION_REQUESTED",
        eventTitle: action === "APPROVE" ? "Quotation Approved by Customer" : "Quotation Revision Requested",
        customerDescription: action === "APPROVE"
          ? `You have approved Quotation Version ${quotation.versionNumber}. Our engineering and operations team has commenced project documentation.`
          : `You requested a revision for Quotation Version ${quotation.versionNumber}: "${remarks || "No additional comments"}"`,
        internalDescription: `Customer ${customer.customerId} submitted action ${action} for quotation ${quotation.quotationId}.`,
        visibleToCustomer: true,
        createdBy: customer.customerId,
      },
    });

    if (action === "APPROVE") {
      await prisma.solarProject.update({
        where: { id },
        data: {
          projectStatus: "QUOTATION_APPROVED",
          lastStatusUpdate: new Date(),
        },
      });
    }

    await logAuditEvent({
      entityType: "Quotation",
      entityId: quotation.id,
      fieldChanged: "approvalStatus",
      previousValue: quotation.approvalStatus,
      newValue: newStatus,
      action: "STATUS_CHANGE",
      actorId: customer.customerId,
      actorType: "CUSTOMER",
      source: "APP",
    });

    return NextResponse.json({ success: true, quotation: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to submit quotation action." }, { status: 500 });
  }
}
