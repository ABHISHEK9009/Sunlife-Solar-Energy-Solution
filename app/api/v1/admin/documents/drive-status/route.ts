export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getGoogleDriveConfigStatus } from "@/lib/storage/google-drive";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";

export async function GET(req: Request) {
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

  const status = await getGoogleDriveConfigStatus();
  return NextResponse.json({
    success: true,
    ...status,
  });
}
