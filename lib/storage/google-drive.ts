import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

// Supported scopes for Google Drive document storage
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
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

/**
 * Loads the active Google Drive configuration from file, env, or service account file
 */
export function getEffectiveDriveConfig(): GoogleDriveConfig {
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
  const folderId = fileConfig.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const serviceAccountEmail =
    fileConfig.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const serviceAccountPrivateKey =
    fileConfig.serviceAccountPrivateKey || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  const hasServiceAccount = Boolean(
    (serviceAccountEmail && serviceAccountPrivateKey) || (saKeyFile && fs.existsSync(saKeyFile))
  );
  const hasOAuth = Boolean(clientId && clientSecret && refreshToken);

  let authMethod: "SERVICE_ACCOUNT" | "OAUTH2" | "NONE" = "NONE";
  if (hasServiceAccount) authMethod = "SERVICE_ACCOUNT";
  else if (hasOAuth) authMethod = "OAUTH2";

  return {
    enabled: fileConfig.enabled !== false && authMethod !== "NONE",
    authMethod,
    folderId,
    folderName: fileConfig.folderName || "Sunlife Solar CRM Documents",
    folderLink: folderId ? `https://drive.google.com/drive/folders/${folderId}` : undefined,
    accountEmail: fileConfig.accountEmail || serviceAccountEmail,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    serviceAccountKeyFile: saKeyFile,
    clientId,
    clientSecret,
    refreshToken,
  };
}

/**
 * Initializes a Google Drive v3 client from explicit config or effective system config
 */
export function getDriveClient(customConfig?: Partial<GoogleDriveConfig>) {
  const config = customConfig ? { ...getEffectiveDriveConfig(), ...customConfig } : getEffectiveDriveConfig();

  // 1. Service Account via JSON file
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

  // 2. Service Account via Email and Private Key
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

  // 3. OAuth2 Client with Refresh Token
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

  return null;
}

export function isGoogleDriveEnabled(): boolean {
  const config = getEffectiveDriveConfig();
  return Boolean(config.enabled && getDriveClient());
}

/**
 * Returns diagnostic connection details for the Admin UI
 */
export function getGoogleDriveConfigStatus() {
  const config = getEffectiveDriveConfig();
  const drive = getDriveClient();

  return {
    connected: Boolean(config.enabled && drive),
    authMethod: config.authMethod,
    folderId: config.folderId || null,
    folderName: config.folderName || "Sunlife Solar CRM Documents",
    folderLink: config.folderId ? `https://drive.google.com/drive/folders/${config.folderId}` : null,
    accountEmail: config.accountEmail || config.serviceAccountEmail || null,
    hasServiceAccount: Boolean(config.serviceAccountEmail || config.serviceAccountKeyFile),
    hasOAuth: Boolean(config.refreshToken),
    clientIdConfigured: Boolean(config.clientId),
  };
}

/**
 * Saves Google Drive configuration to data/google-drive-config.json and updates .env
 */
export function saveGoogleDriveConfig(newConfig: Partial<GoogleDriveConfig>) {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const existing = getEffectiveDriveConfig();
  const merged: GoogleDriveConfig = {
    ...existing,
    ...newConfig,
    enabled: true,
  };

  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");

  // Also update .env file if available
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
      if (merged.serviceAccountEmail) updateOrAppend("GOOGLE_SERVICE_ACCOUNT_EMAIL", merged.serviceAccountEmail);
      if (merged.serviceAccountPrivateKey) updateOrAppend("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", merged.serviceAccountPrivateKey);
      if (merged.refreshToken) updateOrAppend("GOOGLE_DRIVE_REFRESH_TOKEN", merged.refreshToken);

      fs.writeFileSync(envPath, envContent, "utf-8");
    }
  } catch (envErr) {
    console.warn("[Google Drive] Could not update .env:", envErr);
  }

  return merged;
}

/**
 * Disables or removes Google Drive config
 */
export function disconnectGoogleDrive() {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      const current = JSON.parse(content);
      current.enabled = false;
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(current, null, 2), "utf-8");
    } catch {
      fs.unlinkSync(CONFIG_FILE_PATH);
    }
  }
}

/**
 * Tests live connection with Google Drive and creates root folder if missing
 */
export async function testGoogleDriveConnection(customConfig?: Partial<GoogleDriveConfig>) {
  const drive = getDriveClient(customConfig);
  if (!drive) {
    return {
      success: false,
      error: "No Google Drive credentials configured (Service Account or OAuth2 refresh token).",
    };
  }

  try {
    // 1. Test Drive API access via About / User Info
    let accountEmail: string | null = null;
    let storageQuota: any = null;

    try {
      const aboutRes = await drive.about.get({
        fields: "user(displayName, emailAddress), storageQuota",
      });
      accountEmail = aboutRes.data.user?.emailAddress || null;
      storageQuota = aboutRes.data.storageQuota || null;
    } catch (aboutErr) {
      // Service accounts sometimes have restricted about.get, fallback to files.list
      console.warn("[Google Drive Test] about.get restricted, falling back to files.list:", aboutErr);
    }

    // 2. Test root folder or find/create "Sunlife Solar CRM Documents"
    const effectiveFolderId = customConfig?.folderId || getEffectiveDriveConfig().folderId;
    let targetFolderId = effectiveFolderId;
    let folderName = "Sunlife Solar CRM Documents";

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
          error: `Folder ID (${targetFolderId}) could not be accessed. Make sure it is shared with ${accountEmail || "the Service Account"} as Editor. Details: ${folderCheckErr.message}`,
        };
      }
    } else {
      // Auto-find or create root folder
      try {
        const searchRes = await drive.files.list({
          q: "name = 'Sunlife Solar CRM Documents' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
          fields: "files(id, name, webViewLink)",
          spaces: "drive",
        });

        if (searchRes.data.files && searchRes.data.files.length > 0) {
          targetFolderId = searchRes.data.files[0].id || undefined;
          folderName = searchRes.data.files[0].name || folderName;
        } else {
          const createRes = await drive.files.create({
            requestBody: {
              name: "Sunlife Solar CRM Documents",
              mimeType: "application/vnd.google-apps.folder",
            },
            fields: "id, name, webViewLink",
          });
          targetFolderId = createRes.data.id || undefined;
          folderName = createRes.data.name || folderName;
        }
      } catch (createErr: any) {
        return {
          success: false,
          accountEmail,
          error: `Could not create root folder in Google Drive: ${createErr.message}`,
        };
      }
    }

    // 3. Save discovered folder ID if it was missing
    if (targetFolderId && !effectiveFolderId) {
      saveGoogleDriveConfig({
        folderId: targetFolderId,
        folderName,
        accountEmail: accountEmail || undefined,
      });
    }

    return {
      success: true,
      accountEmail: accountEmail || customConfig?.serviceAccountEmail || getEffectiveDriveConfig().serviceAccountEmail || "Authenticated",
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
export function getGoogleDriveAuthUrl(redirectOrigin: string): string {
  const config = getEffectiveDriveConfig();
  const clientId = config.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = config.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env");
  }

  const callbackUrl = `${redirectOrigin}/api/v1/admin/documents/drive-auth/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, callbackUrl);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    include_granted_scopes: true,
  });
}

/**
 * Handles Google OAuth callback code exchange
 */
export async function handleGoogleDriveOAuthCallback(code: string, redirectOrigin: string) {
  const config = getEffectiveDriveConfig();
  const clientId = config.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = config.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = `${redirectOrigin}/api/v1/admin/documents/drive-auth/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, callbackUrl);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.warn("[Google Drive OAuth] No refresh_token returned. User may have already granted access.");
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

  // Find or create "Sunlife Solar CRM Documents" root folder
  let folderId = config.folderId;
  if (!folderId) {
    const searchRes = await drive.files.list({
      q: "name = 'Sunlife Solar CRM Documents' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      folderId = searchRes.data.files[0].id!;
    } else {
      const createRes = await drive.files.create({
        requestBody: {
          name: "Sunlife Solar CRM Documents",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      folderId = createRes.data.id!;
    }
  }

  // Save config
  saveGoogleDriveConfig({
    authMethod: "OAUTH2",
    refreshToken: tokens.refresh_token || config.refreshToken,
    folderId,
    accountEmail,
  });

  return {
    success: true,
    folderId,
    accountEmail,
  };
}

/**
 * Ensures or creates a customer subfolder in Google Drive
 */
async function getOrCreateSubfolder(drive: any, parentFolderId: string, folderName: string): Promise<string> {
  try {
    const safeName = folderName.replace(/'/g, "\\'");
    const res = await drive.files.list({
      q: `'${parentFolderId}' in parents and name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
      spaces: "drive",
      supportsAllDrives: true,
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    const folderMeta = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    };

    const folder = await drive.files.create({
      requestBody: folderMeta,
      fields: "id",
      supportsAllDrives: true,
    });

    return folder.data.id;
  } catch (err) {
    console.error("[Google Drive Subfolder Error]:", err);
    return parentFolderId;
  }
}

/**
 * Uploads a file buffer directly to Google Drive.
 * If Google Drive is not configured or fails, saves safely to local storage fallback.
 */
export async function uploadDocumentToDrive(options: UploadOptions): Promise<UploadResult> {
  const { buffer, fileName, mimeType, customerName } = options;
  const drive = getDriveClient();

  // If Google Drive is configured, upload to Drive
  if (drive) {
    try {
      const config = getEffectiveDriveConfig();
      let targetFolderId = config.folderId;

      // If customerName provided and target folder set, organize in customer subfolder
      if (targetFolderId && customerName) {
        targetFolderId = await getOrCreateSubfolder(drive, targetFolderId, customerName);
      }

      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileMetadata: any = {
        name: fileName,
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

      // Make readable for anyone with the link (safe sharing for CRM/Customer access)
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
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteDocumentFromDrive(fileId: string): Promise<boolean> {
  const drive = getDriveClient();
  if (!drive) return false;

  try {
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return true;
  } catch (err) {
    console.error("[Google Drive Delete Error]:", err);
    return false;
  }
}
