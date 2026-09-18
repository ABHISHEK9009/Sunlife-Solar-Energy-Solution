import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET() {
  try {
    const referrals = await prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        referringCustomer: { select: { customerId: true, fullName: true, primaryMobile: true } },
        lead: { select: { name: true, phone: true, status: true } },
      },
      take: 100,
    });
    return NextResponse.json({ success: true, referrals });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch referrals." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, referralStatus, rewardStatus, rewardPaymentReference } = body;

    const updated = await prisma.referral.update({
      where: { id },
      data: {
        ...(referralStatus && { referralStatus }),
        ...(rewardStatus && { rewardStatus }),
        ...(rewardPaymentReference !== undefined && { rewardPaymentReference }),
      },
    });

    await logAuditEvent({
      entityType: "Referral",
      entityId: id,
      fieldChanged: "rewardStatus",
      action: "STATUS_CHANGE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Referral reward status: ${rewardStatus}`,
    });

    return NextResponse.json({ success: true, referral: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update referral." }, { status: 500 });
  }
}
