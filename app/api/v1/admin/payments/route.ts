export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { customerId: true, fullName: true, primaryMobile: true } },
        project: { select: { projectId: true, projectName: true } },
      },
      take: 100,
    });
    return NextResponse.json({ success: true, payments });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payments." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, customerId, paymentStage, amountDue, dueDate } = body;

    const payCount = await prisma.payment.count();
    const paymentId = `SL-PAY-${1000 + payCount + 1}`;
    const due = parseFloat(amountDue);

    const payment = await prisma.payment.create({
      data: {
        paymentId,
        projectId,
        customerId,
        paymentStage,
        amountDue: due,
        amountPaid: 0,
        balanceRemaining: due,
        paymentStatus: "PENDING",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await logAuditEvent({
      entityType: "Payment",
      entityId: payment.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Created payment milestone ${paymentStage} for ₹${due}`,
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create payment milestone." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, amountPaid, paymentMethod, transactionReference, paymentStatus } = body;

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const paid = amountPaid !== undefined ? parseFloat(amountPaid) : existing.amountPaid;
    const balance = Math.max(0, existing.amountDue - paid);
    const status = paymentStatus || (balance === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "PENDING");

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        amountPaid: paid,
        balanceRemaining: balance,
        paymentStatus: status,
        paymentMethod: paymentMethod || existing.paymentMethod,
        transactionReference: transactionReference || existing.transactionReference,
        receivedDate: paid > 0 ? new Date() : existing.receivedDate,
        verifiedBy: "ADMIN",
      },
    });

    await logAuditEvent({
      entityType: "Payment",
      entityId: id,
      fieldChanged: "amountPaid",
      action: "UPDATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Recorded payment ₹${paid}, status: ${status}`,
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payment." }, { status: 500 });
  }
}
