import { createHash, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const hashCode = (code: string) =>
  createHash("sha256").update(code).digest("hex");

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[character] || character)
  );

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> | { memberId: string } }
) {
  try {
    const { action, code } = await request.json();
    const resolvedParams = await Promise.resolve(context.params);
    const memberId = resolvedParams.memberId;

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required." },
        { status: 400 }
      );
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        OR: [{ id: memberId }, { employeeId: memberId }],
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Employee record not found." },
        { status: 404 }
      );
    }

    // Direct Administrator Instant Activation (Bypasses email roundtrip)
    if (action === "admin-activate" || action === "quick-verify") {
      await prisma.teamMember.update({
        where: { id: member.id },
        data: {
          emailVerifiedAt: new Date(),
          employeeAccessEnabled: true,
          activeStatus: true,
          verificationCodeHash: null,
          verificationExpiresAt: null,
        },
      });

      return NextResponse.json({
        ok: true,
        verified: true,
        message: "Employee access activated successfully.",
      });
    }

    // Require email for verification code flows
    if (!member.email) {
      return NextResponse.json(
        { error: "Please add an email address to this employee profile first." },
        { status: 400 }
      );
    }

    if (action === "send") {
      const apiKey = process.env.RESEND_API_KEY;
      const from =
        process.env.RESEND_FROM ||
        "Sunlife Solar <notifications@sunlifesolar.in>";

      if (!apiKey) {
        return NextResponse.json(
          {
            error:
              "Email delivery service is not configured. Use 'Quick Activate' to verify instantly.",
          },
          { status: 503 }
        );
      }

      const verificationCode = String(randomInt(100000, 1000000));

      await prisma.teamMember.update({
        where: { id: member.id },
        data: {
          verificationCodeHash: hashCode(verificationCode),
          verificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          emailVerifiedAt: null,
        },
      });

      const resend = new Resend(apiKey);
      const name = escapeHtml(member.name);

      const { error } = await resend.emails.send({
        from,
        to: member.email,
        subject: `${verificationCode} is your Sunlife Solar verification code`,
        html: `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.10)"><tr><td style="background:linear-gradient(135deg,#052e2b,#08765c);padding:26px 36px;color:#fff"><table role="presentation" width="100%"><tr><td><img src="https://sunlifesolar.in/logo/logo.png" width="150" alt="Sunlife Solar" style="display:block;height:auto;max-width:150px"></td><td align="right" style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#a7f3d0">SECURE EMPLOYEE ACCESS</td></tr></table><div style="font-size:25px;font-weight:800;margin-top:24px">Verify your employee email</div><div style="font-size:14px;line-height:22px;color:#d1fae5;margin-top:8px">One quick step to activate your Sunlife Solar employee portal.</div></td></tr><tr><td style="padding:36px"><p style="font-size:16px;font-weight:700;margin:0 0 12px">Hello ${name},</p><p style="font-size:15px;line-height:24px;color:#475569;margin:0">An administrator requested verification of this email address. Use the secure code below in the employee profile to confirm access.</p><div style="margin:28px 0;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:22px;text-align:center"><div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#047857">YOUR VERIFICATION CODE</div><div style="font-family:monospace;font-size:34px;font-weight:800;letter-spacing:9px;color:#064e3b;margin-top:10px">${verificationCode}</div><div style="margin-top:18px"><span style="display:inline-block;border:1px solid #86efac;border-radius:7px;background:#ffffff;padding:8px 14px;font-size:12px;font-weight:700;color:#047857">📋 COPY CODE</span></div></div><p style="font-size:14px;line-height:22px;color:#64748b;margin:0">This code expires in <strong>10 minutes</strong>. For your security, never share this code with anyone.</p><div style="margin-top:24px;border-radius:12px;background:#f8fafc;padding:16px;font-size:13px;line-height:20px;color:#475569"><strong style="color:#0f172a">Power your future with solar energy.</strong><br>Sunlife Solar provides trusted rooftop solar solutions for homes, businesses and industries across Madhya Pradesh.</div><div style="border-top:1px solid #e2e8f0;margin-top:28px;padding-top:20px;font-size:12px;line-height:18px;color:#94a3b8">If you did not expect this request, you can safely ignore this email.<br>© ${new Date().getFullYear()} Sunlife Solar Energy Solution · <a href="https://sunlifesolar.in" style="color:#047857;text-decoration:none">sunlifesolar.in</a></div></td></tr></table></td></tr></table></body></html>`,
        text: `Hello ${member.name}, your Sunlife Solar verification code is ${verificationCode}. It expires in 10 minutes. Visit sunlifesolar.in for rooftop solar solutions. Do not share this code.`,
      });

      if (error) {
        console.error("[Email Verification Resend Error]:", error);
        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to dispatch email. You can use 'Quick Activate' to verify directly.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `Verification code successfully sent to ${member.email}.`,
      });
    }

    if (action === "verify") {
      const valid =
        typeof code === "string" &&
        member.verificationCodeHash === hashCode(code.trim()) &&
        member.verificationExpiresAt &&
        member.verificationExpiresAt > new Date();

      if (!valid) {
        return NextResponse.json(
          { error: "The verification code is invalid or has expired." },
          { status: 400 }
        );
      }

      await prisma.teamMember.update({
        where: { id: member.id },
        data: {
          emailVerifiedAt: new Date(),
          employeeAccessEnabled: true,
          activeStatus: true,
          verificationCodeHash: null,
          verificationExpiresAt: null,
        },
      });

      return NextResponse.json({
        ok: true,
        verified: true,
        message: "Email successfully verified and portal access enabled.",
      });
    }

    return NextResponse.json(
      { error: "Invalid verification action requested." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[Email Verification API Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error occurred." },
      { status: 500 }
    );
  }
}
