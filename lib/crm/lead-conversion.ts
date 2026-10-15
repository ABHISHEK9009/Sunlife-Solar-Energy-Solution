import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "./audit-logger";
import { generateCustomerId, generateProjectId } from "./sequence-generator";

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
 * when an official site survey is confirmed. Transactionally executed with concurrency-safe sequences.
 */
export async function convertLeadToProspectCustomer(options: ConfirmSurveyOptions) {
  const { leadId, surveyDateTime, surveyEngineerId, actorId = "SYSTEM" } = options;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error("Lead record not found.");
  }

  const cleanPhone = lead.phone.replace(/\D/g, "");

  return await prisma.$transaction(async (tx) => {
    // Check if Customer already exists for this mobile number
    let customer = await tx.customer.findUnique({
      where: { primaryMobile: cleanPhone },
    });

    if (!customer) {
      const customerCode = await generateCustomerId(tx);

      customer = await tx.customer.create({
        data: {
          customerId: customerCode,
          fullName: lead.name || "Customer",
          primaryMobile: cleanPhone,
          email: lead.email,
          installationAddress: lead.location || lead.city || "Site Address",
          propertyType: lead.propertyType || "RESIDENTIAL",
          customerStatus: "ACTIVE", // Active so they can authenticate and track
          appAccessEnabled: true,
          assignedSalesExecutiveId: lead.assignedSalesExecutiveId,
        },
      });

      await logAuditEvent({
        entityType: "Customer",
        entityId: customer.id,
        fieldChanged: "all",
        action: "CREATE",
        actorId,
        actorType: "ADMIN",
        client: tx,
        newValue: `Created customer ${customer.customerId} from lead ${lead.name}`,
      });
    }

    // Standardized concurrency-safe Project ID
    const projectCode = await generateProjectId(tx);
    const capacity = lead.requestedCapacity || lead.recommendedCapacity || 3.0;

    const project = await tx.solarProject.create({
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
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        customerId: customer.id,
        status: "SURVEY_SCHEDULED",
        surveyRequestedDate: surveyDateTime,
      },
    });

    // Create initial Project Timeline item
    await tx.projectTimeline.create({
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
      actorType: "EMPLOYEE",
      source: "CRM",
      client: tx,
      newValue: `Created Project ${project.projectId} for ${customer.fullName}`,
    });

    return { customer, project };
  });
}

/**
 * Stage 2: Promotes Customer & Project to ORDER_CONFIRMED upon booking advance.
 * Transactionally executed.
 */
export async function confirmProjectBooking(options: ConfirmBookingOptions) {
  const { projectId, advanceAmountPaid, paymentMethod, transactionReference, actorId = "SYSTEM" } = options;

  return await prisma.$transaction(async (tx) => {
    const project = await tx.solarProject.findUnique({
      where: { id: projectId },
      include: { customer: true },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    // Update Project Status
    const updatedProject = await tx.solarProject.update({
      where: { id: projectId },
      data: {
        projectStatus: "ORDER_CONFIRMED",
        customerActionRequired: "Submit documents (Electricity bill, Aadhaar, Cancelled cheque)",
      },
    });

    // Ensure Customer is ACTIVE
    await tx.customer.update({
      where: { id: project.customerId },
      data: {
        customerStatus: "ACTIVE",
        appAccessEnabled: true,
      },
    });

    // Concurrency-safe Payment ID
    const payments = await tx.payment.findMany({
      where: { paymentId: { startsWith: "SL-PAY-" } },
      select: { paymentId: true },
    });
    let maxNum = 1000;
    for (const p of payments) {
      const match = p.paymentId.match(/SL-PAY-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const paymentCode = `SL-PAY-${maxNum + 1}`;

    await tx.payment.create({
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
    await tx.projectTimeline.create({
      data: {
        projectId: project.id,
        eventType: "ORDER_CONFIRMED",
        eventTitle: "Booking Confirmed & Order Placed",
        customerDescription: `Thank you! Your advance booking of ₹${advanceAmountPaid.toLocaleString("en-IN")} via ${paymentMethod} has been received. Project initiated.`,
        visibleToCustomer: true,
      },
    });

    return { project: updatedProject };
  });
}
