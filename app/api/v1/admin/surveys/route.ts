import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET() {
  try {
    const surveys = await prisma.siteSurvey.findMany({
      orderBy: { scheduledDateTime: "desc" },
      include: {
        customer: { select: { customerId: true, fullName: true, primaryMobile: true } },
        project: { select: { projectId: true, projectName: true } },
        surveyEngineer: { select: { name: true, phone: true } },
      },
      take: 100,
    });
    return NextResponse.json({ success: true, surveys });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch surveys." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerId, projectId, scheduledDateTime, surveyEngineerId, roofType, availableRoofAreaSqFt, recommendedCapacityKw } = body;

    const surveyCount = await prisma.siteSurvey.count();
    const surveyId = `SL-SRV-${1000 + surveyCount + 1}`;

    const survey = await prisma.siteSurvey.create({
      data: {
        surveyId,
        customerId,
        projectId: projectId || null,
        scheduledDateTime: new Date(scheduledDateTime),
        surveyEngineerId: surveyEngineerId || null,
        roofType: roofType || "Concrete Flat",
        availableRoofAreaSqFt: availableRoofAreaSqFt ? parseFloat(availableRoofAreaSqFt) : null,
        recommendedCapacityKw: recommendedCapacityKw ? parseFloat(recommendedCapacityKw) : null,
        surveyStatus: "SCHEDULED",
      },
    });

    await logAuditEvent({
      entityType: "SiteSurvey",
      entityId: survey.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Scheduled survey ${survey.surveyId}`,
    });

    return NextResponse.json({ success: true, survey });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create survey." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, surveyStatus, engineerNotes, customerVisibleRemarks } = body;

    const updated = await prisma.siteSurvey.update({
      where: { id },
      data: {
        ...(surveyStatus && { surveyStatus }),
        ...(engineerNotes !== undefined && { engineerNotes }),
        ...(customerVisibleRemarks !== undefined && { customerVisibleRemarks }),
      },
    });

    await logAuditEvent({
      entityType: "SiteSurvey",
      entityId: id,
      fieldChanged: "surveyStatus",
      action: "STATUS_CHANGE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Updated survey status to ${surveyStatus}`,
    });

    return NextResponse.json({ success: true, survey: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update survey." }, { status: 500 });
  }
}
