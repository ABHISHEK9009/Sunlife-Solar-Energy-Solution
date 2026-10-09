export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";

export async function GET(req: Request) {
  const [agent, isAdmin] = await Promise.all([
    authenticateAgentRequest(req),
    authenticateAdminRequest(req),
  ]);

  if (!agent && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  try {
    const isPrivileged = isAdmin || agent?.role === "Admin" || agent?.role === "Manager";

    const whereClause: any = {};
    if (!isPrivileged && agent) {
      // Standard field technician only sees assigned tickets
      whereClause.assignedTechnicianId = agent.id;
    }

    const tickets = await prisma.serviceTicket.findMany({
      where: whereClause,
      orderBy: { submittedDate: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            fullName: true,
            primaryMobile: true,
            installationAddress: true,
          },
        },
        project: {
          select: {
            id: true,
            projectId: true,
            projectName: true,
            plantCapacityKw: true,
            solarType: true,
            discom: true,
            installationAddress: true,
          },
        },
        attachments: true,
      },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error("[Agent Tickets GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch assigned service tickets." }, { status: 500 });
  }
}
