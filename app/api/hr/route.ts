import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [payrollProfiles, advances, monthlyPayroll, leaveRequests] = await Promise.all([
      prisma.payrollProfile.findMany(),
      prisma.employeeAdvance.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.monthlyPayroll.findMany(),
      prisma.leaveRequest.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    return NextResponse.json({ payrollProfiles, advances, monthlyPayroll, leaveRequests });
  } catch (error) {
    console.error("Unable to load HR records:", error);
    return NextResponse.json({ error: "Unable to load HR records." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const operations = [];

    if (body.payrollRecords) {
      operations.push(...Object.values(body.payrollRecords).map((record: any) =>
        prisma.payrollProfile.upsert({
          where: { memberId: record.memberId },
          create: {
            memberId: record.memberId, baseAmount: Number(record.baseAmount) || 0,
            fieldAllowance: Number(record.fieldAllowance) || 0, paymentStatus: record.paymentStatus || "PENDING",
            paymentMode: record.paymentMode || "Bank Transfer",
          },
          update: {
            baseAmount: Number(record.baseAmount) || 0, fieldAllowance: Number(record.fieldAllowance) || 0,
            paymentStatus: record.paymentStatus || "PENDING", paymentMode: record.paymentMode || "Bank Transfer",
          },
        })
      ));
    }

    if (body.advances) {
      operations.push(...body.advances.map((advance: any) =>
        prisma.employeeAdvance.upsert({
          where: { id: advance.id },
          create: { ...advance, settlements: advance.settlements || [] },
          update: { ...advance, settlements: advance.settlements || [] },
        })
      ));
    }

    if (body.monthlyPayrollRecords) {
      operations.push(...Object.values(body.monthlyPayrollRecords).map((record: any) =>
        prisma.monthlyPayroll.upsert({
          where: { id: `${record.memberId}_${record.month}` },
          create: { ...record, id: `${record.memberId}_${record.month}` },
          update: { ...record },
        })
      ));
    }

    if (body.leaveRequest) {
      const request = body.leaveRequest;
      operations.push(prisma.leaveRequest.upsert({
        where: { id: request.id }, create: request, update: request,
      }));
    }

    await prisma.$transaction(operations);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unable to save HR records:", error);
    return NextResponse.json({ error: "Unable to save HR records." }, { status: 400 });
  }
}
