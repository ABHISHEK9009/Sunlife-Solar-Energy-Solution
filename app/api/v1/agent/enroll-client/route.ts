import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function POST(req: Request) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      fullName,
      primaryMobile,
      alternateMobile,
      email,
      installationAddress,
      propertyType = "RESIDENTIAL",
      monthlyBill = "5000",
      capacityKw = 5,
      notes,
    } = body;

    if (!fullName || !primaryMobile || !installationAddress) {
      return NextResponse.json(
        { error: "Client name, primary mobile, and installation address are required." },
        { status: 400 }
      );
    }

    const cleanPhone = primaryMobile.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "A valid 10-digit mobile number is required." },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existing = await prisma.customer.findUnique({
      where: { primaryMobile: cleanPhone },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Client already registered with mobile ${cleanPhone} (${existing.customerId} - ${existing.fullName}).`,
        },
        { status: 409 }
      );
    }

    const customerCount = await prisma.customer.count();
    const customerCode = `SL-CUST-${1000 + customerCount + 1}`;

    // 1. Create Customer record attributed to this Agent
    const customer = await prisma.customer.create({
      data: {
        customerId: customerCode,
        fullName: fullName.trim(),
        primaryMobile: cleanPhone,
        alternateMobile: alternateMobile ? alternateMobile.trim() : null,
        email: email ? email.trim() : null,
        installationAddress: installationAddress.trim(),
        propertyType: propertyType.toUpperCase(),
        assignedSalesExecutiveId: agent.id,
        customerStatus: "ACTIVE",
        appAccessEnabled: true,
        mobileVerified: true,
      },
    });

    // 2. Create Initial Solar Project
    const projectCount = await prisma.solarProject.count();
    const projectId = `SL-PRJ-${1000 + projectCount + 1}`;
    const cleanCapacity = typeof capacityKw === "number" ? capacityKw : parseFloat(capacityKw) || 5;

    const project = await prisma.solarProject.create({
      data: {
        projectId,
        customerId: customer.id,
        projectName: `${customer.fullName}'s Solar Plant`,
        plantCapacityKw: cleanCapacity,
        propertyType: (propertyType || "RESIDENTIAL").toUpperCase(),
        solarType: "ON_GRID",
        projectStatus: "IN_PROGRESS",
        installationAddress: customer.installationAddress,
        assignedSalesExecutiveId: agent.id,
        assignedEngineerId: agent.id,
      },
    });

    // 3. Create Initial Site Survey
    const surveyCount = await prisma.siteSurvey.count();
    const surveyId = `SL-SRV-${1000 + surveyCount + 1}`;
    const scheduledTomorrow = new Date();
    scheduledTomorrow.setDate(scheduledTomorrow.getDate() + 1);
    scheduledTomorrow.setHours(11, 0, 0, 0);

    const survey = await prisma.siteSurvey.create({
      data: {
        surveyId,
        customerId: customer.id,
        projectId: project.id,
        surveyStatus: "SCHEDULED",
        scheduledDateTime: scheduledTomorrow,
        surveyEngineerId: agent.id,
        roofType: "RCC Rooftop",
      },
    });

    // 4. Create Lead entry for agent pipeline tracking
    await prisma.lead.create({
      data: {
        name: customer.fullName,
        phone: customer.primaryMobile,
        city: customer.installationAddress,
        location: customer.installationAddress,
        monthlyBill: monthlyBill.toString().replace(/[^\d.]/g, "") || "5000",
        status: "SURVEY_SCHEDULED",
        source: `Enrolled by Agent ${agent.name} (${agent.employeeId || agent.id})`,
        leadSource: "Agent Direct Enrollment",
        customerId: customer.id,
        assignedSalesExecutiveId: agent.id,
        notes: notes ? notes.trim() : `Enrolled directly by ${agent.name}`,
      },
    });

    // 5. Audit Log
    await logAuditEvent({
      entityType: "Customer",
      entityId: customer.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId: agent.employeeId || agent.id,
      actorType: "EMPLOYEE",
      source: "APP",
      newValue: `Agent ${agent.name} enrolled customer ${customer.customerId} (${customer.fullName}) with project ${project.projectId}`,
    });

    return NextResponse.json(
      {
        success: true,
        customer: {
          id: customer.id,
          customerId: customer.customerId,
          fullName: customer.fullName,
          primaryMobile: customer.primaryMobile,
          installationAddress: customer.installationAddress,
          propertyType: customer.propertyType,
        },
        project: {
          id: project.id,
          projectId: project.projectId,
          projectCode: project.projectId,
          capacityKw: project.plantCapacityKw,
          currentStage: project.projectStatus,
        },
        survey: {
          id: survey.id,
          surveyId: survey.surveyId,
          scheduledDateTime: survey.scheduledDateTime,
        },
        loginInstructions: `Client can now log in to the Sunlife Solar App using Mobile (+91 ${cleanPhone}) via secure one-time OTP verification.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Agent Enroll Client Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enroll client." },
      { status: 500 }
    );
  }
}
