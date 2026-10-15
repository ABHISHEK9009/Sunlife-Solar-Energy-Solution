export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getGoogleDriveAuthUrl } from "@/lib/storage/google-drive";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";

export async function GET(req: NextRequest) {
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

  try {
    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const callbackParam = req.nextUrl.searchParams.get("callback");
    const customPath = callbackParam === "admin"
      ? "/api/v1/admin/documents/drive-auth/callback"
      : callbackParam === "google"
      ? "/api/auth/callback/google"
      : undefined;
    const authUrl = getGoogleDriveAuthUrl(origin, customPath);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("[Google Drive OAuth Init Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize Google OAuth." },
      { status: 500 }
    );
  }
}
