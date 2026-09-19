export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleGoogleDriveOAuthCallback } from "@/lib/storage/google-drive";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("[Google Drive OAuth Callback Error]:", error);
    return NextResponse.redirect(
      new URL(`/admin/documents?drive_error=${encodeURIComponent(error)}`, origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/documents?drive_error=missing_code", origin)
    );
  }

  try {
    const result = await handleGoogleDriveOAuthCallback(code, origin);

    await logAuditEvent({
      entityType: "SystemSetting",
      entityId: "GOOGLE_DRIVE",
      fieldChanged: "storage_provider",
      action: "UPDATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Connected Google Drive via OAuth (${result.accountEmail || "Authorized Account"})`,
    });

    return NextResponse.redirect(
      new URL("/admin/documents?drive_connected=1", origin)
    );
  } catch (err: any) {
    console.error("[Google Drive Token Exchange Error]:", err);
    return NextResponse.redirect(
      new URL(
        `/admin/documents?drive_error=${encodeURIComponent(err.message || "Failed to exchange token")}`,
        origin
      )
    );
  }
}
