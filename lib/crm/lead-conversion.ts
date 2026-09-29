import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "./audit-logger";

interface ConfirmSurveyOptions {
  leadId: string;
  surveyDateTime: Date;
  surveyEngineerId?: string | null;
  actorId?: string;
}

interface ConfirmBookingOptions {
  projectId: string;
  advanceAmountPaid: number;
  paymentMethod: string;
  transactionReference?: string;
  actorId?: string;
}

/**
 * Stage 1: Converts Lead to a PROSPECT Customer and creates an ENQUIRY SolarProject
 * when an official site survey is confirmed.
 */
export async function convertLeadToProspectCustomer(options: ConfirmSurveyOptions) {
  const { leadId, surveyDateTime, surveyEngineerId, actorId = "SYSTEM" } = options;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error("Lead record not found.");
  }

  // Check if Customer already exists for this mobile number
  let customer = await prisma.customer.findUnique({
    where: { primaryMobile: lead.phone },
  });

  if (!customer) {
    const custCount = await prisma.customer.count();
    const customerCode = `SL-CUST-${1000 + custCount + 1}`;

    customer = await prisma.customer.create({
      data: {
        customerId: customerCode,
        fullName: lead.name || "Customer",
        primaryMobile: lead.phone,
        email: lead.email,
        installationAddress: lead.location || lead.city || "Site Address",
        propertyType: lead.propertyType || "RESIDENTIAL",
        customerStatus: "ACTIVE", // Active so they can authenticate and track
        appAccessEnabled: true,
        assignedSalesExecutiveId: lead.assignedSalesExecutiveId,
      },
    });
  }

  // Create corresponding Solar Project
  const prjCount = await prisma.solarProject.count();
  const projectCode = `SL-PRJ-${new Date().getFullYear()}-${String(prjCount + 1).padStart(4, "0")}`;
  const capacity = lead.requestedCapacity || lead.recommendedCapacity || 5.0;

  const project = await prisma.solarProject.create({
    data: {
      projectId: projectCode,
      customerId: customer.id,
      projectName: `${customer.fullName}'s ${capacity} kW ${lead.propertyType || "Solar"} System`,
      plantCapacityKw: capacity,
      solarType: lead.interestedSolution?.toUpperCase().includes("OFF") ? "OFF_GRID" : "ON_GRID",
      propertyType: lead.propertyType || "RESIDENTIAL",
      projectStatus: "SURVEY_SCHEDULED",
      installationAddress: lead.location || customer.installationAddress,
      assignedSalesExecutiveId: lead.assignedSalesExecutiveId,
      assignedEngineerId: surveyEngineerId,
    },
  });

  // Link lead to customer
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      customerId: customer.id,
      status: "SURVEY_SCHEDULED",
      surveyRequestedDate: surveyDateTime,
    },
  });

  // Create initial Project Timeline item
  await prisma.projectTimeline.create({
    data: {
      projectId: project.id,
      eventType: "SURVEY_SCHEDULED",
      eventTitle: "Site Survey Scheduled",
      customerDescription: `Our engineering team has scheduled an on-site solar feasibility assessment for ${surveyDateTime.toLocaleDateString("en-IN", { dateStyle: "medium" })}.`,
      visibleToCustomer: true,
    },
  });

  // Log audit
  await logAuditEvent({
    entityType: "SolarProject",
    entityId: project.id,
    fieldChanged: "projectStatus",
    action: "CREATE",
    actorId,
    actorType: "STAFF",
    source: "CRM",
    newValue: `Created Project ${project.projectId} for ${customer.fullName}`,
  });

  return { customer, project };
}

/**
 * Stage 2: Promotes Customer & Project to ORDER_CONFIRMED upon booking advance.
 */
export async function confirmProjectBooking(options: ConfirmBookingOptions) {
  const { projectId, advanceAmountPaid, paymentMethod, transactionReference, actorId = "SYSTEM" } = options;

  const project = await prisma.solarProject.findUnique({
    where: { id: projectId },
    include: { customer: true },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  // Update Project Status
  const updatedProject = await prisma.solarProject.update({
    where: { id: projectId },
    data: {
      projectStatus: "ORDER_CONFIRMED",
      customerActionRequired: "Submit documents (Electricity bill, Aadhaar, Cancelled cheque)",
    },
  });

  // Ensure Customer is ACTIVE
  await prisma.customer.update({
    where: { id: project.customerId },
    data: {
      customerStatus: "ACTIVE",
      appAccessEnabled: true,
    },
  });

  // Record Payment
  const payCount = await prisma.payment.count();
  const paymentCode = `SL-PAY-${1000 + payCount + 1}`;

  await prisma.payment.create({
    data: {
      paymentId: paymentCode,
      projectId: project.id,
      customerId: project.customerId,
      paymentStage: "BOOKING",
      amountDue: advanceAmountPaid,
      amountPaid: advanceAmountPaid,
      balanceRemaining: 0,
      paymentStatus: "PAID",
      paymentMethod,
      transactionReference,
      receivedDate: new Date(),
    },
  });

  // Log Timeline
  await prisma.projectTimeline.create({
    data: {
      projectId: project.id,
      eventType: "ORDER_CONFIRMED",
      eventTitle: "Booking Confirmed & Order Placed",
      customerDescription: `Thank you! Your advance booking of ₹${advanceAmountPaid.toLocaleString("en-IN")} via ${paymentMethod} has been received. Project initiated.`,
      visibleToCustomer: true,
    },
  });

  return { project: updatedProject };
}
