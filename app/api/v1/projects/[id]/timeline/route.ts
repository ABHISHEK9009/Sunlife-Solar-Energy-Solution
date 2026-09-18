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
    // Validate project ownership
    const project = await prisma.solarProject.findFirst({
      where: { id, customerId: customer.id },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Strictly fetch customer-facing events, filtering out internal CRM remarks
    const timeline = await prisma.projectTimeline.findMany({
      where: {
        projectId: id,
        visibleToCustomer: true,
      },
      orderBy: { eventDateTime: "desc" },
      select: {
        id: true,
        eventType: true,
        eventTitle: true,
        customerDescription: true,
        eventDateTime: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, timeline });
  } catch (error: any) {
    console.error("[Project Timeline Error]:", error);
    return NextResponse.json({ error: "Failed to fetch timeline." }, { status: 500 });
  }
}
