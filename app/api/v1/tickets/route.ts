export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const customerIds = [customer.id];
    const linkedCust = await prisma.customer.findUnique({
      where: { primaryMobile: customer.primaryMobile || customer.phone },
    });
    if (linkedCust && !customerIds.includes(linkedCust.id)) {
      customerIds.push(linkedCust.id);
    }

    const tickets = await prisma.serviceTicket.findMany({
      where: { customerId: { in: customerIds } },
      orderBy: { submittedDate: "desc" },
      include: {
        attachments: true,
        assignedTechnician: {
          select: {
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch service tickets." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, issueCategory, description, priority, attachments } = body;

    if (!issueCategory || !description) {
      return NextResponse.json(
        { error: "Issue category and description are required." },
        { status: 400 }
      );
    }

    let targetCustomerId = customer.id;
    let actorId = customer.customerId || customer.id;

    if (customer.isLead || customer.customerStatus === "LEAD") {
      let cust = await prisma.customer.findUnique({
        where: { primaryMobile: customer.primaryMobile || customer.phone },
      });
      if (!cust) {
        const year = new Date().getFullYear();
        const count = await prisma.customer.count();
        let seq = count + 1;
        let custId = `SL-CUST-${year}-${String(seq).padStart(4, "0")}`;
        while (await prisma.customer.findUnique({ where: { customerId: custId } })) {
          seq++;
          custId = `SL-CUST-${year}-${String(seq).padStart(4, "0")}`;
        }
        cust = await prisma.customer.create({
          data: {
            customerId: custId,
            fullName: customer.fullName || customer.name || "Customer",
            primaryMobile: customer.primaryMobile || customer.phone,
            email: customer.email || null,
            installationAddress: customer.location || customer.city || customer.address || "Site Address",
            propertyType: customer.propertyType || "RESIDENTIAL",
            customerStatus: "ACTIVE",
            appAccessEnabled: true,
          },
        });
      }
      targetCustomerId = cust.id;
      actorId = cust.customerId;
    }

    const ticketCount = await prisma.serviceTicket.count();
    const ticketCode = `SL-TCK-${1000 + ticketCount + 1}`;

    const ticket = await prisma.serviceTicket.create({
      data: {
        ticketId: ticketCode,
        customerId: targetCustomerId,
        projectId: projectId || null,
        issueCategory,
        description,
        priority: priority || "MEDIUM",
        status: "SUBMITTED",
        attachments: attachments && Array.isArray(attachments) ? {
          create: attachments.map((att: any) => ({
            fileUrl: att.fileUrl,
            fileType: att.fileType || "IMAGE",
            uploadedBy: actorId,
          })),
        } : undefined,
      },
      include: {
        attachments: true,
      },
    });

    await logAuditEvent({
      entityType: "ServiceTicket",
      entityId: ticket.id,
      fieldChanged: "status",
      action: "CREATE",
      actorId: actorId,
      actorType: "CUSTOMER",
      source: "APP",
      newValue: `Created service ticket ${ticket.ticketId}: ${issueCategory}`,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to submit service ticket." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ticketId, action, customerRating, customerRemarks } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required." }, { status: 400 });
    }

    const existingTicket = await prisma.serviceTicket.findFirst({
      where: {
        OR: [{ id: ticketId }, { ticketId }],
        customerId: customer.id,
      },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found or unauthorized access." }, { status: 404 });
    }

    const updateData: any = {};

    if (action === "CONFIRM_RESOLUTION") {
      updateData.status = "RESOLVED";
      updateData.resolvedDate = new Date();
    } else if (action === "DISPUTE" || action === "REOPEN") {
      updateData.status = "REOPENED";
    }

    if (customerRating !== undefined && customerRating !== null) {
      updateData.customerRating = Math.min(5, Math.max(1, parseInt(customerRating, 10)));
    }

    if (customerRemarks !== undefined && customerRemarks !== null) {
      updateData.customerVisibleNotes = customerRemarks;
    }

    const updated = await prisma.serviceTicket.update({
      where: { id: existingTicket.id },
      data: updateData,
    });

    if (action) {
      await logAuditEvent({
        entityType: "ServiceTicket",
        entityId: existingTicket.id,
        fieldChanged: "status",
        previousValue: existingTicket.status,
        newValue: updated.status,
        action: "STATUS_CHANGE",
        actorId: customer.customerId,
        actorType: "CUSTOMER",
        source: "APP",
      });
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error("[Customer Ticket PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update service ticket." }, { status: 500 });
  }
}
