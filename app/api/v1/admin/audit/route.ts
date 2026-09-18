import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");

    const logs = await prisma.auditLog.findMany({
      where: entityType ? { entityType } : {},
      orderBy: { timestamp: "desc" },
      take: 150,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit trail." }, { status: 500 });
  }
}
