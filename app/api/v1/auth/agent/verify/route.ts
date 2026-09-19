import { NextResponse } from "next/server";
import { verifyAgentOtp } from "@/lib/crm/agent-auth";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = body.phone || body.mobile || body.identifier || body.agent_id;
    const { otp } = body;

    if (!identifier || !otp) {
      return NextResponse.json(
        { error: "Mobile number and 6-digit OTP are required." },
        { status: 400 }
      );
    }

    const result = await verifyAgentOtp(identifier.toString(), otp.toString());

    // Audit log successful agent login
    try {
      await logAuditEvent({
        entityType: "TeamMember",
        entityId: result.agent.id,
        fieldChanged: "lastAppLogin",
        action: "STATUS_CHANGE",
        actorId: result.agent.employeeId || result.agent.id,
        actorType: "EMPLOYEE",
        source: "APP",
        newValue: "Successful Agent App OTP Login",
      });
    } catch (_) {
      // Non-critical audit logging failure
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Agent OTP Verify Error]:", error);
    return NextResponse.json(
      { error: error.message || "Invalid or expired OTP." },
      { status: 400 }
    );
  }
}
