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
      orderBy: { createdAt: "desc" },
      take: 50,
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
    const { name, phone, location, monthlyBill, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Lead name and phone number are required." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanBill = monthlyBill ? monthlyBill.toString().replace(/[^\d.]/g, "") : "5000";

    const newLead = await prisma.lead.create({
      data: {
        name,
        phone: cleanPhone,
        city: location || "Jaipur",
        location: location || "Jaipur",
        monthlyBill: cleanBill,
        notes,
        status: "NEW",
        source: `Field Agent App (${agent.name})`,
        leadSource: "Field Agent App",
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
        notes: newLead.notes,
        createdAt: newLead.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Agent Leads POST Error]:", error);
    return NextResponse.json({ error: "Failed to capture new lead." }, { status: 500 });
  }
}
