export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getGoogleDriveAuthUrl } from "@/lib/storage/google-drive";

export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const authUrl = getGoogleDriveAuthUrl(origin);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("[Google Drive OAuth Init Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize Google OAuth." },
      { status: 500 }
    );
  }
}
