export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";

export async function GET(req: Request) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  try {
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { assignedSalesExecutiveId: agent.id },
          ...(agent.employeeId ? [{ assignedSalesExecutiveId: agent.employeeId }] : []),
          ...(agent.name ? [{ assignedSalesExecutiveId: agent.name }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        leadId: true,
        name: true,
        phone: true,
        city: true,
        location: true,
        monthlyBill: true,
        status: true,
        notes: true,
        createdAt: true,
        requestedCapacity: true,
        propertyType: true,
        interestedSolution: true,
        leadSource: true,
        surveyRequestedDate: true,
        assignedSalesExecutiveId: true,
      },
    });

    return NextResponse.json({
      success: true,
      leads: leads.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        location: l.location || l.city || "Jaipur",
        stage: l.status,
        monthlyBill: l.monthlyBill ? `₹${l.monthlyBill}/month` : "₹5,000/month",
        notes: l.notes,
        propertyType: l.propertyType || "Residential",
        preferredSystem: l.interestedSolution || (l.requestedCapacity ? `${l.requestedCapacity} kW` : "On-Grid"),
        solarRequirement: l.interestedSolution || "On-Grid",
        approxCapacity: l.requestedCapacity ? `${l.requestedCapacity} kW` : "Not Sure",
        leadSource: l.leadSource || "Field Visit",
        assignedAgent: agent.name,
        assignedSalesExecutiveId: l.assignedSalesExecutiveId,
        nextFollowUpDate: l.surveyRequestedDate ? l.surveyRequestedDate.toISOString() : null,
        createdAt: l.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("[Agent Leads GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch leads from CRM database." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      phone,
      city,
      district,
      location,
      monthlyBill,
      propertyType,
      solarRequirement,
      interestedSolution,
      approxCapacity,
      requestedCapacity,
      leadSource,
      assignedAgent,
      status,
      nextFollowUpDate,
      notes,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Lead name and phone number are required." }, { status: 400 });
    }

    const cleanPhone = phone.toString().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const cleanBill = monthlyBill ? monthlyBill.toString().replace(/[^\d.]/g, "") : "5000";

    // Format location (City/Village + District)
    const formattedLocation = location?.trim() || (
      city && district ? `${city.trim()}, ${district.trim()}` : (city || district || "Narmadapuram")
    );

    // Parse approx capacity kW
    const capInput = approxCapacity || requestedCapacity;
    let capFloat: number | null = null;
    if (capInput && capInput.toString().toLowerCase() !== "not sure") {
      const parsed = parseFloat(capInput.toString().replace(/[^\d.]/g, ""));
      if (!isNaN(parsed) && parsed > 0) {
        capFloat = parsed;
      }
    }

    const solutionType = solarRequirement || interestedSolution || "On-Grid";
    const reqType = propertyType || "Residential";
    const sourceLabel = leadSource || "Field Visit";
    const leadStatus = status || "NEW";

    const followUp = nextFollowUpDate ? new Date(nextFollowUpDate) : null;

    const newLead = await prisma.lead.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        city: city?.trim() || formattedLocation,
        location: formattedLocation,
        monthlyBill: cleanBill,
        propertyType: reqType,
        interestedSolution: solutionType,
        requestedCapacity: capFloat,
        leadSource: sourceLabel,
        source: `Field Agent (${agent.name}) - ${sourceLabel}`,
        status: leadStatus,
        surveyRequestedDate: followUp,
        notes: notes?.trim(),
        assignedSalesExecutiveId: agent.id,
      },
    });

    return NextResponse.json({
      success: true,
      lead: {
        id: newLead.id,
        name: newLead.name,
        phone: newLead.phone,
        location: newLead.location || newLead.city,
        stage: newLead.status,
        monthlyBill: `₹${newLead.monthlyBill}/month`,
        propertyType: newLead.propertyType,
        solarRequirement: newLead.interestedSolution,
        approxCapacity: newLead.requestedCapacity ? `${newLead.requestedCapacity} kW` : "Not Sure",
        leadSource: newLead.leadSource,
        nextFollowUpDate: newLead.surveyRequestedDate ? newLead.surveyRequestedDate.toISOString() : null,
        notes: newLead.notes,
        createdAt: newLead.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Agent Leads POST Error]:", error);
    return NextResponse.json({ error: "Failed to capture new lead." }, { status: 500 });
  }
}
