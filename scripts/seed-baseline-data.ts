import * as fs from "fs";
import * as path from "path";
import { parseEnv } from "util";

// Parse project .env and override process.env directly
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const parsed = parseEnv(fs.readFileSync(envPath, "utf-8"));
  for (const [key, val] of Object.entries(parsed)) {
    if (val !== undefined) {
      process.env[key] = val;
    }
  }
}

import { PrismaClient } from "../prisma/generated/client";

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding baseline data for Sunlife Solar...");

  // 1. Create or ensure Sales Executive
  let salesMember = await prisma.teamMember.findFirst({
    where: { phone: "7722995100" },
  });

  if (!salesMember) {
    salesMember = await prisma.teamMember.create({
      data: {
        id: "emp_rahul_sales_101",
        employeeId: "SL-EMP-101",
        name: "Rahul Sharma",
        phone: "7722995100",
        email: "rahul.sales@sunlifesolar.in",
        role: "Senior Solar Advisor",
        category: "Sales",
        department: "Sales & Marketing",
        territory: "Narmadapuram",
        serviceArea: "Narmadapuram, Itarsi, Bhopal",
        joinedYear: "2024",
        activeStatus: true,
        employeeAccessEnabled: true,
      },
    });
    console.log(`Created Sales Advisor: ${salesMember.name} (${salesMember.phone})`);
  }

  // 2. Create or ensure Existing Active Customer (Priyanshu Sharma - 9876543210)
  let customer = await prisma.customer.findUnique({
    where: { primaryMobile: "9876543210" },
  });

  if (!customer) {
    const custCount = await prisma.customer.count();
    customer = await prisma.customer.create({
      data: {
        customerId: `SL-CUST-${1020 + custCount}`,
        fullName: "Priyanshu Sharma",
        primaryMobile: "9876543210",
        email: "priyanshu@example.com",
        customerStatus: "ACTIVE",
        appAccessEnabled: true,
        mobileVerified: true,
        installationAddress: "Shastri Ward, Near Sethani Ghat, Narmadapuram",
        propertyType: "RESIDENTIAL",
        preferredLanguage: "hi",
        assignedSalesExecutiveId: salesMember.id,
      },
    });
    console.log(`Created Customer: ${customer.fullName} (${customer.primaryMobile})`);
  }

  // Ensure user 7999979527 has customerStatus ACTIVE and appAccessEnabled: true
  await prisma.customer.updateMany({
    where: { primaryMobile: "7999979527" },
    data: { customerStatus: "ACTIVE", appAccessEnabled: true, mobileVerified: true },
  });

  // 3. Create or find Solar Project for Priyanshu (Home 5 kW)
  let project = await prisma.solarProject.findFirst({
    where: { customerId: customer.id },
  });

  if (!project) {
    const prjCount = await prisma.solarProject.count();
    project = await prisma.solarProject.create({
      data: {
        projectId: `SL-PRJ-${new Date().getFullYear()}-${String(prjCount + 1).padStart(4, "0")}`,
        customerId: customer.id,
        projectName: "Home Rooftop (5 kW)",
        plantCapacityKw: 5.0,
        solarType: "ON_GRID",
        propertyType: "RESIDENTIAL",
        projectStatus: "INSTALLATION_COMPLETED",
        installationAddress: customer.installationAddress,
        discom: "MPMKVVCL",
        consumerNumber: "18294029410",
        assignedSalesExecutiveId: salesMember.id,
        panelBrandModel: "Adani Solar 540W Mono PERC",
        panelQuantity: 10,
        inverterBrandModel: "Sungrow 5 kW Grid-Tie",
        inverterSerialNumber: "SG5K-2026-88912",
        estimatedMonthlyGenerationKwh: 650,
        estimatedMonthlySavingsInr: 5200,
      },
    });
    console.log(`Created Solar Project: ${project.projectName}`);

    // Project Timeline items
    await prisma.projectTimeline.createMany({
      data: [
        {
          projectId: project.id,
          eventType: "SURVEY_COMPLETED",
          eventTitle: "Site Survey Completed",
          customerDescription: "3D rooftop shadow analysis and structural load assessment completed successfully.",
          visibleToCustomer: true,
          eventDateTime: new Date(Date.now() - 25 * 86400000),
        },
        {
          projectId: project.id,
          eventType: "QUOTATION_APPROVED",
          eventTitle: "Proposal Approved",
          customerDescription: "5 kW On-Grid system configuration and subsidy plan confirmed.",
          visibleToCustomer: true,
          eventDateTime: new Date(Date.now() - 20 * 86400000),
        },
        {
          projectId: project.id,
          eventType: "MATERIAL_DISPATCHED",
          eventTitle: "Material Dispatched to Site",
          customerDescription: "Adani Solar panels, Sungrow inverter, and mounting structures delivered.",
          visibleToCustomer: true,
          eventDateTime: new Date(Date.now() - 10 * 86400000),
        },
        {
          projectId: project.id,
          eventType: "INSTALLATION_COMPLETED",
          eventTitle: "Solar Installation Completed",
          customerDescription: "Panels, inverter wiring, and earth pit testing completed. System ready for net-metering.",
          visibleToCustomer: true,
          eventDateTime: new Date(Date.now() - 3 * 86400000),
        },
      ],
    });

    // Milestone Payments
    await prisma.payment.createMany({
      data: [
        {
          paymentId: `SL-PAY-${Date.now()}-1`,
          projectId: project.id,
          customerId: customer.id,
          paymentStage: "BOOKING",
          amountDue: 25000,
          amountPaid: 25000,
          balanceRemaining: 0,
          paymentStatus: "PAID",
          paymentMethod: "UPI",
          transactionReference: "UPI/389102941092/PAY",
          receivedDate: new Date(Date.now() - 20 * 86400000),
        },
        {
          paymentId: `SL-PAY-${Date.now()}-2`,
          projectId: project.id,
          customerId: customer.id,
          paymentStage: "MATERIAL",
          amountDue: 175000,
          amountPaid: 175000,
          balanceRemaining: 0,
          paymentStatus: "PAID",
          paymentMethod: "Bank Transfer",
          transactionReference: "NEFT/SBIN891024/CRED",
          receivedDate: new Date(Date.now() - 10 * 86400000),
        },
        {
          paymentId: `SL-PAY-${Date.now()}-3`,
          projectId: project.id,
          customerId: customer.id,
          paymentStage: "FINAL",
          amountDue: 25000,
          amountPaid: 0,
          balanceRemaining: 25000,
          paymentStatus: "PENDING",
          dueDate: new Date(Date.now() + 7 * 86400000),
        },
      ],
    });

    // Subsidy Record (PM Surya Ghar)
    await prisma.subsidyRecord.create({
      data: {
        subsidyRecordId: `SL-SUB-${Date.now()}`,
        projectId: project.id,
        customerId: customer.id,
        subsidyScheme: "PM Surya Ghar Muft Bijli Yojana",
        portalRegistrationNumber: "PMSGY-MP-2026-9812",
        expectedSubsidy: 78000,
        approvedSubsidy: 78000,
        currentStatus: "NET_METER_INSTALLED",
        bankAccountMasked: "XXXX-XXXX-4512",
        bankVerificationStatus: "VERIFIED",
      },
    });

    // Documents
    await prisma.document.createMany({
      data: [
        {
          documentId: `SL-DOC-${Date.now()}-1`,
          customerId: customer.id,
          projectId: project.id,
          documentCategory: "QUOTATION",
          documentName: "Approved Solar Quotation 5kW",
          fileLocation: "docs/quotation_5kw.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 245000,
          uploadedBy: salesMember.name,
          verificationStatus: "VERIFIED",
        },
        {
          documentId: `SL-DOC-${Date.now()}-2`,
          customerId: customer.id,
          projectId: project.id,
          documentCategory: "INSTALLATION_CERTIFICATE",
          documentName: "Installation & Commissioning Certificate",
          fileLocation: "docs/installation_cert.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 310000,
          uploadedBy: "Amit Verma (Site Engineer)",
          verificationStatus: "VERIFIED",
        },
        {
          documentId: `SL-DOC-${Date.now()}-3`,
          customerId: customer.id,
          projectId: project.id,
          documentCategory: "PANEL_WARRANTY",
          documentName: "Adani Solar 25-Year Performance Warranty",
          fileLocation: "docs/panel_warranty.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 520000,
          uploadedBy: "Operations Desk",
          verificationStatus: "VERIFIED",
        },
      ],
    });
  }

  // 4. Create an Open Lead (Amit Verma - 9876500001) for testing Enquiry Experience
  let lead = await prisma.lead.findFirst({
    where: { phone: "9876500001" },
  });

  if (!lead) {
    const leadCount = await prisma.lead.count();
    lead = await prisma.lead.create({
      data: {
        leadId: `SL-LEAD-2026-${String(leadCount + 1).padStart(4, "0")}`,
        name: "Amit Verma",
        phone: "9876500001",
        city: "Bhopal",
        propertyType: "Commercial",
        monthlyBill: "₹10,000+",
        requestedCapacity: 10.0,
        status: "NEW",
        source: "Sunlife Solar Mobile App",
        leadSource: "Sunlife Solar Mobile App",
        assignedSalesExecutiveId: salesMember.id,
      },
    });
    console.log(`Created Open Lead: ${lead.name} (${lead.phone})`);
  }

  console.log("Baseline seed completed successfully!");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
