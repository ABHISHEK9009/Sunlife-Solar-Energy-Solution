export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";

export async function GET(req: Request) {
  const entity = await authenticateCustomerRequest(req);
  if (!entity) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const isCustomer = !entity.isLead && entity.customerStatus === "ACTIVE";

    if (isCustomer) {
      // 1. Customer account with linked Solar Projects
      const customer = await prisma.customer.findUnique({
        where: { id: entity.id },
        include: {
          projects: {
            orderBy: { createdAt: "desc" },
            include: {
              assignedEngineer: {
                select: { id: true, name: true, phone: true, role: true },
              },
              assignedSalesExecutive: {
                select: { id: true, name: true, phone: true, role: true },
              },
              subsidy: {
                select: {
                  currentStatus: true,
                  expectedSubsidy: true,
                  approvedSubsidy: true,
                },
              },
              _count: {
                select: {
                  tickets: { where: { status: { notIn: ["RESOLVED", "CANCELLED"] } } },
                  documents: true,
                },
              },
            },
          },
        },
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer record not found" }, { status: 404 });
      }

      // Check if this customer also has an open additional enquiry for another property
      const openLead = await prisma.lead.findFirst({
        where: {
          phone: customer.primaryMobile,
          status: { in: ["NEW", "VERIFIED_INCOMPLETE", "CONTACTED", "SURVEY_SCHEDULED"] },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        accountState: "CUSTOMER" as const,
        user: {
          id: customer.id,
          customerId: customer.customerId,
          name: customer.fullName,
          phone: customer.primaryMobile,
          email: customer.email,
          address: customer.installationAddress,
          propertyType: customer.propertyType,
          preferredLanguage: customer.preferredLanguage,
        },
        projects: customer.projects,
        activeProjectId: customer.projects.length > 0 ? customer.projects[0].id : null,
        openEnquiry: openLead
          ? {
              id: openLead.id,
              leadId: openLead.leadId,
              propertyType: openLead.propertyType,
              city: openLead.city,
              status: openLead.status,
              requestedCapacity: openLead.requestedCapacity,
              surveyRequestedDate: openLead.surveyRequestedDate,
            }
          : null,
      });
    }

    // 2. Lead account (Pre-conversion / Enquiry experience)
    const lead = await prisma.lead.findUnique({
      where: { id: entity.id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead record not found" }, { status: 404 });
    }

    let assignedAdvisor = null;
    if (lead.assignedSalesExecutiveId) {
      const exec = await prisma.teamMember.findUnique({
        where: { id: lead.assignedSalesExecutiveId },
        select: { id: true, name: true, phone: true, territory: true },
      });
      if (exec) {
        assignedAdvisor = {
          name: exec.name,
          phone: exec.phone,
          territory: exec.territory,
        };
      }
    }

    const isProfileComplete = Boolean(
      lead.name && lead.name !== "New Applicant" && lead.city && lead.propertyType
    );

    return NextResponse.json({
      success: true,
      accountState: "LEAD" as const,
      user: {
        id: lead.id,
        leadId: lead.leadId,
        name: lead.name === "New Applicant" ? "" : lead.name,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        propertyType: lead.propertyType,
        monthlyBill: lead.monthlyBill,
        requestedCapacity: lead.requestedCapacity,
        recommendedCapacity: lead.recommendedCapacity,
        status: lead.status,
        surveyRequestedDate: lead.surveyRequestedDate,
      },
      assignedAdvisor,
      profileComplete: isProfileComplete,
      projects: [],
      activeProjectId: null,
    });
  } catch (error: any) {
    console.error("[GET /me Error]:", error);
    return NextResponse.json({ error: "Failed to resolve identity." }, { status: 500 });
  }
}
