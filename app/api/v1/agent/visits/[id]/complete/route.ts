import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const { latitude, longitude, photoPaths } = body;

    // Look up survey strictly by ID (internal or surveyId code)
    const survey = await prisma.siteSurvey.findFirst({
      where: {
        OR: [{ id }, { surveyId: id }],
      },
    });

    if (!survey) {
      return NextResponse.json({ error: "Site survey record not found." }, { status: 404 });
    }

    // Enforce assignment: an agent cannot complete another agent's assigned survey
    const isAssigned =
      !survey.surveyEngineerId ||
      survey.surveyEngineerId === agent.id;

    if (!isAssigned && agent.role !== "Admin" && agent.role !== "Manager") {
      return NextResponse.json(
        { error: "Forbidden. This site survey is assigned to another engineer." },
        { status: 403 }
      );
    }

    const updated = await prisma.siteSurvey.update({
      where: { id: survey.id },
      data: {
        surveyStatus: "COMPLETED",
        gpsLatitude: latitude ?? survey.gpsLatitude,
        gpsLongitude: longitude ?? survey.gpsLongitude,
        sitePhotographs: photoPaths ?? survey.sitePhotographs,
        surveyEngineerId: survey.surveyEngineerId || agent.id,
      },
    });

    try {
      await logAuditEvent({
        entityType: "SiteSurvey",
        entityId: survey.id,
        fieldChanged: "surveyStatus",
        previousValue: survey.surveyStatus,
        newValue: "COMPLETED",
        action: "STATUS_CHANGE",
        actorId: agent.employeeId || agent.id,
        actorType: "EMPLOYEE",
        source: "APP",
      });
    } catch (_) {}

    return NextResponse.json({ success: true, survey: updated });
  } catch (error: any) {
    console.error("[Agent Survey Complete Error]:", error);
    return NextResponse.json({ error: "Failed to complete survey." }, { status: 500 });
  }
}
