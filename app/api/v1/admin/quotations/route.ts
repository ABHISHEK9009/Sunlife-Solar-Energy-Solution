import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET() {
  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            projectId: true,
            projectName: true,
            customer: { select: { customerId: true, fullName: true, primaryMobile: true } },
          },
        },
      },
      take: 100,
    });
    return NextResponse.json({ success: true, quotations });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quotations." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, capacityKw, baseAmount, taxAmount, discountAmount, expectedSubsidy, validUntilDays = 15 } = body;

    const existingQuotes = await prisma.quotation.findMany({
      where: { projectId },
      orderBy: { versionNumber: "desc" },
      take: 1,
    });

    const nextVersion = existingQuotes.length > 0 ? existingQuotes[0].versionNumber + 1 : 1;
    const base = parseFloat(baseAmount);
    const tax = parseFloat(taxAmount || "0");
    const discount = parseFloat(discountAmount || "0");
    const subsidy = parseFloat(expectedSubsidy || "0");
    const gross = base + tax - discount;
    const net = Math.max(0, gross - subsidy);

    const project = await prisma.solarProject.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const quotationId = `SL-QT-${project.projectId}-V${nextVersion}`;

    const quotation = await prisma.quotation.create({
      data: {
        quotationId,
        projectId,
        versionNumber: nextVersion,
        capacityKw: parseFloat(capacityKw),
        baseAmount: base,
        taxAmount: tax,
        discountAmount: discount,
        grossProjectCost: gross,
        expectedSubsidy: subsidy,
        customerNetCost: net,
        validUntilDate: new Date(Date.now() + validUntilDays * 24 * 60 * 60 * 1000),
        approvalStatus: "SENT",
      },
    });

    await logAuditEvent({
      entityType: "Quotation",
      entityId: quotation.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Generated Quotation ${quotation.quotationId} (V${nextVersion})`,
    });

    return NextResponse.json({ success: true, quotation });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create quotation." }, { status: 500 });
  }
}
