import { NextResponse } from "next/server";
import { verifyCustomerOtp } from "@/lib/crm/auth-otp";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone number and 6-digit OTP are required." },
        { status: 400 }
      );
    }

    const result = await verifyCustomerOtp(phone, otp);

    // Audit log successful app login
    const actorId = result.user?.id || result.user?.customerId || phone;
    const entityType = result.accountState === "CUSTOMER" ? "Customer" : "Lead";

    try {
      await logAuditEvent({
        entityType,
        entityId: result.user?.id || actorId,
        fieldChanged: "lastAppLogin",
        action: "STATUS_CHANGE",
        actorId: actorId,
        actorType: "CUSTOMER",
        source: "APP",
        newValue: `Successful App Login (${result.accountState})`,
      });
    } catch (_) {}

    return NextResponse.json({
      ...result,
      // Provide backwards compatibility for clients expecting customer key
      customer: result.user,
    });
  } catch (error: any) {
    console.error("[OTP Verify Error]:", error);
    return NextResponse.json(
      { error: error.message || "Invalid or expired OTP." },
      { status: 400 }
    );
  }
}
