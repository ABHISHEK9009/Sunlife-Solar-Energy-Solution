import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { calculateSolarSavings } from "@/lib/crm/savings-engine";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = params;

  try {
    const project = await prisma.solarProject.findFirst({
      where: {
        id,
        customerId: customer.id,
      },
      include: {
        subsidy: true,
        monitoring: true,
        quotations: {
          where: { approvalStatus: "APPROVED" },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const approvedQuote = project.quotations[0];
    const grossCost = approvedQuote ? approvedQuote.grossProjectCost : project.plantCapacityKw * 65000;
    const subsidyAmount = project.subsidy?.approvedSubsidy || project.subsidy?.expectedSubsidy || 0;
    const totalGenerated = project.monitoring?.totalGeneratedEnergyKwh || 0;
    const totalExported = project.monitoring?.totalExportedEnergyKwh || 0;

    const savings = calculateSolarSavings({
      systemCapacityKw: project.plantCapacityKw,
      systemInvestmentCost: grossCost,
      approvedSubsidy: subsidyAmount,
      commissioningDate: project.commissioningDate || project.installationDate || project.createdAt,
      totalGeneratedKwh: totalGenerated,
      totalExportedKwh: totalExported,
    });

    return NextResponse.json({
      success: true,
      savings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to calculate savings metrics." }, { status: 500 });
  }
}
