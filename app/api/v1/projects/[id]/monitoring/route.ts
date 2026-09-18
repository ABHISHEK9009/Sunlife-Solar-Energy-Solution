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
    const monitoring = await prisma.plantMonitoring.findFirst({
      where: {
        projectId: id,
        project: { customerId: customer.id },
      },
      include: {
        readings: {
          orderBy: { timestamp: "desc" },
          take: 30, // Latest 30 reading intervals (e.g. daily/hourly)
        },
        maintenanceRecords: {
          orderBy: { lastCheckedDate: "desc" },
          take: 1,
        },
      },
    });

    if (!monitoring) {
      return NextResponse.json({
        success: true,
        monitoring: null,
        message: "Inverter monitoring will become active once commissioning is complete.",
      });
    }

    return NextResponse.json({ success: true, monitoring });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch plant telemetry." }, { status: 500 });
  }
}
