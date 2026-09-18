import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";

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
    const subsidy = await prisma.subsidyRecord.findFirst({
      where: {
        projectId: id,
        customerId: customer.id,
      },
      include: {
        history: {
          orderBy: { timestamp: "desc" },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            changedBy: true,
            changeRemarks: true,
            timestamp: true,
          },
        },
      },
    });

    if (!subsidy) {
      return NextResponse.json({
        success: true,
        subsidy: null,
        message: "Subsidy record not yet initiated for this project.",
      });
    }

    const stages = [
      "NOT_STARTED",
      "PORTAL_REGISTRATION",
      "DISCOM_APPLICATION",
      "FEASIBILITY_APPROVAL",
      "INSTALLATION",
      "INSPECTION",
      "NET_METER_INSTALLED",
      "SUBSIDY_PROCESSING",
      "SUBSIDY_APPROVED",
      "SUBSIDY_CREDITED",
    ];

    const currentStageIndex = stages.indexOf(subsidy.currentStatus);

    return NextResponse.json({
      success: true,
      subsidy: {
        ...subsidy,
        allStages: stages,
        currentStageIndex: currentStageIndex !== -1 ? currentStageIndex : 0,
        isCompleted: subsidy.currentStatus === "SUBSIDY_CREDITED",
        isRejected: subsidy.currentStatus === "REJECTED",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch subsidy record." }, { status: 500 });
  }
}
