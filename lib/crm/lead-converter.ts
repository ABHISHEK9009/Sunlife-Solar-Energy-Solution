import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "./audit-logger";

export interface LeadConversionOptions {
  leadId: string;
  assignedSalesExecutiveId?: string;
  assignedEngineerId?: string;
  plantCapacityKw?: number;
  solarType?: string; // ON_GRID, OFF_GRID, HYBRID
  initialProjectStatus?: string;
  notes?: string;
  actorId?: string;
}

/**
 * Enterprise Lead Conversion Pipeline
 * When a lead is converted, the CRM automatically provisions:
 * 1. Customer record (or maps to existing customer by mobile)
 * 2. Solar Installation Project
 * 3. Initial Project Timeline entry
 * 4. Subsidy tracker record
 * 5. Referral progression (if referral applied)
 */
export async function convertLeadToCustomerAndProject(options: LeadConversionOptions) {
  const { leadId, actorId = "SYSTEM" } = options;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error(`Lead with ID ${leadId} not found.`);
  }

  const cleanPhone = lead.phone.replace(/\D/g, "");

  const result = await prisma.$transaction(async (tx) => {
    // 1. Check if customer already exists for this phone number
    let customer = await tx.customer.findUnique({
      where: { primaryMobile: cleanPhone },
    });

    if (!customer) {
      const customerCount = await tx.customer.count();
      const customerCode = `SL-CUST-${1000 + customerCount + 1}`;

      customer = await tx.customer.create({
        data: {
          customerId: customerCode,
          fullName: lead.name,
          primaryMobile: cleanPhone,
          email: lead.email || null,
          installationAddress: lead.city ? `${lead.city}, Madhya Pradesh` : "Narmadapuram, Madhya Pradesh",
          propertyType: lead.propertyType?.toUpperCase().includes("COMMERCIAL") ? "COMMERCIAL" : "RESIDENTIAL",
          assignedSalesExecutiveId: options.assignedSalesExecutiveId || lead.assignedSalesExecutiveId || null,
          customerStatus: "ACTIVE",
          appAccessEnabled: true,
          mobileVerified: true,
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

    // 2. Generate unique Project ID
    const projectCount = await tx.solarProject.count();
    const projectCode = `SL-PRJ-${1000 + projectCount + 1}`;
    const capacityKw = options.plantCapacityKw || lead.requestedCapacity || lead.recommendedCapacity || 3.0;

    const project = await tx.solarProject.create({
      data: {
        projectId: projectCode,
        customerId: customer.id,
        projectName: `${customer.fullName} - ${capacityKw}kW Rooftop Solar`,
        plantCapacityKw: capacityKw,
        solarType: options.solarType || "ON_GRID",
        propertyType: customer.propertyType,
        projectStatus: options.initialProjectStatus || "ORDER_CONFIRMED",
        installationAddress: customer.installationAddress,
        discom: "MPMKVVCL",
        assignedEngineerId: options.assignedEngineerId || null,
        assignedSalesExecutiveId: options.assignedSalesExecutiveId || customer.assignedSalesExecutiveId || null,
        estimatedMonthlyGenerationKwh: Math.round(capacityKw * 125),
        estimatedMonthlySavingsInr: Math.round(capacityKw * 125 * 7.5),
        customerActionRequired: "Upload Electricity Bill and KYC",
      },
    });

    // 3. Create Timeline Entry (Customer Visible)
    await tx.projectTimeline.create({
      data: {
        projectId: project.id,
        eventType: "ORDER_CONFIRMED",
        eventTitle: "Order Confirmed & Project Initiated",
        customerDescription: `Welcome to Sunlife Solar! Your ${capacityKw}kW installation project (${project.projectId}) has been approved and initiated.`,
        internalDescription: `Lead ${lead.id} converted. Customer: ${customer.customerId}. Initial notes: ${options.notes || lead.notes || "None"}`,
        visibleToCustomer: true,
        createdBy: actorId,
      },
    });

    // 4. Initialize Subsidy Record
    const subsidyCount = await tx.subsidyRecord.count();
    const subsidyCode = `SL-SUB-${1000 + subsidyCount + 1}`;
    const expectedSubsidy = capacityKw <= 2 ? capacityKw * 30000 : 78000; // PM Surya Ghar subsidy standard

    await tx.subsidyRecord.create({
      data: {
        subsidyRecordId: subsidyCode,
        projectId: project.id,
        customerId: customer.id,
        subsidyScheme: "PM Surya Ghar: Muft Bijli Yojana",
        expectedSubsidy,
        currentStatus: "NOT_STARTED",
        requiredCustomerAction: "Share DISCOM consumer number & national portal registration details",
      },
    });

    // 5. Update Lead Status
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONVERTED",
        customerId: customer.id,
      },
    });

    // 6. Progress Referral if applicable
    if (lead.referralCode) {
      await tx.referral.updateMany({
        where: { referralCode: lead.referralCode },
        data: {
          referralStatus: "ORDER_CONFIRMED",
          leadId: lead.id,
          eligibleRewardAmount: 1500, // Standard reward
        },
      });
    }

    return {
      success: true,
      customer,
      project,
    };
  }, { maxWait: 15000, timeout: 30000 });

  await logAuditEvent({
    entityType: "SolarProject",
    entityId: result.project.id,
    fieldChanged: "projectStatus",
    action: "CREATE",
    actorId,
    actorType: "ADMIN",
    newValue: `Created project ${result.project.projectId} for customer ${result.customer.customerId}`,
  });

  return result;
}
