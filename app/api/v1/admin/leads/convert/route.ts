import { NextResponse } from "next/server";
import { convertLeadToCustomerAndProject } from "@/lib/crm/lead-converter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, plantCapacityKw, solarType, assignedEngineerId, assignedSalesExecutiveId, notes, actorId } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required." }, { status: 400 });
    }

    const result = await convertLeadToCustomerAndProject({
      leadId,
      plantCapacityKw: plantCapacityKw ? parseFloat(plantCapacityKw) : undefined,
      solarType,
      assignedEngineerId,
      assignedSalesExecutiveId,
      notes,
      actorId: actorId || "ADMIN",
    });

    return NextResponse.json({
      success: true,
      message: "Lead successfully converted to Customer and Solar Project!",
      data: result,
    });
  } catch (error: any) {
    console.error("[Lead Convert Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert lead." },
      { status: 500 }
    );
  }
}
