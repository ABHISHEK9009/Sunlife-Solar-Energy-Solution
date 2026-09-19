import { NextResponse } from "next/server";
import { sendAgentOtp } from "@/lib/crm/agent-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = body.phone || body.mobile || body.identifier || body.agent_id;

    if (!identifier || !identifier.toString().trim()) {
      return NextResponse.json(
        { error: "Please enter your registered 10-digit mobile number." },
        { status: 400 }
      );
    }

    const result = await sendAgentOtp(identifier.toString());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Agent OTP Send Error]:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "We could not verify this account. Please check your mobile number or contact your administrator.",
      },
      { status: 400 }
    );
  }
}
