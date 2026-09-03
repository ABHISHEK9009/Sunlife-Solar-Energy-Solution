import { createHash, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");

export async function POST(request: NextRequest, { params }: { params: { memberId: string } }) {
  const { action, code } = await request.json();
  const member = await prisma.teamMember.findUnique({ where: { id: params.memberId } });
  if (!member?.email) return NextResponse.json({ error: "Add the employee email before sending a verification code." }, { status: 400 });

  if (action === "send") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    if (!apiKey || !from) return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });
    const verificationCode = String(randomInt(100000, 1000000));
    await prisma.teamMember.update({ where: { id: member.id }, data: { verificationCodeHash: hashCode(verificationCode), verificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000), emailVerifiedAt: null } });
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to: member.email, subject: "Your Sunlife Solar verification code", html: `<p>Hello ${member.name},</p><p>Your verification code is:</p><h1 style="letter-spacing:6px">${verificationCode}</h1><p>This code expires in 10 minutes. Do not share it with anyone.</p>` });
    if (error) return NextResponse.json({ error: "Unable to send the verification email." }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  if (action === "verify") {
    const valid = typeof code === "string" && member.verificationCodeHash === hashCode(code.trim()) && member.verificationExpiresAt && member.verificationExpiresAt > new Date();
    if (!valid) return NextResponse.json({ error: "The verification code is invalid or has expired." }, { status: 400 });
    await prisma.teamMember.update({ where: { id: member.id }, data: { emailVerifiedAt: new Date(), employeeAccessEnabled: true, verificationCodeHash: null, verificationExpiresAt: null } });
    return NextResponse.json({ ok: true, verified: true });
  }

  return NextResponse.json({ error: "Invalid verification action." }, { status: 400 });
}
