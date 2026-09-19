export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";

export async function GET(req: Request) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  try {
    const surveys = await prisma.siteSurvey.findMany({
      where: {
        OR: [
          { surveyEngineerId: agent.id },
          { customer: { assignedSalesExecutiveId: agent.id } },
          ...(agent.employeeId ? [{ surveyEngineerId: agent.employeeId }] : []),
        ],
      },
      take: 50,
      orderBy: { scheduledDateTime: "asc" },
      include: {
        customer: {
          select: {
            fullName: true,
            installationAddress: true,
            primaryMobile: true,
          },
        },
      },
    });

    const visits = surveys.map((s) => {
      const timeStr = s.scheduledDateTime
        ? new Date(s.scheduledDateTime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "10:30 AM";

      const photos = Array.isArray(s.sitePhotographs)
        ? (s.sitePhotographs as string[])
        : [];

      return {
        id: s.id,
        time: timeStr,
        customerName: s.customer.fullName,
        purpose: s.roofType ? `Site survey (${s.roofType})` : "Site survey",
        location: s.customer.installationAddress || "Jaipur",
        isCompleted: s.surveyStatus === "COMPLETED",
        latitude: s.gpsLatitude || null,
        longitude: s.gpsLongitude || null,
        photoPaths: photos,
        checklist: [
          s.availableRoofAreaSqFt != null && s.availableRoofAreaSqFt > 0,
          s.recommendedCapacityKw != null && s.recommendedCapacityKw > 0,
          s.shadowInfo != null && s.shadowInfo.length > 0,
          photos.length > 0,
        ],
      };
    });

    return NextResponse.json({ success: true, visits });
  } catch (error: any) {
    console.error("[Agent Visits GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch visits." }, { status: 500 });
  }
}
