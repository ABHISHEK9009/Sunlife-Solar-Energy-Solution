export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const [customer, agent, isAdmin] = await Promise.all([
    authenticateCustomerRequest(req),
    authenticateAgentRequest(req),
    authenticateAdminRequest(req),
  ]);

  if (!customer && !agent && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const project = await prisma.solarProject.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
      },
      include: {
        monitoring: {
          include: {
            maintenanceRecords: {
              orderBy: { lastCheckedDate: "desc" },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (customer && project.customerId !== customer.id) {
      return NextResponse.json({ error: "Forbidden: Cannot access foreign project." }, { status: 403 });
    }

    // Also fetch service tickets related to maintenance
    const serviceTickets = await prisma.serviceTicket.findMany({
      where: {
        projectId: project.id,
      },
      orderBy: { submittedDate: "desc" },
      include: {
        assignedTechnician: {
          select: { name: true, phone: true, role: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      maintenanceRecords: project.monitoring?.maintenanceRecords || [],
      serviceTickets,
    });
  } catch (error: any) {
    console.error("[Project Maintenance GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch maintenance history." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const [agent, isAdmin] = await Promise.all([
    authenticateAgentRequest(req),
    authenticateAdminRequest(req),
  ]);

  if (!agent && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Technician or admin access required." }, { status: 401 });
  }

  try {
    const project = await prisma.solarProject.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
      },
      include: {
        monitoring: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!isAdmin && agent) {
      const isPrivileged = agent.role === "Admin" || agent.role === "Manager";
      const isAssigned =
        project.assignedEngineerId === agent.id ||
        project.assignedSalesExecutiveId === agent.id;
      if (!isPrivileged && !isAssigned) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this project." }, { status: 403 });
      }
    }

    const body = await req.json();
    const {
      serviceType, // "PANEL_CLEANING", "ROUTINE_INSPECTION", "ELECTRICAL_CHECK"
      inverterHealth = "GOOD",
      panelHealth = "GOOD",
      gridConnectionStatus = "STABLE",
      performanceScore = 100.0,
      maintenanceRecommendation,
      openAlert,
    } = body;

    // Ensure PlantMonitoring record exists
    let plant = project.monitoring;
    if (!plant) {
      const count = await prisma.plantMonitoring.count();
      plant = await prisma.plantMonitoring.create({
        data: {
          plantId: `SL-PLANT-${1000 + count + 1}`,
          projectId: project.id,
          inverterProvider: project.inverterBrandModel || "Standard",
          connectionStatus: "CONNECTED",
          systemHealth: "NORMAL",
        },
      });
    }

    const now = new Date();
    const isCleaning = serviceType === "PANEL_CLEANING";

    const record = await prisma.maintenanceRecord.create({
      data: {
        plantId: plant.id,
        lastServiceDate: now,
        lastPanelCleaningDate: isCleaning ? now : undefined,
        nextInspectionDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // Next check in 90 days
        nextRecommendedCleaningDate: isCleaning
          ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          : undefined,
        inverterHealth,
        panelHealth,
        gridConnectionStatus,
        performanceScore: typeof performanceScore === "number" ? performanceScore : 100.0,
        maintenanceRecommendation,
        openAlert,
        lastCheckedDate: now,
      },
    });

    const actorId = agent ? (agent.employeeId || agent.name || agent.id) : "ADMIN";
    await logAuditEvent({
      entityType: "MaintenanceRecord",
      entityId: record.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId,
      actorType: "EMPLOYEE",
      source: "APP",
      newValue: `Recorded maintenance service: ${serviceType || "Inspection"}`,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("[Project Maintenance POST Error]:", error);
    return NextResponse.json({ error: "Failed to record maintenance service." }, { status: 500 });
  }
}
