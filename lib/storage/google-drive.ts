import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

// Supported scopes for Google Drive document storage
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "google-drive-config.json");

export interface GoogleDriveConfig {
  enabled?: boolean;
  authMethod?: "SERVICE_ACCOUNT" | "OAUTH2" | "NONE";
  folderId?: string;
  folderName?: string;
  folderLink?: string;
  accountEmail?: string;
  // Service Account fields
  serviceAccountEmail?: string;
  serviceAccountPrivateKey?: string;
  serviceAccountKeyFile?: string;
  // OAuth2 fields
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  redirectUri?: string;
}

export interface UploadOptions {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  customerName?: string;
  folderCategory?: string;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink?: string;
  fileSizeBytes: number;
  mimeType: string;
  storageProvider: "GOOGLE_DRIVE" | "LOCAL";
}

let cachedDriveConfig: GoogleDriveConfig | null = null;

/**
 * Loads the active Google Drive configuration from Neon PostgreSQL database.
 * Falls back to disk cache and environment variables.
 */
export async function getDriveConfigFromDb(): Promise<GoogleDriveConfig> {
  try {
    const dbRecord = await prisma.googleDriveConfigRecord.findUnique({
      where: { id: "active" },
    });

    if (dbRecord) {
      const folderId = dbRecord.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || "1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J";
      const config: GoogleDriveConfig = {
        enabled: dbRecord.enabled !== false,
        authMethod: (dbRecord.authMethod as any) || "OAUTH2",
        folderId,
        folderName: dbRecord.folderName || "sunlife solar",
        folderLink: dbRecord.folderLink || `https://drive.google.com/drive/folders/${folderId}`,
        accountEmail: dbRecord.accountEmail || "abhishekverma092k2@gmail.com",
        clientId: dbRecord.clientId || process.env.GOOGLE_CLIENT_ID || undefined,
        clientSecret: dbRecord.clientSecret || process.env.GOOGLE_CLIENT_SECRET || undefined,
        refreshToken: dbRecord.refreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN || undefined,
      };
      cachedDriveConfig = config;
      return config;
    }
  } catch (err) {
    console.warn("[Google Drive Config] Error fetching from DB:", err);
  }

  return getEffectiveDriveConfig();
}

/**
 * Synchronous accessor for in-memory or fallback drive configuration
 */
export function getEffectiveDriveConfig(): GoogleDriveConfig {
  if (cachedDriveConfig) {
    return cachedDriveConfig;
  }

  let fileConfig: Partial<GoogleDriveConfig> = {};

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const content = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      fileConfig = JSON.parse(content);
    }
  } catch (err) {
    console.warn("[Google Drive Config] Error reading config file:", err);
  }

  // Check for local service account JSON file in root or credentials dir
  let saKeyFile =
    fileConfig.serviceAccountKeyFile ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!saKeyFile) {
    const rootSa = path.join(process.cwd(), "service-account.json");
    const credsSa = path.join(process.cwd(), "credentials", "google-service-account.json");
    if (fs.existsSync(rootSa)) saKeyFile = rootSa;
    else if (fs.existsSync(credsSa)) saKeyFile = credsSa;
  }

  const clientId = fileConfig.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = fileConfig.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = fileConfig.refreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const folderId = fileConfig.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || "1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J";
  const serviceAccountEmail =
    fileConfig.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const serviceAccountPrivateKey =
    fileConfig.serviceAccountPrivateKey || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  const hasServiceAccount = Boolean(
    (serviceAccountEmail && serviceAccountPrivateKey) || (saKeyFile && fs.existsSync(saKeyFile))
  );
  const hasOAuth = Boolean(clientId && clientSecret && refreshToken);

  let authMethod: "SERVICE_ACCOUNT" | "OAUTH2" | "NONE" = "NONE";
  if (fileConfig.authMethod === "OAUTH2" && hasOAuth) {
    authMethod = "OAUTH2";
  } else if (hasOAuth) {
    authMethod = "OAUTH2";
  } else if (hasServiceAccount) {
    authMethod = "SERVICE_ACCOUNT";
  }

  const config: GoogleDriveConfig = {
    enabled: fileConfig.enabled !== false && authMethod !== "NONE",
    authMethod,
    folderId,
    folderName: fileConfig.folderName || "sunlife solar",
    folderLink: folderId ? `https://drive.google.com/drive/folders/${folderId}` : undefined,
    accountEmail: fileConfig.accountEmail || serviceAccountEmail,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    serviceAccountKeyFile: saKeyFile,
    clientId,
    clientSecret,
    refreshToken,
  };

  return config;
}

/**
 * Initializes a Google Drive v3 client from explicit config or effective system config
 */
export async function getDriveClient(customConfig?: Partial<GoogleDriveConfig>) {
  let baseConfig = cachedDriveConfig;
  if (!baseConfig && !customConfig) {
    baseConfig = await getDriveConfigFromDb();
  } else if (!baseConfig) {
    baseConfig = getEffectiveDriveConfig();
  }

  const config = customConfig ? { ...baseConfig, ...customConfig } : baseConfig;

  // 1. OAuth2 Client with Refresh Token (Prioritized for personal Drive storage quota)
  if (config.authMethod === "OAUTH2" || (config.clientId && config.clientSecret && config.refreshToken)) {
    if (config.clientId && config.clientSecret && config.refreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          config.clientId,
          config.clientSecret,
          config.redirectUri || "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: config.refreshToken });
        return google.drive({ version: "v3", auth: oauth2Client });
      } catch (e) {
        console.error("[Google Drive] Failed to create client with OAuth2:", e);
      }
    }
  }

  // 2. Service Account via JSON file
  if (config.serviceAccountKeyFile && fs.existsSync(config.serviceAccountKeyFile)) {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: config.serviceAccountKeyFile,
        scopes: SCOPES,
      });
      return google.drive({ version: "v3", auth });
    } catch (e) {
      console.error("[Google Drive] Failed to create client with keyFile:", e);
    }
  }

  // 3. Service Account via Email and Private Key
  if (config.serviceAccountEmail && config.serviceAccountPrivateKey) {
    try {
      const privateKey = config.serviceAccountPrivateKey.replace(/\\n/g, "\n");
      const auth = new google.auth.JWT({
        email: config.serviceAccountEmail,
        key: privateKey,
        scopes: SCOPES,
      });
      return google.drive({ version: "v3", auth });
    } catch (e) {
      console.error("[Google Drive] Failed to create client with JWT:", e);
    }
  }

  return null;
}

export function isGoogleDriveEnabled(): boolean {
  const config = getEffectiveDriveConfig();
  return Boolean(config.enabled && config.refreshToken);
}

let tokenValidationCache: { valid: boolean; checkedAt: number } = { valid: false, checkedAt: 0 };

export async function isRefreshTokenValid(refreshToken: string, clientId: string, clientSecret: string): Promise<boolean> {
  const now = Date.now();
  if (now - tokenValidationCache.checkedAt < 45000) {
    return tokenValidationCache.valid;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await oauth2Client.getAccessToken();
    const isValid = Boolean(token);
    tokenValidationCache = { valid: isValid, checkedAt: now };
    return isValid;
  } catch (err: any) {
    console.warn("[Google Drive Token Check]: Refresh token invalid or revoked:", err.message);
    tokenValidationCache = { valid: false, checkedAt: now };
    return false;
  }
}

/**
 * Returns diagnostic connection details for the Admin UI with live token verification
 */
export async function getGoogleDriveConfigStatus() {
  const config = await getDriveConfigFromDb();

  let isConnected = false;
  if (config.enabled && config.authMethod === "OAUTH2" && config.refreshToken && config.clientId && config.clientSecret) {
    isConnected = await isRefreshTokenValid(config.refreshToken, config.clientId, config.clientSecret);
  } else if (config.enabled && config.authMethod === "SERVICE_ACCOUNT") {
    isConnected = Boolean(config.serviceAccountEmail && config.serviceAccountPrivateKey);
  }

  return {
    connected: isConnected,
    authMethod: config.authMethod,
    folderId: config.folderId || null,
    folderName: config.folderName || "sunlife solar",
    folderLink: config.folderId ? `https://drive.google.com/drive/folders/${config.folderId}` : null,
    accountEmail: config.accountEmail || config.serviceAccountEmail || null,
    hasServiceAccount: Boolean(config.serviceAccountEmail || config.serviceAccountKeyFile),
    hasOAuth: Boolean(config.refreshToken),
    clientIdConfigured: Boolean(config.clientId),
  };
}

/**
 * Saves Google Drive configuration to database, disk cache, and local .env
 */
export async function saveGoogleDriveConfig(newConfig: Partial<GoogleDriveConfig>) {
  tokenValidationCache = { valid: true, checkedAt: Date.now() };
  const existing = cachedDriveConfig || (await getDriveConfigFromDb());
  const merged: GoogleDriveConfig = {
    ...existing,
    ...newConfig,
    enabled: newConfig.enabled !== false,
  };

  cachedDriveConfig = merged;

  // 1. Neon PostgreSQL Database Persistence (persists across serverless cold starts)
  try {
    await prisma.googleDriveConfigRecord.upsert({
      where: { id: "active" },
      create: {
        id: "active",
        enabled: merged.enabled !== false,
        authMethod: merged.authMethod || "OAUTH2",
        folderId: merged.folderId || "1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J",
        folderName: merged.folderName || "sunlife solar",
        folderLink: merged.folderLink || (merged.folderId ? `https://drive.google.com/drive/folders/${merged.folderId}` : null),
        accountEmail: merged.accountEmail || "abhishekverma092k2@gmail.com",
        clientId: merged.clientId || process.env.GOOGLE_CLIENT_ID || null,
        clientSecret: merged.clientSecret || process.env.GOOGLE_CLIENT_SECRET || null,
        refreshToken: merged.refreshToken || null,
      },
      update: {
        enabled: merged.enabled !== false,
        ...(merged.authMethod ? { authMethod: merged.authMethod } : {}),
        ...(merged.folderId !== undefined ? { folderId: merged.folderId } : {}),
        ...(merged.folderName !== undefined ? { folderName: merged.folderName } : {}),
        ...(merged.folderId !== undefined ? { folderLink: merged.folderId ? `https://drive.google.com/drive/folders/${merged.folderId}` : null } : {}),
        ...(merged.accountEmail !== undefined ? { accountEmail: merged.accountEmail } : {}),
        ...(merged.clientId !== undefined ? { clientId: merged.clientId } : {}),
        ...(merged.clientSecret !== undefined ? { clientSecret: merged.clientSecret } : {}),
        ...(merged.refreshToken !== undefined ? { refreshToken: merged.refreshToken } : {}),
        updatedAt: new Date(),
      },
    });
  } catch (dbErr) {
    console.error("[Google Drive] Failed to persist config to DB:", dbErr);
  }

  // 2. Disk cache (safe if filesystem is writable)
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");
  } catch (fsErr) {
    // Non-fatal on read-only serverless
  }

  // 3. Dev .env update
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      const updateOrAppend = (key: string, val: string | undefined) => {
        if (!val) return;
        const regex = new RegExp(`^${key}=.*$`, "m");
        const entry = `${key}="${val.replace(/"/g, '\\"')}"`;
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, entry);
        } else {
          envContent += `\n${entry}`;
        }
      };

      if (merged.folderId) updateOrAppend("GOOGLE_DRIVE_FOLDER_ID", merged.folderId);
      if (merged.refreshToken) updateOrAppend("GOOGLE_DRIVE_REFRESH_TOKEN", merged.refreshToken);

      fs.writeFileSync(envPath, envContent, "utf-8");
    }
  } catch (envErr) {
    // Non-fatal
  }

  return merged;
}

/**
 * Disables Google Drive integration
 */
export async function disconnectGoogleDrive() {
  if (cachedDriveConfig) {
    cachedDriveConfig.enabled = false;
  }
  try {
    await prisma.googleDriveConfigRecord.update({
      where: { id: "active" },
      data: { enabled: false },
    });
  } catch (err) {
    console.warn("[Google Drive] DB disconnect warning:", err);
  }
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      fs.unlinkSync(CONFIG_FILE_PATH);
    }
  } catch {
    // Non-fatal
  }
}

/**
 * Tests live connection with Google Drive
 */
export async function testGoogleDriveConnection(customConfig?: Partial<GoogleDriveConfig>) {
  const drive = await getDriveClient(customConfig);
  if (!drive) {
    return {
      success: false,
      error: "No Google Drive credentials configured (OAuth2 refresh token or Service Account).",
    };
  }

  try {
    // 1. Test Drive API access
    let accountEmail: string | null = null;
    let storageQuota: any = null;

    try {
      const aboutRes = await drive.about.get({
        fields: "user(displayName, emailAddress), storageQuota",
      });
      accountEmail = aboutRes.data.user?.emailAddress || null;
      storageQuota = aboutRes.data.storageQuota || null;
    } catch (aboutErr) {
      console.warn("[Google Drive Test] about.get restricted, continuing:", aboutErr);
    }

    // 2. Test root folder
    const baseConfig = customConfig ? { ...getEffectiveDriveConfig(), ...customConfig } : await getDriveConfigFromDb();
    const effectiveFolderId = customConfig?.folderId || baseConfig.folderId || "1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J";
    let targetFolderId = effectiveFolderId;
    let folderName = baseConfig.folderName || "sunlife solar";

    if (targetFolderId) {
      try {
        const folderRes = await drive.files.get({
          fileId: targetFolderId,
          fields: "id, name, mimeType, trashed, webViewLink",
          supportsAllDrives: true,
        });

        if (folderRes.data.trashed) {
          throw new Error("Target folder is in Trash.");
        }
        folderName = folderRes.data.name || folderName;
      } catch (folderCheckErr: any) {
        return {
          success: false,
          accountEmail,
          error: `Folder ID (${targetFolderId}) could not be accessed. Details: ${folderCheckErr.message}`,
        };
      }
    }

    // Save discovered details if needed
    if (targetFolderId) {
      await saveGoogleDriveConfig({
        folderId: targetFolderId,
        folderName,
        accountEmail: accountEmail || baseConfig.accountEmail || undefined,
      });
    }

    return {
      success: true,
      accountEmail: accountEmail || baseConfig.accountEmail || "Authenticated Account",
      folderId: targetFolderId,
      folderName,
      folderLink: targetFolderId ? `https://drive.google.com/drive/folders/${targetFolderId}` : null,
      storageQuota,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to communicate with Google Drive API.",
    };
  }
}

/**
 * Builds Google OAuth authorization URL for 1-click admin connect
 */
export function getGoogleDriveAuthUrl(redirectOrigin: string, customPath?: string): string {
  const config = getEffectiveDriveConfig();
  const clientId = config.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = config.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env");
  }

  const path = customPath || (
    redirectOrigin.includes("sunlifesolar.in")
      ? "/api/auth/callback/google"
      : "/api/v1/admin/documents/drive-auth/callback"
  );
  const callbackUrl = `${redirectOrigin}${path}`;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, callbackUrl);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    include_granted_scopes: true,
  });
}

/**
 * Handles Google OAuth callback code exchange
 */
export async function handleGoogleDriveOAuthCallback(code: string, redirectOrigin: string, customPath?: string) {
  const config = await getDriveConfigFromDb();
  const clientId = config.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = config.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const path = customPath || (
    redirectOrigin.includes("sunlifesolar.in")
      ? "/api/auth/callback/google"
      : "/api/v1/admin/documents/drive-auth/callback"
  );
  const callbackUrl = `${redirectOrigin}${path}`;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, callbackUrl);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.warn("[Google Drive OAuth] No refresh_token returned.");
  }

  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Get user profile email
  let accountEmail: string | undefined;
  try {
    const about = await drive.about.get({ fields: "user(emailAddress)" });
    accountEmail = about.data.user?.emailAddress || undefined;
  } catch (e) {
    console.warn("Could not get user email:", e);
  }

  // Default to folder 1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J ("sunlife solar")
  let folderId = config.folderId || "1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J";
  let folderName = config.folderName || "sunlife solar";

  try {
    const fRes = await drive.files.get({
      fileId: folderId,
      fields: "id, name, trashed",
      supportsAllDrives: true,
    });
    if (fRes.data.trashed) {
      folderId = undefined as any;
    } else {
      folderName = fRes.data.name || folderName;
    }
  } catch (fErr) {
    console.warn("Target folder not found by ID, checking by name:", fErr);
    try {
      const searchRes = await drive.files.list({
        q: "name = 'sunlife solar' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: "files(id, name)",
        spaces: "drive",
      });
      if (searchRes.data.files && searchRes.data.files.length > 0) {
        folderId = searchRes.data.files[0].id!;
        folderName = searchRes.data.files[0].name || "sunlife solar";
      } else {
        const createRes = await drive.files.create({
          requestBody: {
            name: "sunlife solar",
            mimeType: "application/vnd.google-apps.folder",
          },
          fields: "id, name",
        });
        folderId = createRes.data.id!;
        folderName = createRes.data.name || "sunlife solar";
      }
    } catch (cErr) {
      console.error("Could not find or create folder:", cErr);
    }
  }

  // Save config into Neon PostgreSQL
  await saveGoogleDriveConfig({
    enabled: true,
    authMethod: "OAUTH2",
    refreshToken: tokens.refresh_token || config.refreshToken,
    folderId,
    folderName,
    folderLink: folderId ? `https://drive.google.com/drive/folders/${folderId}` : undefined,
    accountEmail: accountEmail || config.accountEmail || "abhishekverma092k2@gmail.com",
  });

  return {
    success: true,
    folderId,
    accountEmail: accountEmail || config.accountEmail,
  };
}

/**
 * Uploads a file buffer directly to Google Drive.
 * If Google Drive is not configured or fails, saves safely to local storage fallback.
 */
export async function uploadDocumentToDrive(options: UploadOptions): Promise<UploadResult> {
  const { buffer, fileName, mimeType, customerName } = options;
  const drive = await getDriveClient();

  // If Google Drive is configured, upload to Drive
  if (drive) {
    try {
      const config = await getDriveConfigFromDb();
      let targetFolderId = config.folderId || "1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J";

      const cleanFileName = customerName && !fileName.includes(customerName)
        ? `${customerName} - ${fileName}`
        : fileName;

      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileMetadata: any = {
        name: cleanFileName,
        parents: targetFolderId ? [targetFolderId] : undefined,
      };

      const media = {
        mimeType: mimeType || "application/octet-stream",
        body: stream,
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id, name, webViewLink, webContentLink, size, mimeType",
        supportsAllDrives: true,
      });

      const fileId = response.data.id!;
      const webViewLink =
        response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

      // Make readable for anyone with the link
      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
          supportsAllDrives: true,
        });
      } catch (permError) {
        console.warn("[Google Drive Permission Warning]:", permError);
      }

      return {
        fileId,
        fileName: response.data.name || fileName,
        webViewLink,
        webContentLink: response.data.webContentLink || undefined,
        fileSizeBytes: response.data.size ? parseInt(response.data.size, 10) : buffer.length,
        mimeType: response.data.mimeType || mimeType,
        storageProvider: "GOOGLE_DRIVE",
      };
    } catch (error: any) {
      console.error("[Google Drive Upload Error, falling back to local storage]:", error);
    }
  }

  // Local storage fallback
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "docs");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);

    return {
      fileId: safeName,
      fileName,
      webViewLink: `/uploads/docs/${safeName}`,
      webContentLink: `/uploads/docs/${safeName}`,
      fileSizeBytes: buffer.length,
      mimeType,
      storageProvider: "LOCAL",
    };
  } catch (fsErr) {
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType || "application/octet-stream"};base64,${base64}`;
    return {
      fileId: `mem_${Date.now()}`,
      fileName,
      webViewLink: dataUri,
      fileSizeBytes: buffer.length,
      mimeType,
      storageProvider: "LOCAL",
    };
  }
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteDocumentFromDrive(fileId: string): Promise<boolean> {
  const drive = await getDriveClient();
  if (!drive) return false;

  try {
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return true;
  } catch (err) {
    console.error("[Google Drive Delete Error]:", err);
    return false;
  }
}
