import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Unable to load team members:", error);
    return NextResponse.json({ error: "Unable to load team members." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { members } = await request.json();
    if (!Array.isArray(members)) {
      return NextResponse.json({ error: "A team member list is required." }, { status: 400 });
    }

    await prisma.$transaction(
      members.map((member) => {
        if (!member.id || !member.name || !member.role || !member.phone) {
          throw new Error("Each team member needs an id, name, role, and phone.");
        }

        const data = {
          name: member.name,
          role: member.role,
          category: member.category || "Management",
          phone: member.phone,
          territory: member.territory || "",
          status: member.status || "Available",
          skills: Array.isArray(member.skills) ? member.skills : [],
          joinedYear: member.joinedYear || new Date().getFullYear().toString(),
          monthlySalary: member.monthlySalary ?? null,
          email: member.email ?? null,
          dob: member.dob ?? null,
          address: member.address ?? null,
          department: member.department ?? null,
          joiningDate: member.joiningDate ?? null,
          employmentType: member.employmentType ?? null,
          reportingManager: member.reportingManager ?? null,
          bankAccountHolder: member.bankAccountHolder ?? null,
          bankName: member.bankName ?? null,
          bankAccountNumber: member.bankAccountNumber ?? null,
          bankIFSC: member.bankIFSC ?? null,
          bankBranch: member.bankBranch ?? null,
          bankAccountType: member.bankAccountType ?? null,
          upiId: member.upiId ?? null,
          emailVerifiedAt: member.emailVerifiedAt ? new Date(member.emailVerifiedAt) : null,
          employeeAccessEnabled: member.employeeAccessEnabled ?? false,
        };

        return prisma.teamMember.upsert({ where: { id: member.id }, create: { id: member.id, ...data }, update: data });
      })
    );

    const savedMembers = await prisma.teamMember.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ members: savedMembers });
  } catch (error) {
    console.error("Unable to save team members:", error);
    return NextResponse.json({ error: "Unable to save team members." }, { status: 400 });
  }
}
