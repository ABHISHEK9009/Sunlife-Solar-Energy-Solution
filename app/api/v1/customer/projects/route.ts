export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";

export async function GET(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const projects = await prisma.solarProject.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: {
        subsidy: {
          select: {
            currentStatus: true,
            expectedSubsidy: true,
            approvedSubsidy: true,
          },
        },
        monitoring: {
          select: {
            connectionStatus: true,
            totalGeneratedEnergyKwh: true,
            systemHealth: true,
          },
        },
        _count: {
          select: {
            tickets: { where: { status: { notIn: ["RESOLVED", "CANCELLED"] } } },
            documents: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      projects,
      activeProjectId: projects.length > 0 ? projects[0].id : null,
    });
  } catch (error: any) {
    console.error("[Customer Projects Error]:", error);
    return NextResponse.json({ error: "Failed to load projects." }, { status: 500 });
  }
}
