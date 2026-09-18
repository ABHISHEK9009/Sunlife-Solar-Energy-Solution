export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [{ id }, { customerId: id }],
      },
      include: {
        assignedSalesExecutive: { select: { name: true, phone: true, role: true } },
        projects: {
          orderBy: { createdAt: "desc" },
          include: {
            subsidy: { select: { currentStatus: true, expectedSubsidy: true } },
            monitoring: { select: { connectionStatus: true, totalGeneratedEnergyKwh: true } },
            payments: { select: { amountDue: true, amountPaid: true, balanceRemaining: true } },
          },
        },
        documents: { orderBy: { uploadedDate: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        surveys: { orderBy: { scheduledDateTime: "desc" } },
        tickets: { orderBy: { submittedDate: "desc" } },
        referralsSent: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customer profile." }, { status: 500 });
  }
}
