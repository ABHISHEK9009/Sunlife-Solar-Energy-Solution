import { NextResponse } from "next/server";
import { sendCustomerOtp } from "@/lib/crm/auth-otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Primary mobile number is required." },
        { status: 400 }
      );
    }

    const result = await sendCustomerOtp(phone);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[OTP Send Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch OTP." },
      { status: 400 }
    );
  }
}
