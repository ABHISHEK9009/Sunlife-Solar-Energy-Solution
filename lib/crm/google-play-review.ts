import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

// ─────────────────────────────────────────────────────────────────────────────
// Google Play Review Dedicated Demo Identities & Credentials
// ─────────────────────────────────────────────────────────────────────────────
export const GOOGLE_PLAY_CONFIG = {
  CLIENT_PHONE: process.env.GOOGLE_PLAY_CLIENT_PHONE || "9999900001",
  CLIENT_REVIEW_OTP: process.env.GOOGLE_PLAY_CLIENT_OTP || "842601",
  AGENT_PHONE: process.env.GOOGLE_PLAY_AGENT_PHONE || "9999900002",
  AGENT_REVIEW_OTP: process.env.GOOGLE_PLAY_AGENT_OTP || "715934",
  DEMO_CLIENT_ID: "SL-DEMO-CUST-01",
  DEMO_PROJECT_ID: "SL-DEMO-PRJ-01",
  DEMO_AGENT_ID: "agent_google_play_demo",
  DEMO_EMPLOYEE_ID: "SL-DEMO-EMP-01",
};

/**
 * Checks if a normalized phone matches the allowlisted Google Play Client identity
 */
export function isGooglePlayClientPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  const target = GOOGLE_PLAY_CONFIG.CLIENT_PHONE.replace(/\D/g, "");
  return digits === target || (digits.length === 12 && digits.endsWith(target));
}

/**
 * Checks if a normalized phone/identifier matches the allowlisted Google Play Agent identity
 */
export function isGooglePlayAgentPhone(identifier: string): boolean {
  if (!identifier) return false;
  const digits = identifier.replace(/\D/g, "");
  const target = GOOGLE_PLAY_CONFIG.AGENT_PHONE.replace(/\D/g, "");
  return digits === target || (digits.length === 12 && digits.endsWith(target));
}

/**
 * Validates the dedicated Client Review OTP (only evaluated for allowlisted demo client)
 */
export function isGooglePlayClientReviewOtp(otp: string): boolean {
  const clean = (otp || "").trim();
  return clean === GOOGLE_PLAY_CONFIG.CLIENT_REVIEW_OTP;
}

/**
 * Validates the dedicated Agent Review OTP (only evaluated for allowlisted demo agent)
 */
export function isGooglePlayAgentReviewOtp(otp: string): boolean {
  const clean = (otp || "").trim();
  return clean === GOOGLE_PLAY_CONFIG.AGENT_REVIEW_OTP;
}

/**
 * Ensures all synthetic demo data (Client, Project, Documents, Tickets, Agent, Tasks, Attendance)
 * exists idempotently in the CRM database without mutating or interfering with real production data.
 */
export async function ensureGooglePlayDemoData() {
  const clientPhone = GOOGLE_PLAY_CONFIG.CLIENT_PHONE;
  const agentPhone = GOOGLE_PLAY_CONFIG.AGENT_PHONE;

  // 1. Ensure Demo Field Agent / Engineer exists in TeamMember
  let demoAgent = await prisma.teamMember.findFirst({
    where: {
      OR: [
        { id: GOOGLE_PLAY_CONFIG.DEMO_AGENT_ID },
        { phone: agentPhone },
        { employeeId: GOOGLE_PLAY_CONFIG.DEMO_EMPLOYEE_ID },
      ],
    },
  });

  if (!demoAgent) {
    demoAgent = await prisma.teamMember.create({
      data: {
        id: GOOGLE_PLAY_CONFIG.DEMO_AGENT_ID,
        employeeId: GOOGLE_PLAY_CONFIG.DEMO_EMPLOYEE_ID,
        name: "Sunlife Demo Agent",
        role: "Field Solar Engineer",
        category: "Operations",
        department: "Field Engineering & Surveys",
        phone: agentPhone,
        email: "demo.agent@sunlifesolar.in",
        territory: "Narmadapuram",
        serviceArea: "Narmadapuram, Itarsi, Bhopal",
        status: "Available",
        activeStatus: true,
        employeeAccessEnabled: true,
        customerContactVisibility: true,
        joinedYear: "2024",
      },
    });
  } else {
    // Keep active status guaranteed for review
    demoAgent = await prisma.teamMember.update({
      where: { id: demoAgent.id },
      data: {
        activeStatus: true,
        employeeAccessEnabled: true,
        role: "Field Solar Engineer",
        category: "Operations",
      },
    });
  }

  // 2. Ensure Demo Customer exists
  let demoCustomer = await prisma.customer.findFirst({
    where: {
      OR: [
        { primaryMobile: clientPhone },
        { customerId: GOOGLE_PLAY_CONFIG.DEMO_CLIENT_ID },
      ],
    },
    include: {
      projects: true,
    },
  });

  if (!demoCustomer) {
    demoCustomer = await prisma.customer.create({
      data: {
        customerId: GOOGLE_PLAY_CONFIG.DEMO_CLIENT_ID,
        fullName: "Sunlife Demo Customer",
        primaryMobile: clientPhone,
        email: "demo.client@sunlifesolar.in",
        customerStatus: "ACTIVE",
        appAccessEnabled: true,
        mobileVerified: true,
        installationAddress: "Sunlife Demo Solar Facility, Vinayak Complex, Narmadapuram, MP 461001",
        billingAddress: "Sunlife Demo Solar Facility, Vinayak Complex, Narmadapuram, MP 461001",
        propertyType: "RESIDENTIAL",
        preferredLanguage: "en",
        assignedSalesExecutiveId: demoAgent.id,
      },
      include: {
        projects: true,
      },
    });
  } else {
    // Keep active status guaranteed for review
    demoCustomer = await prisma.customer.update({
      where: { id: demoCustomer.id },
      data: {
        customerStatus: "ACTIVE",
        appAccessEnabled: true,
        mobileVerified: true,
      },
      include: {
        projects: true,
      },
    });
  }

  // 3. Ensure Demo Solar Project exists
  let demoProject = await prisma.solarProject.findFirst({
    where: {
      OR: [
        { projectId: GOOGLE_PLAY_CONFIG.DEMO_PROJECT_ID },
        { customerId: demoCustomer.id },
      ],
    },
  });

  if (!demoProject) {
    demoProject = await prisma.solarProject.create({
      data: {
        projectId: GOOGLE_PLAY_CONFIG.DEMO_PROJECT_ID,
        customerId: demoCustomer.id,
        projectName: "Rooftop Solar Plant (5 kW)",
        plantCapacityKw: 5.0,
        solarType: "ON_GRID",
        propertyType: "RESIDENTIAL",
        projectStatus: "INSTALLATION_COMPLETED",
        installationAddress: demoCustomer.installationAddress,
        discom: "MPMKVVCL",
        consumerNumber: "18290000099",
        assignedSalesExecutiveId: demoAgent.id,
        assignedEngineerId: demoAgent.id,
        panelBrandModel: "Adani Solar 540W Mono PERC",
        panelQuantity: 10,
        inverterBrandModel: "Sungrow 5 kW Grid-Tie",
        inverterSerialNumber: "SG5K-DEMO-2026",
        estimatedMonthlyGenerationKwh: 650,
        estimatedMonthlySavingsInr: 5200,
        commissioningDate: new Date(Date.now() - 3 * 86400000),
      },
    });
  }

  // 4. Ensure Project Timeline Milestones exist
  const existingTimelineCount = await prisma.projectTimeline.count({
    where: { projectId: demoProject.id },
  });

  if (existingTimelineCount === 0) {
    await prisma.projectTimeline.createMany({
      data: [
        {
          projectId: demoProject.id,
          eventType: "SURVEY_COMPLETED",
          eventTitle: "Site Survey & 3D Shadow Analysis Completed",
          customerDescription: "Engineering assessment verified 450 sq.ft shade-free rooftop with optimal 22° south tilt.",
          visibleToCustomer: true,
          eventDateTime: new Date(Date.now() - 25 * 86400000),
        },
        {
          projectId: demoProject.id,
          eventType: "QUOTATION_APPROVED",
          eventTitle: "5 kW Solar Plant Configuration Approved",
          customerDescription: "Grid-tied solar engineering design and PM Surya Ghar subsidy application approved.",
          visibleToCustomer: true,
          eventDateTime: new Date(Date.now() - 20 * 86400000),
        },
        {
          projectId: demoProject.id,
          eventType: "MATERIAL_DISPATCHED",
          eventTitle: "Panels, Inverter & Mounting Structures Delivered",
          customerDescription: "Adani 540W Mono PERC modules, Sungrow inverter, and galvanized steel structure delivered on-site.",
          visibleToCustomer: true,
          eventDateTime: new Date(Date.now() - 12 * 86400000),
        },
        {
          projectId: demoProject.id,
          eventType: "INSTALLATION_COMPLETED",
          eventTitle: "Rooftop Mounting & Grid-Tie Wiring Completed",
          customerDescription: "Mechanical structural mounting, DC cabling, and earth pit testing completed successfully.",
          visibleToCustomer: true,
          eventDateTime: new Date(Date.now() - 3 * 86400000),
        },
        {
          projectId: demoProject.id,
          eventType: "NET_METERING_PENDING",
          eventTitle: "DISCOM Bi-Directional Net-Meter Synchronization",
          customerDescription: "Joint inspection with MPMKVVCL scheduled for bi-directional net-meter synchronization.",
          visibleToCustomer: true,
          eventDateTime: new Date(Date.now() - 1 * 86400000),
        },
      ],
    });
  }

  // 5. Ensure Demo Documents exist
  const existingDocCount = await prisma.document.count({
    where: { customerId: demoCustomer.id },
  });

  if (existingDocCount === 0) {
    await prisma.document.createMany({
      data: [
        {
          documentId: "SL-DEMO-DOC-01",
          customerId: demoCustomer.id,
          projectId: demoProject.id,
          documentCategory: "QUOTATION",
          documentName: "Approved Solar Proposal & Engineering Blueprint",
          fileLocation: "docs/demo/solar_proposal_5kw.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 245000,
          uploadedBy: "Sunlife Engineering Desk",
          verificationStatus: "VERIFIED",
        },
        {
          documentId: "SL-DEMO-DOC-02",
          customerId: demoCustomer.id,
          projectId: demoProject.id,
          documentCategory: "INSTALLATION_CERTIFICATE",
          documentName: "Commissioning & Work Completion Certificate",
          fileLocation: "docs/demo/installation_certificate.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 310000,
          uploadedBy: demoAgent.name,
          verificationStatus: "VERIFIED",
        },
        {
          documentId: "SL-DEMO-DOC-03",
          customerId: demoCustomer.id,
          projectId: demoProject.id,
          documentCategory: "PANEL_WARRANTY",
          documentName: "Adani Solar 25-Year Performance Warranty Card",
          fileLocation: "docs/demo/panel_warranty.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 520000,
          uploadedBy: "OEM Warranty Desk",
          verificationStatus: "VERIFIED",
        },
        {
          documentId: "SL-DEMO-DOC-04",
          customerId: demoCustomer.id,
          projectId: demoProject.id,
          documentCategory: "NET_METERING_DOCUMENT",
          documentName: "DISCOM Net-Metering Sanction Letter",
          fileLocation: "docs/demo/net_metering_sanction.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 180000,
          uploadedBy: "Liaison Officer",
          verificationStatus: "VERIFIED",
        },
      ],
    });
  }

  // 6. Ensure Demo Milestone Payments exist
  const existingPayCount = await prisma.payment.count({
    where: { customerId: demoCustomer.id },
  });

  if (existingPayCount === 0) {
    await prisma.payment.createMany({
      data: [
        {
          paymentId: "SL-DEMO-PAY-01",
          projectId: demoProject.id,
          customerId: demoCustomer.id,
          paymentStage: "BOOKING",
          amountDue: 25000,
          amountPaid: 25000,
          balanceRemaining: 0,
          paymentStatus: "PAID",
          paymentMethod: "UPI",
          transactionReference: "UPI/DEMO/2026/8912401",
          receivedDate: new Date(Date.now() - 20 * 86400000),
        },
        {
          paymentId: "SL-DEMO-PAY-02",
          projectId: demoProject.id,
          customerId: demoCustomer.id,
          paymentStage: "MATERIAL",
          amountDue: 175000,
          amountPaid: 175000,
          balanceRemaining: 0,
          paymentStatus: "PAID",
          paymentMethod: "Bank Transfer",
          transactionReference: "NEFT/DEMO/2026/4102941",
          receivedDate: new Date(Date.now() - 12 * 86400000),
        },
        {
          paymentId: "SL-DEMO-PAY-03",
          projectId: demoProject.id,
          customerId: demoCustomer.id,
          paymentStage: "FINAL",
          amountDue: 25000,
          amountPaid: 25000,
          balanceRemaining: 0,
          paymentStatus: "PAID",
          paymentMethod: "Net Banking",
          transactionReference: "IMPS/DEMO/2026/5102948",
          receivedDate: new Date(Date.now() - 3 * 86400000),
        },
      ],
    });
  }

  // 7. Ensure Demo Subsidy Record exists
  const existingSubsidy = await prisma.subsidyRecord.findFirst({
    where: { projectId: demoProject.id },
  });

  if (!existingSubsidy) {
    await prisma.subsidyRecord.create({
      data: {
        subsidyRecordId: "SL-DEMO-SUB-01",
        projectId: demoProject.id,
        customerId: demoCustomer.id,
        subsidyScheme: "PM Surya Ghar Muft Bijli Yojana",
        portalRegistrationNumber: "PMSGY-MP-2026-DEMO99",
        expectedSubsidy: 78000,
        approvedSubsidy: 78000,
        currentStatus: "NET_METER_INSTALLED",
        bankAccountMasked: "XXXX-XXXX-4512",
        bankVerificationStatus: "VERIFIED",
        applicationDate: new Date(Date.now() - 18 * 86400000),
      },
    });
  }

  // 8. Ensure Demo Service Ticket exists
  const existingTicketCount = await prisma.serviceTicket.count({
    where: { customerId: demoCustomer.id },
  });

  if (existingTicketCount === 0) {
    await prisma.serviceTicket.create({
      data: {
        ticketId: "SL-DEMO-TCK-01",
        customerId: demoCustomer.id,
        projectId: demoProject.id,
        issueCategory: "PANEL_CLEANING",
        description: "Scheduled 6-month preventive panel cleaning & performance health check.",
        priority: "MEDIUM",
        status: "WORK_COMPLETED",
        assignedTechnicianId: demoAgent.id,
        customerRating: 5,
        customerVisibleNotes: "Preventive cleaning executed. Inverter operating at optimal 5.1 kW peak efficiency.",
        resolutionDetails: "Panels washed with deionized water; string voltages verified normal.",
        resolvedDate: new Date(Date.now() - 2 * 86400000),
      },
    });
  }

  // 9. Ensure Demo Plant Monitoring exists
  let demoMonitoring = await prisma.plantMonitoring.findFirst({
    where: { projectId: demoProject.id },
  });

  if (!demoMonitoring) {
    demoMonitoring = await prisma.plantMonitoring.create({
      data: {
        plantId: "SL-DEMO-PLANT-01",
        projectId: demoProject.id,
        inverterProvider: "Sungrow",
        inverterSerialNumber: "SG5K-DEMO-2026",
        connectionStatus: "CONNECTED",
        systemHealth: "NORMAL",
        totalGeneratedEnergyKwh: 1450.5,
        totalConsumedEnergyKwh: 1080.2,
        totalExportedEnergyKwh: 520.3,
        totalImportedEnergyKwh: 150.0,
        lastSynchronizedTime: new Date(),
      },
    });

    // Populate recent generation readings
    const readingsData = [];
    for (let i = 6; i >= 0; i--) {
      readingsData.push({
        plantId: demoMonitoring.id,
        timestamp: new Date(Date.now() - i * 86400000),
        generatedKwh: 21.5 + (i % 3) * 1.2,
        consumedKwh: 14.0 + (i % 2) * 0.8,
        exportedKwh: 7.5 + (i % 3) * 0.4,
        importedKwh: 2.1,
        dataSource: "INVERTER_API",
      });
    }
    await prisma.generationReading.createMany({ data: readingsData });
  }

  // 10. Ensure Demo Agent has Assigned Synthetic Leads
  const existingAgentLeadsCount = await prisma.lead.count({
    where: { assignedSalesExecutiveId: demoAgent.id },
  });

  if (existingAgentLeadsCount === 0) {
    await prisma.lead.createMany({
      data: [
        {
          leadId: "SL-DEMO-LEAD-01",
          name: "Dr. R. K. Saxena (Commercial Clinic)",
          phone: "9826000011",
          city: "Narmadapuram",
          location: "Itarsi Road, Narmadapuram",
          monthlyBill: "14500",
          propertyType: "Commercial",
          interestedSolution: "On-Grid Commercial (10 kW)",
          requestedCapacity: 10.0,
          leadSource: "Field Survey Visit",
          source: "Sunlife Field Agent App",
          status: "NEW",
          notes: "Client interested in solar net-metering under PM Surya Ghar institutional scheme.",
          assignedSalesExecutiveId: demoAgent.id,
        },
        {
          leadId: "SL-DEMO-LEAD-02",
          name: "Suresh Chandra Patel (Home Rooftop)",
          phone: "9826000012",
          city: "Narmadapuram",
          location: "Kothi Bazar, Near Sethani Ghat",
          monthlyBill: "3800",
          propertyType: "Residential",
          interestedSolution: "3 kW Residential Solar Plant",
          requestedCapacity: 3.0,
          leadSource: "Direct Referral",
          source: "Sunlife Field Agent App",
          status: "SURVEY_SCHEDULED",
          surveyRequestedDate: new Date(Date.now() + 86400000),
          notes: "Rooftop shadow analysis requested for tomorrow morning.",
          assignedSalesExecutiveId: demoAgent.id,
        },
        {
          leadId: "SL-DEMO-LEAD-03",
          name: "Vikram Rajput (Agriculture Solar Pump)",
          phone: "9826000013",
          city: "Babai",
          location: "Hoshangabad Agricultural Belt",
          monthlyBill: "7500",
          propertyType: "Agriculture",
          interestedSolution: "7.5 kW Solar Water Pumping System",
          requestedCapacity: 7.5,
          leadSource: "Kisan Solar Fair",
          source: "Sunlife Field Agent App",
          status: "QUOTATION_SENT",
          notes: "Quotation sent for 7.5 HP solar surface pump with controller.",
          assignedSalesExecutiveId: demoAgent.id,
        },
      ],
    });
  }

  // 11. Ensure Demo Agent has Assigned Site Surveys / Visits
  const existingSurveyCount = await prisma.siteSurvey.count({
    where: { surveyEngineerId: demoAgent.id },
  });

  if (existingSurveyCount === 0) {
    const scheduledTomorrow = new Date(Date.now() + 86400000);
    scheduledTomorrow.setHours(11, 30, 0, 0);

    await prisma.siteSurvey.create({
      data: {
        surveyId: "SL-DEMO-SRV-01",
        customerId: demoCustomer.id,
        projectId: demoProject.id,
        surveyStatus: "SCHEDULED",
        scheduledDateTime: scheduledTomorrow,
        surveyEngineerId: demoAgent.id,
        roofType: "RCC Flat Rooftop",
        availableRoofAreaSqFt: 450,
        recommendedCapacityKw: 5.0,
        customerVisibleRemarks: "Engineer scheduled for rooftop structure & DISCOM meter inspection.",
        engineerNotes: "Bring compass, laser distance meter, and structure clamp samples.",
      },
    });
  }

  // 12. Ensure Demo Agent Attendance history exists
  const existingAttendanceCount = await prisma.attendance.count({
    where: { memberId: demoAgent.id },
  });

  if (existingAttendanceCount === 0) {
    const attendanceRecords = [];
    for (let i = 5; i >= 1; i--) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - i);
      pastDate.setHours(0, 0, 0, 0);

      attendanceRecords.push({
        memberId: demoAgent.id,
        date: pastDate,
        status: "Present",
        checkIn: "09:15 AM",
        checkOut: "06:20 PM",
        workingMinutes: 545,
        assignedSite: "Sunlife Demo Solar Facility (Field Review)",
        remarks: "[Google Play Demo Review] Past record",
      });
    }

    try {
      await prisma.attendance.createMany({
        data: attendanceRecords,
        skipDuplicates: true,
      });
    } catch (_) {}
  }

  return { demoCustomer, demoAgent, demoProject };
}

/**
 * Review-safe demonstration mode handler for Attendance punch-in / punch-out.
 * Ensures Google Play reviewers from any location (e.g. US, Europe, India) can
 * freely demonstrate punch-in and punch-out safely without altering real operational data or payroll.
 */
export async function handleDemoAgentAttendance(params: {
  agent: any;
  action: "punch-in" | "punch-out";
  latitude?: number;
  longitude?: number;
  siteName?: string;
}) {
  const { agent, action, latitude, longitude, siteName } = params;

  const now = new Date();
  const dateParts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => dateParts.find((p) => p.type === type)?.value;
  const dateStr = `${value("year")}-${value("month")}-${value("day")}`;
  const timeStr = now.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateObj = new Date(`${dateStr}T00:00:00.000Z`);

  let locationText = "Demo Review Location";
  if (typeof latitude === "number" && typeof longitude === "number") {
    locationText = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  const assignedSite = siteName || "Sunlife Demo Solar Facility (Field Review)";

  if (action === "punch-in") {
    const record = await prisma.attendance.upsert({
      where: {
        memberId_date: {
          memberId: agent.id,
          date: dateObj,
        },
      },
      create: {
        memberId: agent.id,
        date: dateObj,
        status: "Present",
        checkIn: timeStr,
        checkOut: "--",
        workingMinutes: 0,
        assignedSite,
        remarks: `[Google Play Demo Review] ${locationText} (Punched in)`,
      },
      update: {
        status: "Present",
        checkIn: timeStr,
        checkOut: "--",
        workingMinutes: 0,
        assignedSite,
        remarks: `[Google Play Demo Review] ${locationText} (Re-punched for review)`,
      },
    });

    try {
      await logAuditEvent({
        entityType: "Attendance",
        entityId: record.id,
        fieldChanged: "checkIn",
        action: "STATUS_CHANGE",
        actorId: agent.employeeId || agent.id,
        actorType: "EMPLOYEE",
        source: "APP",
        newValue: `[Google Play Review] Field Agent Demo Punch-In at ${timeStr}`,
      });
    } catch (_) {}

    return {
      id: record.id,
      memberId: record.memberId,
      date: dateStr,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      workingMinutes: record.workingMinutes,
      assignedSite: record.assignedSite,
      remarks: record.remarks || "",
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  // punch-out
  const existing = await prisma.attendance.findUnique({
    where: {
      memberId_date: {
        memberId: agent.id,
        date: dateObj,
      },
    },
  });

  const checkInTime = existing?.checkIn !== "--" ? existing?.checkIn || "09:30 AM" : "09:30 AM";

  const record = await prisma.attendance.upsert({
    where: {
      memberId_date: {
        memberId: agent.id,
        date: dateObj,
      },
    },
    create: {
      memberId: agent.id,
      date: dateObj,
      status: "Present",
      checkIn: checkInTime,
      checkOut: timeStr,
      workingMinutes: 480,
      assignedSite,
      remarks: `[Google Play Demo Review] ${locationText} (Punched out)`,
    },
    update: {
      checkOut: timeStr,
      workingMinutes: 480,
      remarks: `[Google Play Demo Review] ${locationText} (Shift completed for review)`,
    },
  });

  try {
    await logAuditEvent({
      entityType: "Attendance",
      entityId: record.id,
      fieldChanged: "checkOut",
      action: "STATUS_CHANGE",
      actorId: agent.employeeId || agent.id,
      actorType: "EMPLOYEE",
      source: "APP",
      newValue: `[Google Play Review] Field Agent Demo Punch-Out at ${timeStr}`,
    });
  } catch (_) {}

  return {
    id: record.id,
    memberId: record.memberId,
    date: dateStr,
    status: record.status,
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    workingMinutes: record.workingMinutes,
    assignedSite: record.assignedSite,
    remarks: record.remarks || "",
    updatedAt: record.updatedAt.toISOString(),
  };
}
