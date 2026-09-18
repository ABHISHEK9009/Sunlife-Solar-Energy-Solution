export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const referrals = await prisma.referral.findMany({
      where: { referringCustomerId: customer.id },
      orderBy: { createdAt: "desc" },
    });

    const referralCode = `SUN-${customer.primaryMobile.slice(-4)}`;
    const totalEarned = referrals
      .filter((r) => r.rewardStatus === "PAID")
      .reduce((acc, curr) => acc + curr.eligibleRewardAmount, 0);

    const pendingReward = referrals
      .filter((r) => r.rewardStatus === "PENDING" && r.eligibleRewardAmount > 0)
      .reduce((acc, curr) => acc + curr.eligibleRewardAmount, 0);

    return NextResponse.json({
      success: true,
      referralCode,
      referralLink: `https://sunlifesolar.in/quote?ref=${referralCode}`,
      summary: {
        totalReferred: referrals.length,
        totalEarned,
        pendingReward,
      },
      referrals,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch referrals." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, city, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Friend's name and mobile number are required." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const referralCode = `SUN-${customer.primaryMobile.slice(-4)}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Create a lead tagged with referral code
      const leadCount = await tx.lead.count();
      const leadCode = `SL-LEAD-${new Date().getFullYear()}-${1000 + leadCount + 1}`;

      const lead = await tx.lead.create({
        data: {
          leadId: leadCode,
          name: name.trim(),
          phone: cleanPhone,
          city: city || "Narmadapuram",
          leadSource: "Customer Referral",
          source: "Customer Referral",
          referralCode,
          notes: `Referred by customer ${customer.fullName} (${customer.customerId}). ${notes || ""}`.trim(),
          status: "NEW",
        },
      });

      // 2. Create referral tracking record
      const refCount = await tx.referral.count();
      const refCode = `SL-REF-${1000 + refCount + 1}`;

      const referral = await tx.referral.create({
        data: {
          referralId: refCode,
          referringCustomerId: customer.id,
          referralCode,
          referredPersonName: name.trim(),
          referredMobileNumber: cleanPhone,
          leadId: lead.id,
          referralStatus: "LEAD_CREATED",
          eligibleRewardAmount: 1500,
          rewardStatus: "PENDING",
        },
      });

      await logAuditEvent({
        entityType: "Referral",
        entityId: referral.id,
        fieldChanged: "all",
        action: "CREATE",
        actorId: customer.customerId,
        actorType: "CUSTOMER",
        source: "APP",
        newValue: `Referral submitted for ${name} (${cleanPhone})`,
      });

      return NextResponse.json({
        success: true,
        referral,
        message: "Referral submitted successfully! You will earn ₹1,500 once installation is confirmed.",
      });
    });
  } catch (error: any) {
    console.error("[Referral Submit Error]:", error);
    return NextResponse.json({ error: "Failed to submit referral." }, { status: 500 });
  }
}
