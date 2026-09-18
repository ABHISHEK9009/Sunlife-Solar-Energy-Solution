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
        assignedSalesExecutive: { select: { name: true, phone: true, role: true } },
        projects: {
          orderBy: { createdAt: "desc" },
          include: {
            subsidy: true,
            monitoring: true,
            payments: true,
            quotations: { orderBy: { versionNumber: "desc" } },
          },
        },
        documents: { orderBy: { uploadedDate: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        surveys: { orderBy: { scheduledDateTime: "desc" } },
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
          assignedSalesExecutive: { select: { name: true, phone: true, role: true } },
          projects: {
            orderBy: { createdAt: "desc" },
            include: {
              subsidy: true,
              monitoring: true,
              payments: true,
              quotations: { orderBy: { versionNumber: "desc" } },
            },
          },
          documents: { orderBy: { uploadedDate: "desc" } },
          payments: { orderBy: { createdAt: "desc" } },
          surveys: { orderBy: { scheduledDateTime: "desc" } },
          tickets: { orderBy: { submittedDate: "desc" } },
          leads: { orderBy: { createdAt: "desc" } },
        },
      });
    }

    if (!customer) {
      return NextResponse.json({ error: "Failed to resolve client." }, { status: 404 });
    }

    // 3. Compile Unified Activity Timeline
    // Fetch AuditLogs for this customer and any linked leads/projects
    const projectIds = customer.projects.map((p) => p.id);
    const leadIds = customer.leads.map((l) => l.id);

    const [auditLogs, projectTimelines] = await Promise.all([
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
        take: 100,
      }),
      projectIds.length > 0
        ? prisma.projectTimeline.findMany({
            where: { projectId: { in: projectIds } },
            orderBy: { eventDateTime: "desc" },
          })
        : Promise.resolve([]),
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
    include: includeProjects ? { projects: true } : undefined,
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
        include: includeProjects ? { projects: true } : undefined,
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

// Actions: Add Activity Note or Add Document
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

    // Action 1: Add Activity Note (Call, Visit, Meeting, Note)
    if (action === "ADD_ACTIVITY") {
      const { activityType, title, description, visibleToCustomer = false, projectId } = body;

      if (!title || !description) {
        return NextResponse.json({ error: "Activity title and description are required." }, { status: 400 });
      }

      const linkedProjectId = projectId || (customer.projects.length > 0 ? customer.projects[0].id : null);

      // 1. Log in AuditLog for permanent client history
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

      // 2. If client has an active project and visibility is requested, append to ProjectTimeline
      let timelineEntry = null;
      if (linkedProjectId) {
        timelineEntry = await prisma.projectTimeline.create({
          data: {
            projectId: linkedProjectId,
            eventType: activityType || "CLIENT_INTERACTION",
            eventTitle: title,
            customerDescription: description,
            internalDescription: `Logged by ADMIN via Client Profile (${activityType || "NOTE"})`,
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

    // Action 2: Add Document
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
