export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";

export async function GET(req: Request) {
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

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
