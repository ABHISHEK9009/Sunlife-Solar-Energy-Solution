export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(req: Request) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  try {
    // 1. Fetch real CRM leads assigned to this agent
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { assignedSalesExecutiveId: agent.id },
          ...(agent.employeeId ? [{ assignedSalesExecutiveId: agent.employeeId }] : []),
          ...(agent.name ? [{ assignedSalesExecutiveId: agent.name }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 2. Fetch real CRM site surveys assigned to this agent
    const surveys = await prisma.siteSurvey.findMany({
      where: {
        OR: [
          { surveyEngineerId: agent.id },
          { customer: { assignedSalesExecutiveId: agent.id } },
          ...(agent.employeeId ? [{ surveyEngineerId: agent.employeeId }] : []),
        ],
      },
      include: {
        customer: {
          select: {
            fullName: true,
            primaryMobile: true,
            installationAddress: true,
          },
        },
      },
      orderBy: { scheduledDateTime: "asc" },
      take: 20,
    });

    const tasks: any[] = [];

    // Construct tasks from real CRM leads
    for (const lead of leads) {
      const stageUpper = (lead.status || "").toUpperCase();
      const loc = lead.location || lead.city || "Jaipur";
      const cleanPhone = (lead.phone || "").replace(/\D/g, "");

      if (stageUpper === "NEW") {
        tasks.push({
          id: `task_lead_call_${lead.id}`,
          title: `Call ${lead.name}`,
          subtitle: `New customer inquiry · ${loc} · ${lead.phone}`,
          iconType: "call",
          isCompleted: false,
          targetId: lead.id,
          targetName: lead.name,
          targetPhone: cleanPhone,
          targetType: "lead",
          priority: "HIGH",
          dueText: "Due today",
        });
      } else if (stageUpper === "CONTACTED" || stageUpper === "SURVEY_SCHEDULED") {
        const dateStr = lead.surveyRequestedDate
          ? new Date(lead.surveyRequestedDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })
          : "Soon";
        tasks.push({
          id: `task_lead_survey_${lead.id}`,
          title: `Survey follow-up: ${lead.name}`,
          subtitle: `Date: ${dateStr} · ${lead.interestedSolution || "Rooftop Solar"} · ${loc}`,
          iconType: "survey",
          isCompleted: false,
          targetId: lead.id,
          targetName: lead.name,
          targetPhone: cleanPhone,
          targetType: "lead",
          priority: "MEDIUM",
          dueText: dateStr,
        });
      } else if (stageUpper === "QUOTATION_SENT" || stageUpper === "NEGOTIATION") {
        tasks.push({
          id: `task_lead_quote_${lead.id}`,
          title: `Quotation review with ${lead.name}`,
          subtitle: `Monthly bill: ₹${lead.monthlyBill || "5,000"} · Capacity: ${lead.requestedCapacity || 5} kW`,
          iconType: "followup",
          isCompleted: false,
          targetId: lead.id,
          targetName: lead.name,
          targetPhone: cleanPhone,
          targetType: "lead",
          priority: "HIGH",
          dueText: "Follow-up due",
        });
      } else if (stageUpper === "CONVERTED") {
        tasks.push({
          id: `task_lead_doc_${lead.id}`,
          title: `Collect documents from ${lead.name}`,
          subtitle: `Aadhaar, electricity bill & installation KYC · ${loc}`,
          iconType: "document",
          isCompleted: false,
          targetId: lead.id,
          targetName: lead.name,
          targetPhone: cleanPhone,
          targetType: "lead",
          priority: "MEDIUM",
          dueText: "Pending KYC",
        });
      }
    }

    // Construct tasks from real CRM surveys
    for (const survey of surveys) {
      const isDone = survey.surveyStatus === "COMPLETED";
      const timeStr = survey.scheduledDateTime
        ? new Date(survey.scheduledDateTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "10:30 AM";

      tasks.push({
        id: `task_survey_${survey.id}`,
        title: `Site survey for ${survey.customer.fullName}`,
        subtitle: `Address: ${survey.customer.installationAddress || "Jaipur"} · ${timeStr}`,
        iconType: "survey",
        isCompleted: isDone,
        targetId: survey.id,
        targetName: survey.customer.fullName,
        targetPhone: (survey.customer.primaryMobile || "").replace(/\D/g, ""),
        targetType: "survey",
        priority: "HIGH",
        dueText: timeStr,
      });
    }

    return NextResponse.json({
      success: true,
      tasks,
      summary: {
        total: tasks.length,
        remaining: tasks.filter((t) => !t.isCompleted).length,
        completed: tasks.filter((t) => t.isCompleted).length,
      },
    });
  } catch (error: any) {
    console.error("[Agent Tasks GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch agent tasks from CRM." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { taskId, isCompleted } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    // If task corresponds to a lead, update lead stage in CRM
    if (taskId.startsWith("task_lead_call_")) {
      const leadId = taskId.replace("task_lead_call_", "");
      if (isCompleted) {
        await prisma.lead.update({
          where: { id: leadId },
          data: { status: "CONTACTED" },
        });
        await logAuditEvent({
          entityType: "Lead",
          entityId: leadId,
          fieldChanged: "status",
          previousValue: "NEW",
          newValue: "CONTACTED",
          action: "UPDATE",
          actorId: agent.employeeId || agent.id,
          actorType: "EMPLOYEE",
          source: "APP",
        });
      }
    } else if (taskId.startsWith("task_survey_")) {
      const surveyId = taskId.replace("task_survey_", "");
      await prisma.siteSurvey.update({
        where: { id: surveyId },
        data: { surveyStatus: isCompleted ? "COMPLETED" : "SCHEDULED" },
      });
    }

    return NextResponse.json({ success: true, taskId, isCompleted });
  } catch (error: any) {
    console.error("[Agent Tasks PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update task state." }, { status: 500 });
  }
}
