require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const pino = require("pino");
const QRCode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const NodeCache = require("node-cache");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const API_KEY = process.env.WHATSAPP_API_KEY || "sunlife_whatsapp_secret_key_2026";

// Determine CRM URLs with cloud fallback
let CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || "https://sunlifesolar.in/api/v1/whatsapp/webhook";
if (
  CRM_WEBHOOK_URL.includes("localhost") &&
  (process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL)
) {
  CRM_WEBHOOK_URL = "https://sunlifesolar.in/api/v1/whatsapp/webhook";
}

const CRM_DISPATCH_URL =
  process.env.CRM_DISPATCH_URL ||
  (CRM_WEBHOOK_URL ? CRM_WEBHOOK_URL.replace(/\/webhook\/?$/, "/dispatch") : "https://sunlifesolar.in/api/v1/whatsapp/dispatch");
const CRM_WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET || "sunlife_webhook_secret_key_2026";
const CRM_BASE_URL = CRM_WEBHOOK_URL.replace(/\/webhook\/?$/, "");
const CRM_SESSION_SYNC_URL = process.env.CRM_SESSION_SYNC_URL || `${CRM_BASE_URL}/session-sync`;
const CRM_GET_MESSAGE_URL = process.env.CRM_GET_MESSAGE_URL || `${CRM_BASE_URL}/get-message`;

const SESSIONS_DIR = process.env.SESSIONS_DIR || path.join(__dirname, "..", "sessions");
const MESSAGE_STORE_FILE = path.join(SESSIONS_DIR, "message_store.json");

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// State
let sock = null;
let connectionStatus = "DISCONNECTED"; // DISCONNECTED | CONNECTING | QR_READY | CONNECTED | AUTHENTICATION_REQUIRED
let currentQrCodeDataUrl = null;
let currentQrRaw = null;
let connectedUser = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let isConnecting = false;
let isIntentionalDisconnect = false;
let activeServer = null;
let dispatchInterval = null;
let isPollingDispatch = false;

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// Message & Retry Caches (Crucial for solving "Waiting for this message" & encryption ratchets)
const msgRetryCounterCache = new NodeCache({ stdTTL: 7200, checkperiod: 300 });
const userDevicesCache = new NodeCache({ stdTTL: 7200, checkperiod: 300 });
const placeholderResendCache = new NodeCache({ stdTTL: 7200, checkperiod: 300 });
const messageStore = new Map();

// Helper: Load persisted messages on startup to service E2EE retry requests after restarts
function loadPersistedMessages() {
  try {
    if (fs.existsSync(MESSAGE_STORE_FILE)) {
      const raw = fs.readFileSync(MESSAGE_STORE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const [k, v] of parsed) {
          messageStore.set(k, v);
        }
        logger.info(`Loaded ${messageStore.size} cached messages from disk store.`);
      }
    }
  } catch (err) {
    logger.warn(`Could not load message store from disk: ${err.message}`);
  }
}

let persistMessageTimer = null;
function persistMessageStore() {
  if (persistMessageTimer) return;
  persistMessageTimer = setTimeout(() => {
    persistMessageTimer = null;
    try {
      if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
      const entries = Array.from(messageStore.entries()).slice(-2000);
      fs.writeFileSync(MESSAGE_STORE_FILE, JSON.stringify(entries), "utf8");
    } catch (err) {
      // non-fatal
    }
  }, 2000);
}

// ─────────────────────────────────────────────────────────────
// Cloud Session Persistence (PostgreSQL DB Backup & Restore)
// Ensures WhatsApp NEVER loses login credentials on Railway restarts!
// ─────────────────────────────────────────────────────────────
async function restoreSessionFromCloud() {
  const credsFile = path.join(SESSIONS_DIR, "creds.json");
  if (fs.existsSync(credsFile)) {
    try {
      const stat = fs.statSync(credsFile);
      if (stat.size > 50) {
        logger.info("Valid local session credentials found on disk.");
        return true;
      }
    } catch (e) {}
  }

  logger.info(`Attempting to restore session from Cloud DB: ${CRM_SESSION_SYNC_URL}`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(CRM_SESSION_SYNC_URL, {
      method: "GET",
      headers: { "x-webhook-secret": CRM_WEBHOOK_SECRET },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      logger.warn(`Session sync GET returned HTTP ${res.status}`);
      return false;
    }

    const data = await res.json();
    if (data.success && data.hasCreds && data.files) {
      for (const [filename, content] of Object.entries(data.files)) {
        const safeName = path.basename(filename);
        fs.writeFileSync(path.join(SESSIONS_DIR, safeName), content, "utf8");
      }
      logger.info(`Successfully restored ${Object.keys(data.files).length} session auth files from PostgreSQL!`);
      return true;
    } else {
      logger.info("No existing session credentials found in Cloud DB.");
    }
  } catch (err) {
    logger.warn(`Session cloud restore skipped/failed: ${err.message}`);
  }
  return false;
}

let sessionSyncTimer = null;
function triggerDebouncedSessionSync() {
  if (sessionSyncTimer) clearTimeout(sessionSyncTimer);
  sessionSyncTimer = setTimeout(async () => {
    sessionSyncTimer = null;
    try {
      if (!fs.existsSync(SESSIONS_DIR)) return;
      const files = {};
      const list = fs.readdirSync(SESSIONS_DIR);
      for (const file of list) {
        if (
          file.endsWith(".json") ||
          file.startsWith("app-state") ||
          file.startsWith("pre-key") ||
          file.startsWith("session-") ||
          file.startsWith("sender-key")
        ) {
          const fullPath = path.join(SESSIONS_DIR, file);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isFile() && stat.size < 2 * 1024 * 1024) {
              files[file] = fs.readFileSync(fullPath, "utf8");
            }
          } catch (e) {}
        }
      }

      if (Object.keys(files).length > 0 && files["creds.json"]) {
        const res = await fetch(CRM_SESSION_SYNC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": CRM_WEBHOOK_SECRET,
          },
          body: JSON.stringify({ files }),
        });
        if (res.ok) {
          logger.info(`Synced ${Object.keys(files).length} session files to Cloud PostgreSQL DB.`);
        }
      }
    } catch (err) {
      logger.warn(`Session cloud sync error: ${err.message}`);
    }
  }, 2500);
}

async function clearSessionDatabase() {
  try {
    await fetch(`${CRM_SESSION_SYNC_URL}?all=true`, {
      method: "DELETE",
      headers: { "x-webhook-secret": CRM_WEBHOOK_SECRET },
    });
    logger.info("Cleared session files from Cloud PostgreSQL DB.");
  } catch (err) {
    logger.warn(`Failed to clear session from Cloud DB: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Queue Dispatcher (Non-Blocking Railway Outbound Worker)
// ─────────────────────────────────────────────────────────────
function startQueueDispatcher() {
  if (dispatchInterval) return;
  if (!CRM_DISPATCH_URL) {
    logger.warn("No CRM_DISPATCH_URL configured; persistent queue poll is disabled.");
    return;
  }
  logger.info(`Starting persistent Railway outbound queue worker: polling ${CRM_DISPATCH_URL} every 5s`);
  dispatchInterval = setInterval(async () => {
    if (connectionStatus !== "CONNECTED" || !sock) return;
    if (isPollingDispatch) return;
    isPollingDispatch = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      await fetch(CRM_DISPATCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": CRM_WEBHOOK_SECRET,
        },
        body: JSON.stringify({ limit: 10 }),
        signal: controller.signal,
      });
    } catch (err) {
      // transient network poll failure
    } finally {
      clearTimeout(timeoutId);
      isPollingDispatch = false;
    }
  }, 5000);
}

function stopQueueDispatcher() {
  if (dispatchInterval) {
    clearInterval(dispatchInterval);
    dispatchInterval = null;
    isPollingDispatch = false;
    logger.info("Persistent Railway queue worker stopped.");
  }
}

// Helper: Timing-safe string comparison
function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Helper: Calculate bounded exponential backoff with jitter
function calculateBackoffMs(attempt) {
  const base = Math.min(1500 * Math.pow(1.4, Math.min(attempt, 6)), 25000);
  const jitter = Math.floor(Math.random() * 1500);
  return Math.floor(base + jitter);
}

// Helper: Cleanly destroy existing socket and event listeners
async function destroySocket() {
  stopQueueDispatcher();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  isConnecting = false;
  if (sock) {
    try {
      if (sock.ev && typeof sock.ev.removeAllListeners === "function") {
        sock.ev.removeAllListeners();
      }
      if (sock.ws && typeof sock.ws.terminate === "function") {
        sock.ws.terminate();
      } else if (sock.ws && typeof sock.ws.close === "function") {
        sock.ws.close();
      }
      if (typeof sock.end === "function") {
        sock.end(undefined);
      }
    } catch (err) {
      logger.warn(`Error during socket teardown: ${err.message}`);
    } finally {
      sock = null;
    }
  }
}

// Helper: Schedule reconnection safely
function scheduleReconnect(overrideDelayMs) {
  if (isIntentionalDisconnect) {
    logger.info("Gateway intentionally disconnected. Reconnect suppressed.");
    return;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts++;
  const delay = overrideDelayMs !== undefined ? overrideDelayMs : calculateBackoffMs(reconnectAttempts);
  logger.info(`Scheduling reconnect in ${Math.round(delay / 1000)}s (Attempt #${reconnectAttempts})...`);
  reconnectTimer = setTimeout(() => {
    connectToWhatsApp().catch((err) => logger.error("Scheduled reconnect error:", err));
  }, delay);
}

// ─────────────────────────────────────────────────────────────
// Initialize WhatsApp Socket
// ─────────────────────────────────────────────────────────────
async function connectToWhatsApp() {
  if (isIntentionalDisconnect) {
    logger.info("connectToWhatsApp skipped: gateway intentionally disconnected.");
    return;
  }
  if (isConnecting) {
    logger.warn("connectToWhatsApp skipped: connection handshake already in progress.");
    return;
  }

  isConnecting = true;
  try {
    await destroySocket();
    connectionStatus = "CONNECTING";

    // 1. Restore credentials from Cloud DB if local sessions folder is empty
    await restoreSessionFromCloud();
    loadPersistedMessages();

    // 2. Load auth state from MultiFile
    const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    logger.info(`Starting Baileys v${version.join(".")} (isLatest: ${isLatest}) with Ubuntu/Chrome fingerprint`);

    // 3. Construct WASocket with robust retry, device caches, and standard browser
    sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      // Official standard browser description prevents WhatsApp anti-bot heuristic drops
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: true,
      keepAliveIntervalMs: 30000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      msgRetryCounterCache,
      userDevicesCache,
      placeholderResendCache,
      // Critical: Clean message resolution for E2EE retry requests to eliminate "Waiting for this message..."
      getMessage: async (key) => {
        if (!key || !key.id) return undefined;
        const id = key.id;
        const compositeKey = key.remoteJid ? `${key.remoteJid}:${id}` : null;

        // A. Check memory cache
        if (messageStore.has(id)) {
          return messageStore.get(id);
        }
        if (compositeKey && messageStore.has(compositeKey)) {
          return messageStore.get(compositeKey);
        }

        // B. Query CRM DB for message content
        if (CRM_GET_MESSAGE_URL) {
          try {
            const resp = await fetch(`${CRM_GET_MESSAGE_URL}?id=${encodeURIComponent(id)}`, {
              headers: { "x-webhook-secret": CRM_WEBHOOK_SECRET },
              signal: AbortSignal.timeout(4000),
            });
            const data = await resp.json();
            if (data.found && data.message) {
              messageStore.set(id, data.message);
              return data.message;
            }
          } catch (err) {
            // CRM fallback unavailable
          }
        }

        // Return undefined if truly missing — NEVER return an arbitrary text string,
        // as a mismatch breaks Signal cryptographic verification!
        return undefined;
      },
    });

    isConnecting = false;

    // Handle credentials updates and trigger background cloud backup
    sock.ev.on("creds.update", async () => {
      await saveCreds();
      triggerDebouncedSessionSync();
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQrRaw = qr;
        connectionStatus = "QR_READY";
        try {
          currentQrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
        } catch (err) {
          logger.error("Error generating QR DataURL:", err);
        }
        logger.info("New QR Code generated. Scan with WhatsApp on your phone.");
        qrcodeTerminal.generate(qr, { small: true });
      }

      if (connection === "close") {
        stopQueueDispatcher();
        isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        logger.warn(`WhatsApp connection closed. StatusCode: ${statusCode}. LoggedOut: ${isLoggedOut}`);

        if (isLoggedOut) {
          connectionStatus = "AUTHENTICATION_REQUIRED";
          currentQrCodeDataUrl = null;
          currentQrRaw = null;
          connectedUser = null;
          await clearSessionDatabase();
          try {
            const files = fs.readdirSync(SESSIONS_DIR);
            for (const f of files) {
              fs.unlinkSync(path.join(SESSIONS_DIR, f));
            }
          } catch (e) {}
          logger.error("WhatsApp session logged out. Session files cleared. Prompting for new QR scan.");
          scheduleReconnect(1000);
        } else if (statusCode === DisconnectReason.restartRequired) {
          // Code 515: Baileys requires IMMEDIATE reconnect without exponential backoff
          logger.info("Restart required (515). Reconnecting immediately in 250ms...");
          setTimeout(() => {
            connectToWhatsApp().catch((err) => logger.error("Scheduled restart error:", err));
          }, 250);
        } else if (statusCode === DisconnectReason.connectionClosed) {
          // Code 428: Transient network socket closure. Quick reconnect.
          logger.info("Connection closed (428). Quick reconnect in 1.5s...");
          scheduleReconnect(1500);
        } else if (!isIntentionalDisconnect) {
          connectionStatus = "DISCONNECTED";
          scheduleReconnect();
        }
      } else if (connection === "open") {
        isConnecting = false;
        isIntentionalDisconnect = false;
        connectionStatus = "CONNECTED";
        currentQrCodeDataUrl = null;
        currentQrRaw = null;
        reconnectAttempts = 0;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        connectedUser = sock.user;
        logger.info(`WhatsApp connected successfully! Phone: ${sock.user?.id?.split(":")[0] || "Unknown"}`);
        startQueueDispatcher();
        // Backup session to cloud DB upon successful authentication
        triggerDebouncedSessionSync();
      }
    });

    // 1. Inbound & Phone-Originated Companion Message Listener
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify" && type !== "append") return;

      for (const msg of messages) {
        // Cache every incoming or companion message payload for E2EE retry resolution
        if (msg.key?.id && msg.message) {
          messageStore.set(msg.key.id, msg.message);
          if (msg.key.remoteJid) {
            messageStore.set(`${msg.key.remoteJid}:${msg.key.id}`, msg.message);
          }
          persistMessageStore();
        }

        // Skip broadcast / status messages
        if (msg.key.remoteJid === "status@broadcast" || msg.key.remoteJid?.endsWith("@broadcast")) continue;
        // Skip group messages
        if (msg.key.remoteJid?.endsWith("@g.us")) continue;
        // Skip newsletters / channels
        if (msg.key.remoteJid?.endsWith("@newsletter")) continue;

        const senderJid = msg.key.remoteJid;
        const cleanPhone = senderJid?.replace(/@s\.whatsapp\.net|@c\.us/g, "");
        const pushName = msg.pushName || "Customer";

        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.documentMessage?.caption ||
          "";

        const messageType = msg.message?.imageMessage
          ? "IMAGE"
          : msg.message?.documentMessage
          ? "DOCUMENT"
          : msg.message?.audioMessage
          ? "AUDIO"
          : "TEXT";

        // Companion Linked-Device Message (fromMe = true)
        if (msg.key.fromMe) {
          logger.info(`[Companion Sync Outbound] To: ${cleanPhone} [Id: ${msg.key.id}]: "${text}"`);

          const stored = messageStore.get(msg.key.id);
          const crmMessageId = stored?.crmMessageId || null;

          if (CRM_WEBHOOK_URL) {
            try {
              const payload = {
                event: "SYNC_OUTBOUND_MESSAGE",
                gatewayMessageId: msg.key.id,
                crmMessageId,
                phone: cleanPhone,
                direction: "OUTBOUND",
                messageType,
                content: text,
                timestamp: new Date(Number(msg.messageTimestamp) * 1000).toISOString(),
              };

              await fetch(CRM_WEBHOOK_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-webhook-secret": CRM_WEBHOOK_SECRET,
                },
                body: JSON.stringify(payload),
              });
            } catch (webhookErr) {
              logger.error("Failed to forward companion outbound message to CRM Webhook:", webhookErr.message);
            }
          }
          continue;
        }

        // Customer sent message to Sunlife Solar (Inbound)
        logger.info(`[Inbound WhatsApp] From: ${cleanPhone} (${pushName}): "${text}" [Type: ${messageType}]`);

        if (CRM_WEBHOOK_URL) {
          try {
            const payload = {
              event: "INBOUND_MESSAGE",
              gatewayMessageId: msg.key.id,
              phone: cleanPhone,
              senderName: pushName,
              direction: "INBOUND",
              messageType,
              content: text,
              timestamp: new Date(Number(msg.messageTimestamp) * 1000).toISOString(),
            };

            const response = await fetch(CRM_WEBHOOK_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-webhook-secret": CRM_WEBHOOK_SECRET,
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              logger.warn(`CRM Webhook responded with status ${response.status}`);
            }
          } catch (webhookErr) {
            logger.error("Failed to forward message to CRM Webhook:", webhookErr.message);
          }
        }
      }
    });

    // 2. Delivery & Read Receipts Listener
    sock.ev.on("messages.update", async (updates) => {
      for (const update of updates) {
        const { key, update: statusUpdate } = update;
        if (!key?.id) continue;

        let statusStr = null;
        if (statusUpdate?.status === 3) statusStr = "DELIVERED";
        else if (statusUpdate?.status === 4 || statusUpdate?.status === 5) statusStr = "READ";

        if (statusStr && CRM_WEBHOOK_URL) {
          try {
            await fetch(CRM_WEBHOOK_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-webhook-secret": CRM_WEBHOOK_SECRET,
              },
              body: JSON.stringify({
                event: "MESSAGE_STATUS_UPDATE",
                gatewayMessageId: key.id,
                status: statusStr,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (err) {
            logger.warn(`Failed to forward status update to CRM Webhook: ${err.message}`);
          }
        }
      }
    });
  } catch (error) {
    isConnecting = false;
    logger.error("Error initializing WhatsApp connection:", error);
    connectionStatus = "DISCONNECTED";
    scheduleReconnect();
  }
}

// Format Phone to WhatsApp JID
function formatJid(phone) {
  let clean = String(phone).replace(/\D/g, "");
  if (clean.length === 10) clean = "91" + clean;
  return `${clean}@s.whatsapp.net`;
}

// Authentication Middleware with Timing-Safe Protection
function authMiddleware(req, res, next) {
  const headerKey = req.headers["x-api-key"];
  const queryKey = req.query.apiKey;

  const supplied = headerKey || queryKey;
  if (!supplied || !API_KEY || !safeCompare(String(supplied), String(API_KEY))) {
    return res.status(401).json({ error: "Unauthorized. Invalid API Key." });
  }
  next();
}

// ─────────────────────────────────────────────────────────────
// REST API ENDPOINTS
// ─────────────────────────────────────────────────────────────

// 1. Healthcheck
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 2. Gateway Status (Protected)
app.get("/status", authMiddleware, (req, res) => {
  const isConnected = connectionStatus === "CONNECTED";
  const hasQr = Boolean(currentQrCodeDataUrl);
  res.json({
    status: connectionStatus,
    state: connectionStatus,
    isConnected,
    connected: isConnected,
    phone: connectedUser?.id ? connectedUser.id.split(":")[0] : null,
    name: connectedUser?.name || null,
    hasQr,
    qrAvailable: hasQr,
  });
});

// 3. QR Code endpoint (Protected)
app.get("/qr", authMiddleware, (req, res) => {
  if (connectionStatus === "CONNECTED") {
    return res.json({
      success: false,
      status: "CONNECTED",
      message: "WhatsApp is already connected.",
    });
  }
  if (!currentQrCodeDataUrl) {
    return res.json({
      success: false,
      status: connectionStatus,
      message: "QR Code is not ready yet. Please wait...",
    });
  }
  res.json({
    success: true,
    status: "QR_READY",
    qr: currentQrCodeDataUrl,
    qrCode: currentQrCodeDataUrl,
    raw: currentQrRaw,
  });
});

// Helper for sending text
async function handleSendText(req, res) {
  try {
    const phone = req.body.phone || req.body.to;
    const message = req.body.message || req.body.content || req.body.text;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone number (to) and message text (content) are required." });
    }

    if (connectionStatus !== "CONNECTED" || !sock) {
      return res.status(503).json({
        error: "WhatsApp gateway is not connected. Please scan QR code first.",
        status: connectionStatus,
        state: connectionStatus,
      });
    }

    const jid = formatJid(phone);
    const sent = await sock.sendMessage(jid, { text: String(message).trim() });

    if (sent?.key?.id && sent?.message) {
      // Store exact proto.IMessage cleanly without extra fields that corrupt protobuf
      messageStore.set(sent.key.id, sent.message);
      messageStore.set(`${jid}:${sent.key.id}`, sent.message);
      persistMessageStore();
    }

    return res.json({
      success: true,
      messageId: sent?.key?.id || null,
      phone: jid.split("@")[0],
      status: "SENT",
      timestamp: new Date().toISOString(),
      result: sent,
    });
  } catch (error) {
    logger.error("Error sending WhatsApp message:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to send WhatsApp message." });
  }
}

// 4. Send Text Message
app.post("/send-message", authMiddleware, handleSendText);
app.post("/send-text", authMiddleware, handleSendText);

// 5. Send Media
app.post("/send-media", authMiddleware, async (req, res) => {
  try {
    const phone = req.body.phone || req.body.to;
    const { mediaUrl, mediaBase64, caption, fileName, filename, mimeType } = req.body;
    const effectiveFileName = fileName || filename || "file";

    if (!phone || (!mediaUrl && !mediaBase64)) {
      return res.status(400).json({ error: "Phone (to) and mediaUrl or mediaBase64 are required." });
    }

    if (connectionStatus !== "CONNECTED" || !sock) {
      return res.status(503).json({ error: "WhatsApp gateway is not connected." });
    }

    const jid = formatJid(phone);
    let messagePayload = {};

    if (mediaBase64) {
      const buffer = Buffer.from(mediaBase64, "base64");
      const isPdf = (mimeType || "").includes("pdf") || effectiveFileName.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        messagePayload = {
          document: buffer,
          mimetype: mimeType || "application/pdf",
          fileName: effectiveFileName,
          caption: caption || undefined,
        };
      } else {
        messagePayload = {
          image: buffer,
          caption: caption || undefined,
          fileName: effectiveFileName,
        };
      }
    } else {
      const isPdf =
        mimeType === "application/pdf" ||
        (mediaUrl || "").toLowerCase().endsWith(".pdf") ||
        effectiveFileName.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        messagePayload = {
          document: { url: mediaUrl },
          mimetype: mimeType || "application/pdf",
          fileName: effectiveFileName || "document.pdf",
          caption: caption || undefined,
        };
      } else {
        messagePayload = {
          image: { url: mediaUrl },
          caption: caption || undefined,
        };
      }
    }

    const sent = await sock.sendMessage(jid, messagePayload);

    if (sent?.key?.id && sent?.message) {
      messageStore.set(sent.key.id, sent.message);
      messageStore.set(`${jid}:${sent.key.id}`, sent.message);
      persistMessageStore();
    }

    return res.json({
      success: true,
      messageId: sent?.key?.id || null,
      phone: jid.split("@")[0],
      status: "SENT",
      result: sent,
    });
  } catch (error) {
    logger.error("Error sending WhatsApp media:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to send WhatsApp media." });
  }
});

// 6. Send Document
app.post("/send-document", authMiddleware, async (req, res) => {
  try {
    const { phone, documentUrl, fileName, mimeType, caption } = req.body;

    if (!phone || !documentUrl) {
      return res.status(400).json({ error: "Phone and documentUrl are required." });
    }

    if (connectionStatus !== "CONNECTED" || !sock) {
      return res.status(503).json({ error: "WhatsApp gateway is not connected." });
    }

    const jid = formatJid(phone);
    const sent = await sock.sendMessage(jid, {
      document: { url: documentUrl },
      mimetype: mimeType || "application/pdf",
      fileName: fileName || "Sunlife-Solar-Document.pdf",
      caption: caption || undefined,
    });

    if (sent?.key?.id && sent?.message) {
      messageStore.set(sent.key.id, sent.message);
      messageStore.set(`${jid}:${sent.key.id}`, sent.message);
      persistMessageStore();
    }

    return res.json({
      success: true,
      messageId: sent?.key?.id || null,
      phone: jid.split("@")[0],
      status: "SENT",
    });
  } catch (error) {
    logger.error("Error sending document:", error);
    return res.status(500).json({ error: error.message || "Failed to send document." });
  }
});

// 7. Intentional Temporary Disconnect (Preserves all credentials)
app.post("/disconnect", authMiddleware, async (req, res) => {
  try {
    isIntentionalDisconnect = true;
    await destroySocket();
    connectionStatus = "DISCONNECTED";
    currentQrCodeDataUrl = null;
    connectedUser = null;
    logger.info("Gateway disconnected intentionally via POST /disconnect. Credentials preserved.");
    return res.json({ success: true, message: "Gateway disconnected. Session credentials preserved." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. Explicit Reconnect / Resume
app.post("/connect", authMiddleware, async (req, res) => {
  try {
    isIntentionalDisconnect = false;
    reconnectAttempts = 0;
    connectToWhatsApp().catch((err) => logger.error("Manual connect error:", err));
    return res.json({ success: true, message: "Connection handshake initiated." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. Unpair / Revoke Session (Requires explicit confirmation, clears cloud backup)
app.post("/logout", authMiddleware, async (req, res) => {
  try {
    const { confirmUnpair } = req.body || {};
    if (!confirmUnpair) {
      return res.status(400).json({
        error:
          "Unpairing permanently revokes WhatsApp credentials. Pass { confirmUnpair: true } to proceed, or use POST /disconnect to temporarily disconnect safely without losing credentials.",
      });
    }

    logger.warn("Explicit unpair requested. Clearing cloud session backup...");
    await clearSessionDatabase();

    if (sock && typeof sock.logout === "function") {
      try {
        await sock.logout();
      } catch (logoutErr) {
        logger.warn(`sock.logout() error: ${logoutErr.message}`);
      }
    }

    try {
      const files = fs.readdirSync(SESSIONS_DIR);
      for (const f of files) {
        fs.unlinkSync(path.join(SESSIONS_DIR, f));
      }
    } catch (e) {}

    await destroySocket();
    connectionStatus = "DISCONNECTED";
    currentQrCodeDataUrl = null;
    connectedUser = null;

    return res.json({ success: true, message: "Logged out and uncoupled. Cloud session cleared." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Process signal handlers
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Cleaning up socket...");
  await destroySocket();
  if (activeServer) {
    activeServer.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Cleaning up socket...");
  await destroySocket();
  if (activeServer) {
    activeServer.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

// Server Starter
function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    if (activeServer) {
      return resolve(activeServer);
    }
    const s = app.listen(port, () => {
      activeServer = s;
      logger.info(`Sunlife WhatsApp Gateway HTTP server listening on port ${port}`);
      resolve(activeServer);
    });
    s.on("error", (err) => {
      logger.error("HTTP server startup failed:", err);
      reject(err);
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (activeServer) {
      activeServer.close(() => {
        activeServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Auto-start on direct process execution
if (require.main === module) {
  startServer(PORT)
    .then(() => {
      logger.info("Gateway server started successfully. Initializing WhatsApp connection...");
      connectToWhatsApp().catch((err) => {
        logger.error("Initial connectToWhatsApp error:", err);
      });
    })
    .catch((err) => {
      logger.error("Fatal startup error:", err);
      process.exit(1);
    });
}

module.exports = {
  app,
  startServer,
  stopServer,
  destroySocket,
  calculateBackoffMs,
  connectToWhatsApp,
  scheduleReconnect,
  getConnectionStatus: () => connectionStatus,
  setConnectionStatus: (st) => {
    connectionStatus = st;
  },
  getIsConnecting: () => isConnecting,
  setIsConnecting: (val) => {
    isConnecting = val;
  },
  getIsIntentionalDisconnect: () => isIntentionalDisconnect,
  setIsIntentionalDisconnect: (val) => {
    isIntentionalDisconnect = val;
  },
  getReconnectAttempts: () => reconnectAttempts,
  setReconnectAttempts: (n) => {
    reconnectAttempts = n;
  },
  setQrCodeData: (qr) => {
    currentQrCodeDataUrl = qr;
  },
  getServer: () => activeServer,
};
