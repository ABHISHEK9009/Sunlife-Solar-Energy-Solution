import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";

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
    const payments = await prisma.payment.findMany({
      where: {
        projectId: id,
        customerId: customer.id,
      },
      orderBy: { createdAt: "asc" },
    });

    // Server-side authoritative financial aggregation
    let totalDue = 0;
    let totalPaid = 0;

    const formattedMilestones = payments.map((p) => {
      totalDue += p.amountDue;
      totalPaid += p.amountPaid;
      const calculatedBalance = Math.max(0, p.amountDue - p.amountPaid);

      return {
        id: p.id,
        paymentId: p.paymentId,
        stage: p.paymentStage,
        amountDue: p.amountDue,
        amountPaid: p.amountPaid,
        balanceRemaining: calculatedBalance,
        status: p.paymentStatus,
        dueDate: p.dueDate,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference,
        receivedDate: p.receivedDate,
        receiptDocumentId: p.receiptDocumentId,
      };
    });

    const overallBalance = Math.max(0, totalDue - totalPaid);

    return NextResponse.json({
      success: true,
      summary: {
        totalContractValue: totalDue,
        totalPaid,
        outstandingBalance: overallBalance,
        isFullyPaid: overallBalance === 0 && totalDue > 0,
      },
      milestones: formattedMilestones,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch payment details." }, { status: 500 });
  }
}
