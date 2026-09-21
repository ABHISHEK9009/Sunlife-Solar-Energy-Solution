export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Try resolving customer by id, customerId, or primaryMobile
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [{ id }, { customerId: id }, { primaryMobile: id.replace(/\D/g, "") }],
      },
      include: {
        assignedSalesExecutive: { select: { id: true, name: true, phone: true, role: true } },
        projects: {
          orderBy: { createdAt: "desc" },
          include: {
            subsidy: true,
            monitoring: true,
            payments: { orderBy: { createdAt: "desc" } },
            quotations: { orderBy: { versionNumber: "desc" } },
            assignedEngineer: { select: { id: true, name: true, phone: true, role: true } },
            assignedSalesExecutive: { select: { id: true, name: true, phone: true, role: true } },
            surveys: { orderBy: { scheduledDateTime: "desc" } },
          },
        },
        documents: { orderBy: { uploadedDate: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        surveys: {
          orderBy: { scheduledDateTime: "desc" },
          include: {
            surveyEngineer: { select: { id: true, name: true, phone: true, role: true } },
          },
        },
        tickets: { orderBy: { submittedDate: "desc" } },
        leads: { orderBy: { createdAt: "desc" } },
      },
    });

    let lead: any = null;

    // 2. If not found in Customer, search Lead table
    if (!customer) {
      lead = await prisma.lead.findFirst({
        where: {
          OR: [{ id }, { leadId: id }, { phone: id.replace(/\D/g, "") }],
        },
      });

      if (!lead) {
        return NextResponse.json({ error: "Client record (Customer or Lead) not found." }, { status: 404 });
      }

      // Check if this lead can be linked to an existing customer by phone, or create a lightweight customer profile
      const cleanPhone = lead.phone.replace(/\D/g, "");
      let existingCust = await prisma.customer.findUnique({
        where: { primaryMobile: cleanPhone },
      });

      if (!existingCust) {
        const count = await prisma.customer.count();
        existingCust = await prisma.customer.create({
          data: {
            customerId: `SL-CUST-${1000 + count + 1}`,
            fullName: lead.name,
            primaryMobile: cleanPhone,
            email: lead.email || null,
            installationAddress: lead.city ? `${lead.city}, Madhya Pradesh` : "Narmadapuram, Madhya Pradesh",
            propertyType: lead.propertyType?.toUpperCase().includes("COMMERCIAL") ? "COMMERCIAL" : "RESIDENTIAL",
            customerStatus: "LEAD", // Flagged as inquiry lead until project order confirmed
            appAccessEnabled: true,
          },
        });

        await prisma.lead.update({
          where: { id: lead.id },
          data: { customerId: existingCust.id },
        });

        await logAuditEvent({
          entityType: "Customer",
          entityId: existingCust.id,
          fieldChanged: "all",
          action: "CREATE",
          actorId: "ADMIN",
          actorType: "ADMIN",
          newValue: `Auto-provisioned client profile for lead ${lead.name}`,
        });
      }

      // Re-fetch customer with all relationships
      customer = await prisma.customer.findUnique({
        where: { id: existingCust.id },
        include: {
          assignedSalesExecutive: { select: { id: true, name: true, phone: true, role: true } },
          projects: {
            orderBy: { createdAt: "desc" },
            include: {
              subsidy: true,
              monitoring: true,
              payments: { orderBy: { createdAt: "desc" } },
              quotations: { orderBy: { versionNumber: "desc" } },
              assignedEngineer: { select: { id: true, name: true, phone: true, role: true } },
              assignedSalesExecutive: { select: { id: true, name: true, phone: true, role: true } },
              surveys: { orderBy: { scheduledDateTime: "desc" } },
            },
          },
          documents: { orderBy: { uploadedDate: "desc" } },
          payments: { orderBy: { createdAt: "desc" } },
          surveys: {
            orderBy: { scheduledDateTime: "desc" },
            include: {
              surveyEngineer: { select: { id: true, name: true, phone: true, role: true } },
            },
          },
          tickets: { orderBy: { submittedDate: "desc" } },
          leads: { orderBy: { createdAt: "desc" } },
        },
      });
    }

    if (!customer) {
      return NextResponse.json({ error: "Failed to resolve client." }, { status: 404 });
    }

    // 3. Compile Unified Activity Timeline & Team Members
    const projectIds = customer.projects.map((p) => p.id);
    const leadIds = customer.leads.map((l) => l.id);

    const [auditLogs, projectTimelines, teamMembers] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          OR: [
            { entityId: customer.id },
            { entityId: customer.customerId },
            ...(leadIds.length > 0 ? [{ entityId: { in: leadIds } }] : []),
            ...(projectIds.length > 0 ? [{ entityId: { in: projectIds } }] : []),
          ],
        },
        orderBy: { timestamp: "desc" },
        take: 30,
      }),
      projectIds.length > 0
        ? prisma.projectTimeline.findMany({
            where: { projectId: { in: projectIds } },
            orderBy: { eventDateTime: "desc" },
            take: 30,
          })
        : Promise.resolve([]),
      prisma.teamMember.findMany({
        where: { activeStatus: true },
        select: { id: true, name: true, role: true, phone: true, category: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Format and combine timeline events
    const timelineEvents: any[] = [];
    const seenTitles = new Set<string>();

    projectTimelines.forEach((pt) => {
      seenTitles.add(pt.eventTitle.toLowerCase().trim());
      timelineEvents.push({
        id: pt.id,
        type: pt.eventType || "MILESTONE",
        title: pt.eventTitle,
        description: pt.customerDescription,
        internalNote: pt.internalDescription,
        visibleToCustomer: pt.visibleToCustomer,
        actor: pt.createdBy,
        timestamp: pt.eventDateTime,
        source: "PROJECT_TIMELINE",
      });
    });

    auditLogs.forEach((log) => {
      let type = log.action || "LOG";
      let title = log.fieldChanged ? log.fieldChanged.replace(/_/g, " ") : "Activity Logged";
      let isVisibleToCust = false;
      let field = log.fieldChanged || "";

      if (field.includes("[APP_VISIBLE]")) {
        isVisibleToCust = true;
        field = field.replace("[APP_VISIBLE]", "").trim();
      }

      if (field.includes(": ")) {
        const parts = field.split(": ");
        type = parts[0].trim();
        title = parts.slice(1).join(": ").trim();
      } else if (field === "all" && log.action === "CREATE") {
        type = "PROFILE_CREATED";
        title = "Client Profile Created";
      } else if (field === "profile" && log.action === "UPDATE") {
        type = "PROFILE_UPDATED";
        title = "Client Details Updated";
      }

      // Avoid duplicate display if already present in ProjectTimeline
      if (!seenTitles.has(title.toLowerCase().trim())) {
        timelineEvents.push({
          id: log.id,
          type,
          title,
          description: log.newValue || log.previousValue || "Activity recorded",
          internalNote: `Entity: ${log.entityType} • Actor: ${log.actorId}`,
          visibleToCustomer: isVisibleToCust,
          actor: log.actorId,
          timestamp: log.timestamp,
          source: "AUDIT_LOG",
        });
      }
    });

    // Add initial lead inquiry events
    customer.leads.forEach((l) => {
      timelineEvents.push({
        id: `lead-init-${l.id}`,
        type: "INQUIRY",
        title: `Website Inquiry Submitted (${l.interestedSolution || "Solar"})`,
        description: l.message || `Requirement: ${l.propertyType || "Residential"} solar. Monthly Bill: ₹${l.monthlyBill || "N/A"}. City: ${l.city || "Narmadapuram"}.`,
        internalNote: `Lead Source: ${l.leadSource || l.source || "Website Form"}`,
        visibleToCustomer: false,
        actor: l.name,
        timestamp: l.createdAt,
        source: "LEAD_ORIGIN",
      });
    });

    // Sort chronologically (latest first)
    timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      client: customer,
      timeline: timelineEvents,
      activeProject: customer.projects.length > 0 ? customer.projects[0] : null,
      teamMembers: teamMembers || [],
    });
  } catch (error: any) {
    console.error("[Client Profile GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch client profile." }, { status: 500 });
  }
}

async function resolveClient(id: string, includeProjects = false): Promise<any> {
  const cleanPhone = id.replace(/\D/g, "");
  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { id },
        { customerId: id },
        ...(cleanPhone ? [{ primaryMobile: cleanPhone }] : []),
      ],
    },
    include: includeProjects
      ? {
          projects: {
            orderBy: { createdAt: "desc" },
            include: {
              subsidy: true,
              monitoring: true,
              payments: true,
              quotations: true,
              assignedEngineer: true,
              assignedSalesExecutive: true,
            },
          },
          leads: true,
        }
      : undefined,
  });

  if (!customer) {
    const lead = await prisma.lead.findFirst({
      where: {
        OR: [
          { id },
          { leadId: id },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (lead?.customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: lead.customerId },
        include: includeProjects
          ? {
              projects: {
                orderBy: { createdAt: "desc" },
                include: {
                  subsidy: true,
                  monitoring: true,
                  payments: true,
                  quotations: true,
                  assignedEngineer: true,
                  assignedSalesExecutive: true,
                },
              },
              leads: true,
            }
          : undefined,
      });
    }
  }

  return customer;
}

// Update Client Profile Information
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const customer = await resolveClient(id);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const {
      fullName,
      primaryMobile,
      alternateMobile,
      email,
      installationAddress,
      billingAddress,
      propertyType,
      preferredLanguage,
      customerStatus,
      appAccessEnabled,
    } = body;

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(fullName && { fullName: fullName.trim() }),
        ...(primaryMobile && { primaryMobile: primaryMobile.replace(/\D/g, "") }),
        ...(alternateMobile !== undefined && { alternateMobile: alternateMobile?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(installationAddress && { installationAddress: installationAddress.trim() }),
        ...(billingAddress !== undefined && { billingAddress: billingAddress?.trim() || null }),
        ...(propertyType && { propertyType }),
        ...(preferredLanguage && { preferredLanguage }),
        ...(customerStatus && { customerStatus }),
        ...(appAccessEnabled !== undefined && { appAccessEnabled: Boolean(appAccessEnabled) }),
      },
    });

    await logAuditEvent({
      entityType: "Customer",
      entityId: customer.id,
      fieldChanged: "profile",
      action: "UPDATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Updated client details for ${updated.fullName}`,
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    console.error("[Client Profile PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update client profile." }, { status: 500 });
  }
}

// Actions: UPDATE_STAGE, UPDATE_SPECS, ASSIGN_OFFICER, SCHEDULE_SURVEY, ADD_ACTIVITY, ADD_DOCUMENT
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { action } = body;

    const customer = await resolveClient(id, true);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    let activeProject = customer.projects?.length > 0 ? customer.projects[0] : null;

    // Action 1: UPDATE_STAGE (1-Click Operational Stage Transition)
    if (action === "UPDATE_STAGE") {
      const { stage, notes, visibleToCustomer = true } = body;
      if (!stage) {
        return NextResponse.json({ error: "Stage is required." }, { status: 400 });
      }

      // If no project exists yet, auto-provision one so operations can track it
      if (!activeProject) {
        const projectCount = await prisma.solarProject.count();
        const projectId = `SL-PRJ-${1000 + projectCount + 1}`;
        const lead = customer.leads?.[0];

        activeProject = await prisma.solarProject.create({
          data: {
            projectId,
            customerId: customer.id,
            projectName: `${customer.fullName} - ${lead?.propertyType || "Rooftop"} Solar`,
            plantCapacityKw: lead?.requestedCapacity || 3.0,
            solarType: "ON_GRID",
            propertyType: customer.propertyType || "RESIDENTIAL",
            projectStatus: stage,
            installationAddress: customer.installationAddress,
            discom: "MPMKVVCL",
            lastStatusUpdate: new Date(),
          },
        });

        // Update customer status to reflect active pipeline
        await prisma.customer.update({
          where: { id: customer.id },
          data: { customerStatus: stage === "ACTIVE" || stage === "COMPLETED" ? "ACTIVE" : "ACTIVE" },
        });
      } else {
        // Update existing project status
        const updateData: any = {
          projectStatus: stage,
          lastStatusUpdate: new Date(),
        };

        if (stage === "INSTALLATION_COMPLETED") {
          updateData.installationDate = new Date();
        } else if (stage === "ACTIVE" || stage === "NET_METER_INSTALLED") {
          updateData.commissioningDate = new Date();
        }

        activeProject = await prisma.solarProject.update({
          where: { id: activeProject.id },
          data: updateData,
        });

        if (stage === "ACTIVE" || stage === "COMPLETED") {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { customerStatus: "ACTIVE" },
          });
        }
      }

      // Record Milestone in ProjectTimeline
      const timelineEntry = await prisma.projectTimeline.create({
        data: {
          projectId: activeProject.id,
          eventType: "STAGE_CHANGE",
          eventTitle: `Operations Stage: ${stage.replace(/_/g, " ")}`,
          customerDescription: notes || `Project progressed to ${stage.replace(/_/g, " ")} stage.`,
          internalDescription: `Stage updated to ${stage} by ADMIN`,
          visibleToCustomer: Boolean(visibleToCustomer),
          createdBy: "ADMIN",
        },
      });

      // App notification if visible to customer
      if (visibleToCustomer) {
        await prisma.notification.create({
          data: {
            customerId: customer.id,
            projectId: activeProject.id,
            notificationType: "STAGE_UPDATE",
            title: `Project Status: ${stage.replace(/_/g, " ")}`,
            message: notes || `Your solar installation has progressed to the ${stage.replace(/_/g, " ")} stage.`,
            deliveryChannel: "IN_APP",
          },
        });
      }

      await logAuditEvent({
        entityType: "SolarProject",
        entityId: activeProject.id,
        fieldChanged: "projectStatus",
        action: "STATUS_CHANGE",
        actorId: "ADMIN",
        actorType: "ADMIN",
        previousValue: activeProject.projectStatus,
        newValue: stage,
      });

      return NextResponse.json({
        success: true,
        message: `Stage successfully updated to ${stage.replace(/_/g, " ")}`,
        activeProject,
        timelineEntry,
      });
    }

    // Action 2: UPDATE_SPECS (Technical & DISCOM Specs)
    if (action === "UPDATE_SPECS") {
      const {
        plantCapacityKw,
        discom,
        consumerNumber,
        solarType,
        propertyType,
        panelBrandModel,
        panelQuantity,
        inverterBrandModel,
        inverterSerialNumber,
        warrantyStartDate,
        warrantyEndDate,
        estimatedMonthlyGenerationKwh,
        estimatedMonthlySavingsInr,
        roofType,
        availableRoofAreaSqFt,
        shadowInfo,
        sanctionedLoad,
      } = body;

      if (!activeProject) {
        // Provision project if not existing
        const projectCount = await prisma.solarProject.count();
        const projectId = `SL-PRJ-${1000 + projectCount + 1}`;
        activeProject = await prisma.solarProject.create({
          data: {
            projectId,
            customerId: customer.id,
            projectName: `${customer.fullName} - Rooftop Solar`,
            plantCapacityKw: parseFloat(plantCapacityKw) || 3.0,
            solarType: solarType || "ON_GRID",
            propertyType: propertyType || customer.propertyType || "RESIDENTIAL",
            installationAddress: customer.installationAddress,
            discom: discom || "MPMKVVCL",
            consumerNumber: consumerNumber || null,
            panelBrandModel: panelBrandModel || null,
            panelQuantity: panelQuantity ? parseInt(panelQuantity) : null,
            inverterBrandModel: inverterBrandModel || null,
            inverterSerialNumber: inverterSerialNumber || null,
            lastStatusUpdate: new Date(),
          },
        });
      } else {
        activeProject = await prisma.solarProject.update({
          where: { id: activeProject.id },
          data: {
            ...(plantCapacityKw !== undefined && { plantCapacityKw: parseFloat(plantCapacityKw) || 3.0 }),
            ...(discom !== undefined && { discom }),
            ...(consumerNumber !== undefined && { consumerNumber: consumerNumber?.trim() || null }),
            ...(solarType !== undefined && { solarType }),
            ...(propertyType !== undefined && { propertyType }),
            ...(panelBrandModel !== undefined && { panelBrandModel: panelBrandModel?.trim() || null }),
            ...(panelQuantity !== undefined && { panelQuantity: panelQuantity ? parseInt(panelQuantity) : null }),
            ...(inverterBrandModel !== undefined && { inverterBrandModel: inverterBrandModel?.trim() || null }),
            ...(inverterSerialNumber !== undefined && { inverterSerialNumber: inverterSerialNumber?.trim() || null }),
            ...(warrantyStartDate && { warrantyStartDate: new Date(warrantyStartDate) }),
            ...(warrantyEndDate && { warrantyEndDate: new Date(warrantyEndDate) }),
            ...(estimatedMonthlyGenerationKwh !== undefined && {
              estimatedMonthlyGenerationKwh: parseFloat(estimatedMonthlyGenerationKwh) || null,
            }),
            ...(estimatedMonthlySavingsInr !== undefined && {
              estimatedMonthlySavingsInr: parseFloat(estimatedMonthlySavingsInr) || null,
            }),
          },
        });
      }

      // Persist Roof & Survey specifications if provided
      if (roofType !== undefined || availableRoofAreaSqFt !== undefined || shadowInfo !== undefined || sanctionedLoad !== undefined) {
        const existingSurvey = await prisma.siteSurvey.findFirst({
          where: { customerId: customer.id },
          orderBy: { scheduledDateTime: "desc" },
        });

        if (existingSurvey) {
          await prisma.siteSurvey.update({
            where: { id: existingSurvey.id },
            data: {
              ...(roofType && { roofType }),
              ...(availableRoofAreaSqFt && { availableRoofAreaSqFt: parseFloat(availableRoofAreaSqFt) || null }),
              ...(shadowInfo && { shadowInfo }),
              ...(sanctionedLoad && { existingElectricityLoadKw: parseFloat(sanctionedLoad) || null }),
              ...(consumerNumber && { discomConsumerNumber: consumerNumber.trim() }),
            },
          });
        } else {
          const surveyCount = await prisma.siteSurvey.count();
          await prisma.siteSurvey.create({
            data: {
              surveyId: `SL-SRV-${1000 + surveyCount + 1}`,
              customerId: customer.id,
              projectId: activeProject.id,
              scheduledDateTime: new Date(),
              surveyStatus: "COMPLETED",
              roofType: roofType || "RCC Flat Roof",
              availableRoofAreaSqFt: parseFloat(availableRoofAreaSqFt) || 350,
              shadowInfo: shadowInfo || "Shadow-free south orientation",
              existingElectricityLoadKw: parseFloat(sanctionedLoad) || 3.0,
              discomConsumerNumber: consumerNumber?.trim() || null,
            },
          });
        }
      }

      await logAuditEvent({
        entityType: "SolarProject",
        entityId: activeProject.id,
        fieldChanged: "hardwareSpecs",
        action: "UPDATE",
        actorId: "ADMIN",
        actorType: "ADMIN",
        newValue: `Updated technical & DISCOM specs for ${activeProject.projectId}`,
      });

      return NextResponse.json({
        success: true,
        message: "Technical & DISCOM specifications saved successfully.",
        activeProject,
      });
    }

    // Action 3: ASSIGN_OFFICER (Assign Sales / Survey / Project Engineer)
    if (action === "ASSIGN_OFFICER") {
      const { salesExecutiveId, engineerId } = body;

      if (salesExecutiveId !== undefined) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { assignedSalesExecutiveId: salesExecutiveId || null },
        });

        if (activeProject) {
          await prisma.solarProject.update({
            where: { id: activeProject.id },
            data: { assignedSalesExecutiveId: salesExecutiveId || null },
          });
        }
      }

      if (engineerId !== undefined && activeProject) {
        await prisma.solarProject.update({
          where: { id: activeProject.id },
          data: { assignedEngineerId: engineerId || null },
        });
      }

      await logAuditEvent({
        entityType: "Customer",
        entityId: customer.id,
        fieldChanged: "assignedOfficers",
        action: "UPDATE",
        actorId: "ADMIN",
        actorType: "ADMIN",
        newValue: `Reassigned operational officers for client ${customer.fullName}`,
      });

      return NextResponse.json({
        success: true,
        message: "Assigned officers updated successfully.",
      });
    }

    // Action 4: SCHEDULE_SURVEY
    if (action === "SCHEDULE_SURVEY") {
      const { scheduledDateTime, surveyEngineerId, notes, roofType, availableRoofAreaSqFt } = body;
      if (!scheduledDateTime) {
        return NextResponse.json({ error: "Scheduled date & time is required." }, { status: 400 });
      }

      const surveyCount = await prisma.siteSurvey.count();
      const surveyId = `SL-SRV-${1000 + surveyCount + 1}`;

      const survey = await prisma.siteSurvey.create({
        data: {
          surveyId,
          projectId: activeProject?.id || null,
          customerId: customer.id,
          scheduledDateTime: new Date(scheduledDateTime),
          surveyEngineerId: surveyEngineerId || null,
          surveyStatus: "SCHEDULED",
          roofType: roofType || null,
          availableRoofAreaSqFt: availableRoofAreaSqFt ? parseFloat(availableRoofAreaSqFt) : null,
          engineerNotes: notes || null,
        },
      });

      if (activeProject) {
        await prisma.solarProject.update({
          where: { id: activeProject.id },
          data: { projectStatus: "SURVEY_SCHEDULED", lastStatusUpdate: new Date() },
        });

        await prisma.projectTimeline.create({
          data: {
            projectId: activeProject.id,
            eventType: "SURVEY_SCHEDULED",
            eventTitle: "Site Survey Scheduled",
            customerDescription: `Site survey scheduled for ${new Date(scheduledDateTime).toLocaleDateString()}`,
            internalDescription: `Survey booked by ADMIN (${surveyId})`,
            visibleToCustomer: true,
            createdBy: "ADMIN",
          },
        });
      }

      await logAuditEvent({
        entityType: "SiteSurvey",
        entityId: survey.id,
        fieldChanged: "surveyStatus",
        action: "CREATE",
        actorId: "ADMIN",
        actorType: "ADMIN",
        newValue: `Scheduled survey ${surveyId} on ${scheduledDateTime}`,
      });

      return NextResponse.json({
        success: true,
        message: `Site Survey (${surveyId}) successfully scheduled.`,
        survey,
      });
    }

    // Action 5: Add Activity Note (Call, Visit, Meeting, Note)
    if (action === "ADD_ACTIVITY") {
      const { activityType, title, description, visibleToCustomer = false, projectId } = body;

      if (!title || !description) {
        return NextResponse.json({ error: "Activity title and description are required." }, { status: 400 });
      }

      const linkedProjectId = projectId || (customer.projects.length > 0 ? customer.projects[0].id : null);

      const visibilityTag = visibleToCustomer ? " [APP_VISIBLE]" : "";
      await logAuditEvent({
        entityType: "Customer",
        entityId: customer.id,
        fieldChanged: `${activityType || "ACTIVITY"}: ${title}${visibilityTag}`,
        action: "STATUS_CHANGE",
        actorId: "ADMIN",
        actorType: "ADMIN",
        newValue: description,
      });

      let timelineEntry = null;
      if (linkedProjectId) {
        timelineEntry = await prisma.projectTimeline.create({
          data: {
            projectId: linkedProjectId,
            eventType: activityType || "CLIENT_INTERACTION",
            eventTitle: title,
            customerDescription: description,
            internalDescription: `Logged by ADMIN via Client Operations (${activityType || "NOTE"})`,
            visibleToCustomer: Boolean(visibleToCustomer),
            createdBy: "ADMIN",
          },
        });

        if (visibleToCustomer) {
          await prisma.notification.create({
            data: {
              customerId: customer.id,
              projectId: linkedProjectId,
              notificationType: "CLIENT_UPDATE",
              title,
              message: description,
              deliveryChannel: "IN_APP",
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Activity successfully logged to client timeline.",
        timelineEntry,
      });
    }

    // Action 6: Add Document
    if (action === "ADD_DOCUMENT") {
      const { documentCategory, documentName, fileLocation, mimeType, projectId } = body;

      if (!documentCategory || !documentName) {
        return NextResponse.json({ error: "Document category and name are required." }, { status: 400 });
      }

      const docCount = await prisma.document.count();
      const documentId = `SL-DOC-${1000 + docCount + 1}`;
      const linkedProjectId = projectId || (customer.projects.length > 0 ? customer.projects[0].id : null);

      const document = await prisma.document.create({
        data: {
          documentId,
          customerId: customer.id,
          projectId: linkedProjectId,
          documentCategory,
          documentName: documentName.trim(),
          fileLocation: fileLocation || `/uploads/docs/${documentId}.pdf`,
          mimeType: mimeType || "application/pdf",
          uploadedBy: "ADMIN",
          verificationStatus: "VERIFIED",
          verifiedBy: "ADMIN",
          customerCanView: true,
          customerCanDownload: true,
        },
      });

      await logAuditEvent({
        entityType: "Document",
        entityId: document.id,
        fieldChanged: "documentCategory",
        action: "CREATE",
        actorId: "ADMIN",
        actorType: "ADMIN",
        newValue: `Uploaded ${documentName} (${documentCategory})`,
      });

      return NextResponse.json({ success: true, document });
    }

    return NextResponse.json({ error: "Invalid action requested." }, { status: 400 });
  } catch (error: any) {
    console.error("[Client Profile POST Error]:", error);
    return NextResponse.json({ error: "Failed to process client action." }, { status: 500 });
  }
}
