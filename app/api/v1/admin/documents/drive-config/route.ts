export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleDriveConfigStatus,
  testGoogleDriveConnection,
  saveGoogleDriveConfig,
  disconnectGoogleDrive,
  getEffectiveDriveConfig,
} from "@/lib/storage/google-drive";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET() {
  try {
    const status = getGoogleDriveConfigStatus();
    const config = getEffectiveDriveConfig();

    return NextResponse.json({
      success: true,
      ...status,
      clientId: config.clientId || null,
      hasServiceAccountPrivateKey: Boolean(config.serviceAccountPrivateKey),
      hasRefreshToken: Boolean(config.refreshToken),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve Google Drive status." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      authMethod,
      folderId,
      serviceAccountJson,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      clientId,
      clientSecret,
      refreshToken,
      testOnly = false,
    } = body;

    let candidateConfig: any = {
      folderId: folderId ? folderId.trim() : undefined,
    };

    // If a full Service Account JSON is pasted / uploaded
    if (serviceAccountJson) {
      try {
        const parsed =
          typeof serviceAccountJson === "string"
            ? JSON.parse(serviceAccountJson)
            : serviceAccountJson;

        if (!parsed.client_email || !parsed.private_key) {
          return NextResponse.json(
            { error: "Invalid Service Account JSON. Missing client_email or private_key." },
            { status: 400 }
          );
        }

        candidateConfig.authMethod = "SERVICE_ACCOUNT";
        candidateConfig.serviceAccountEmail = parsed.client_email;
        candidateConfig.serviceAccountPrivateKey = parsed.private_key;
        candidateConfig.accountEmail = parsed.client_email;
      } catch (err: any) {
        return NextResponse.json(
          { error: "Failed to parse Service Account JSON: " + err.message },
          { status: 400 }
        );
      }
    } else if (authMethod === "SERVICE_ACCOUNT") {
      if (!serviceAccountEmail || !serviceAccountPrivateKey) {
        return NextResponse.json(
          { error: "Service Account Email and Private Key are required." },
          { status: 400 }
        );
      }
      candidateConfig.authMethod = "SERVICE_ACCOUNT";
      candidateConfig.serviceAccountEmail = serviceAccountEmail.trim();
      candidateConfig.serviceAccountPrivateKey = serviceAccountPrivateKey.trim();
      candidateConfig.accountEmail = serviceAccountEmail.trim();
    } else if (authMethod === "OAUTH2") {
      if (!refreshToken) {
        return NextResponse.json(
          { error: "OAuth2 Refresh Token is required." },
          { status: 400 }
        );
      }
      candidateConfig.authMethod = "OAUTH2";
      if (clientId) candidateConfig.clientId = clientId.trim();
      if (clientSecret) candidateConfig.clientSecret = clientSecret.trim();
      candidateConfig.refreshToken = refreshToken.trim();
    }

    // Live test connection
    const testResult = await testGoogleDriveConnection(candidateConfig);

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.error,
          accountEmail: testResult.accountEmail,
        },
        { status: 400 }
      );
    }

    if (testOnly) {
      return NextResponse.json({
        ...testResult,
        message: "Google Drive connection test successful!",
      });
    }

    // Save configuration
    const saved = saveGoogleDriveConfig({
      ...candidateConfig,
      folderId: testResult.folderId || candidateConfig.folderId,
      folderName: testResult.folderName,
      accountEmail: testResult.accountEmail || candidateConfig.accountEmail,
    });

    await logAuditEvent({
      entityType: "SystemSetting",
      entityId: "GOOGLE_DRIVE",
      fieldChanged: "storage_provider",
      action: "UPDATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Configured Google Drive document storage (Folder: ${saved.folderName} - ${saved.folderId})`,
    });

    return NextResponse.json({
      success: true,
      message: "Google Drive configured successfully!",
      config: {
        connected: true,
        authMethod: saved.authMethod,
        folderId: saved.folderId,
        folderName: saved.folderName,
        folderLink: saved.folderLink,
        accountEmail: saved.accountEmail,
      },
    });
  } catch (error: any) {
    console.error("[Google Drive Config API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update Google Drive configuration." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    disconnectGoogleDrive();

    await logAuditEvent({
      entityType: "SystemSetting",
      entityId: "GOOGLE_DRIVE",
      fieldChanged: "storage_provider",
      action: "UPDATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: "Disconnected Google Drive storage. Switched to local CRM storage.",
    });

    return NextResponse.json({
      success: true,
      message: "Google Drive disconnected. Reverted to local storage fallback.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to disconnect Google Drive." },
      { status: 500 }
    );
  }
}
