export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getGoogleDriveConfigStatus } from "@/lib/storage/google-drive";

export async function GET() {
  const status = getGoogleDriveConfigStatus();
  return NextResponse.json({
    success: true,
    ...status,
  });
}
