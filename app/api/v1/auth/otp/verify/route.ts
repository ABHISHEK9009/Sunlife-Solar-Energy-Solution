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
    await logAuditEvent({
      entityType: "Customer",
      entityId: result.customer.id,
      fieldChanged: "lastAppLogin",
      action: "STATUS_CHANGE",
      actorId: result.customer.customerId,
      actorType: "CUSTOMER",
      source: "APP",
      newValue: "Successful Mobile App OTP Login",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[OTP Verify Error]:", error);
    return NextResponse.json(
      { error: error.message || "Invalid or expired OTP." },
      { status: 400 }
    );
  }
}
