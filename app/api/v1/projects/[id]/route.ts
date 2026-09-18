export const dynamic = "force-dynamic";

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
    const project = await prisma.solarProject.findFirst({
      where: {
        id,
        customerId: customer.id, // Enforce customer-level data isolation
      },
      include: {
        assignedEngineer: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        assignedSalesExecutive: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        subsidy: true,
        monitoring: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("[Project Details Error]:", error);
    return NextResponse.json({ error: "Failed to fetch project details." }, { status: 500 });
  }
}
