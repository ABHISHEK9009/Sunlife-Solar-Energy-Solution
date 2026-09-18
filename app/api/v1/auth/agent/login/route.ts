import { NextResponse } from "next/server";
import { sendAgentOtp } from "@/lib/crm/agent-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = body.identifier || body.agent_id || body.phone;

    if (!identifier) {
      return NextResponse.json(
        { error: "Employee ID or registered mobile number is required." },
        { status: 400 }
      );
    }

    const result = await sendAgentOtp(identifier);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Agent OTP Send Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch agent OTP." },
      { status: 400 }
    );
  }
}
