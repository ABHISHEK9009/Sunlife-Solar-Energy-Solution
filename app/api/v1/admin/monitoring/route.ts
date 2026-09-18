export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plants = await prisma.plantMonitoring.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        project: {
          select: {
            projectId: true,
            projectName: true,
            plantCapacityKw: true,
            customer: { select: { customerId: true, fullName: true, primaryMobile: true } },
          },
        },
        readings: { orderBy: { timestamp: "desc" }, take: 10 },
      },
      take: 50,
    });
    return NextResponse.json({ success: true, plants });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plant telemetry." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, inverterProvider, inverterSerialNumber } = body;

    const plantCount = await prisma.plantMonitoring.count();
    const plantId = `SL-PLANT-${1000 + plantCount + 1}`;

    const plant = await prisma.plantMonitoring.create({
      data: {
        plantId,
        projectId,
        inverterProvider: inverterProvider || "Growatt",
        inverterSerialNumber: inverterSerialNumber || null,
        connectionStatus: "CONNECTED",
        systemHealth: "NORMAL",
        lastSynchronizedTime: new Date(),
      },
    });

    return NextResponse.json({ success: true, plant });
  } catch (error) {
    return NextResponse.json({ error: "Failed to link plant monitoring." }, { status: 500 });
  }
}
