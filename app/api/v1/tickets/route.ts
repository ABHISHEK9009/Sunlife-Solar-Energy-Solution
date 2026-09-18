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
    const tickets = await prisma.serviceTicket.findMany({
      where: { customerId: customer.id },
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

    const ticketCount = await prisma.serviceTicket.count();
    const ticketCode = `SL-TCK-${1000 + ticketCount + 1}`;

    const ticket = await prisma.serviceTicket.create({
      data: {
        ticketId: ticketCode,
        customerId: customer.id,
        projectId: projectId || null,
        issueCategory,
        description,
        priority: priority || "MEDIUM",
        status: "SUBMITTED",
        attachments: attachments && Array.isArray(attachments) ? {
          create: attachments.map((att: any) => ({
            fileUrl: att.fileUrl,
            fileType: att.fileType || "IMAGE",
            uploadedBy: customer.customerId,
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
      actorId: customer.customerId,
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
    const { ticketId, customerRating, customerRemarks } = body;

    if (!ticketId || customerRating === undefined) {
      return NextResponse.json({ error: "ticketId and customerRating are required." }, { status: 400 });
    }

    const updated = await prisma.serviceTicket.update({
      where: {
        id: ticketId,
        customerId: customer.id,
      },
      data: {
        customerRating: Math.min(5, Math.max(1, parseInt(customerRating, 10))),
        customerVisibleNotes: customerRemarks || undefined,
      },
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}
