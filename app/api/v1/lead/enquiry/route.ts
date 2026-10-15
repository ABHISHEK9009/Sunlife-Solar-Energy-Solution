export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { assignLeadToSales } from "@/lib/crm/territory-router";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function POST(req: Request) {
  const entity = await authenticateCustomerRequest(req);
  if (!entity) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      city,
      pinCode,
      propertyType,
      monthlyBill,
      roofSize,
      rooftopArea,
      interestedSolution,
      requestedCapacity,
      surveyRequestedDate,
      step, // 'PERSONAL' | 'REQUIREMENT' | 'COMPLETE'
    } = body;

    const phone = entity.primaryMobile || entity.phone;

    // 1. If entity is a Customer submitting an additional property enquiry:
    if (!entity.isLead && entity.customerStatus === "ACTIVE") {
      let openLead = await prisma.lead.findFirst({
        where: {
          phone,
          status: { in: ["NEW", "VERIFIED_INCOMPLETE", "CONTACTED", "SURVEY_SCHEDULED"] },
        },
        orderBy: { createdAt: "desc" },
      });

      const territory = await assignLeadToSales(city, pinCode);

      if (!openLead) {
        const count = await prisma.lead.count();
        const leadCode = `SL-LEAD-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
        openLead = await prisma.lead.create({
          data: {
            leadId: leadCode,
            customerId: entity.id,
            name: name || entity.fullName || "Customer",
            phone,
            city: city || "Narmadapuram",
            propertyType: propertyType || "Commercial",
            monthlyBill: monthlyBill ? String(monthlyBill) : null,
            roofSize: roofSize ? String(roofSize) : null,
            requestedCapacity: requestedCapacity ? parseFloat(requestedCapacity) : null,
            interestedSolution: interestedSolution || "Rooftop Solar",
            surveyRequestedDate: surveyRequestedDate ? new Date(surveyRequestedDate) : null,
            status: "NEW",
            source: "Sunlife Solar Mobile App (Additional Property)",
            leadSource: "Sunlife Solar Mobile App",
            assignedSalesExecutiveId: territory.salesExecutiveId,
          },
        });
      } else {
        openLead = await prisma.lead.update({
          where: { id: openLead.id },
          data: {
            name: name || openLead.name,
            city: city || openLead.city,
            propertyType: propertyType || openLead.propertyType,
            monthlyBill: monthlyBill ? String(monthlyBill) : openLead.monthlyBill,
            roofSize: roofSize ? String(roofSize) : openLead.roofSize,
            requestedCapacity: requestedCapacity ? parseFloat(requestedCapacity) : openLead.requestedCapacity,
            surveyRequestedDate: surveyRequestedDate ? new Date(surveyRequestedDate) : openLead.surveyRequestedDate,
            status: "NEW",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Additional property enquiry recorded successfully.",
        lead: openLead,
      });
    }

    // 2. If entity is a Lead completing chunk 1 (Personal) or chunk 2 (Requirement):
    const leadId = entity.id;
    const existingLead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead record not found." }, { status: 404 });
    }

    const updateData: any = {};

    if (name) updateData.name = name.trim();
    if (city) {
      updateData.city = city.trim();
      updateData.location = city.trim();
    }
    if (propertyType) updateData.propertyType = propertyType;
    if (monthlyBill) updateData.monthlyBill = String(monthlyBill);
    if (roofSize) updateData.roofSize = String(roofSize);
    if (rooftopArea) updateData.rooftopArea = String(rooftopArea);
    if (interestedSolution) updateData.interestedSolution = interestedSolution;
    if (requestedCapacity) updateData.requestedCapacity = parseFloat(requestedCapacity);
    if (surveyRequestedDate) updateData.surveyRequestedDate = new Date(surveyRequestedDate);

    // If city is updated, re-evaluate territory assignment if not yet assigned
    if (city && !existingLead.assignedSalesExecutiveId) {
      const territory = await assignLeadToSales(city, pinCode);
      if (territory.salesExecutiveId) {
        updateData.assignedSalesExecutiveId = territory.salesExecutiveId;
      }
    }

    // Advance status from VERIFIED_INCOMPLETE to NEW once basic details are in
    if (name && (city || existingLead.city)) {
      updateData.status = "NEW";
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    try {
      await logAuditEvent({
        entityType: "Lead",
        entityId: leadId,
        fieldChanged: "profile",
        action: "UPDATE",
        actorId: leadId,
        actorType: "CUSTOMER",
        source: "APP",
        newValue: `Lead profile updated: Name="${updated.name}", City="${updated.city || ""}", Property="${updated.propertyType || ""}"`,
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: "Enquiry details updated.",
      lead: updated,
      profileComplete: Boolean(updated.name && updated.city && updated.propertyType),
    });
  } catch (error: any) {
    console.error("[Lead Enquiry Update Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update enquiry." },
      { status: 500 }
    );
  }
}
