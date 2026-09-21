require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const pino = require("pino");
const QRCode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
} = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.WHATSAPP_API_KEY || "sunlife_whatsapp_secret_key_2026";
const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || "http://localhost:3000/api/v1/whatsapp/webhook";
const CRM_WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET || "sunlife_webhook_secret_key_2026";
const SESSIONS_DIR = path.join(__dirname, "..", "sessions");

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// State
let sock = null;
let connectionStatus = "DISCONNECTED"; // DISCONNECTED | CONNECTING | QR_READY | CONNECTED
let currentQrCodeDataUrl = null;
let currentQrRaw = null;
let connectedUser = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// Initialize WhatsApp Socket
async function connectToWhatsApp() {
  try {
    connectionStatus = "CONNECTING";
    const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    logger.info(`Starting Baileys v${version.join(".")} (isLatest: ${isLatest})`);

    sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      browser: ["Sunlife Solar CRM", "Desktop", "1.0.0"],
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
    });

    sock.ev.on("creds.update", saveCreds);

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
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        connectionStatus = "DISCONNECTED";
        currentQrCodeDataUrl = null;
        currentQrRaw = null;
        connectedUser = null;

        logger.warn(`Connection closed. StatusCode: ${statusCode}. Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(reconnectAttempts * 2000, 30000);
          logger.info(`Reconnecting in ${delay / 1000}s (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          setTimeout(connectToWhatsApp, delay);
        } else if (statusCode === DisconnectReason.loggedOut) {
          logger.warn("Client logged out. Clearing sessions folder.");
          try {
            fs.rmSync(SESSIONS_DIR, { recursive: true, force: true });
            fs.mkdirSync(SESSIONS_DIR, { recursive: true });
          } catch (e) {
            logger.error("Error clearing sessions:", e);
          }
          reconnectAttempts = 0;
          setTimeout(connectToWhatsApp, 3000);
        }
      } else if (connection === "open") {
        connectionStatus = "CONNECTED";
        currentQrCodeDataUrl = null;
        currentQrRaw = null;
        reconnectAttempts = 0;
        connectedUser = sock.user;
        logger.info(`WhatsApp connected successfully! Phone: ${sock.user?.id?.split(":")[0] || "Unknown"}`);
      }
    });

    // Inbound Messages Listener
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        // Skip outgoing messages sent by this bot itself
        if (msg.key.fromMe) continue;
        // Skip broadcast / status messages
        if (msg.key.remoteJid === "status@broadcast" || msg.key.remoteJid?.endsWith("@broadcast")) continue;
        // Skip group messages (personal family/friends groups)
        if (msg.key.remoteJid?.endsWith("@g.us")) continue;
        // Skip newsletters / channels
        if (msg.key.remoteJid?.endsWith("@newsletter")) continue;

        const senderJid = msg.key.remoteJid;
        const cleanPhone = senderJid?.replace(/@s\.whatsapp\.net|@c\.us/g, "");
        const pushName = msg.pushName || "Customer";

        // Extract message text or caption
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

        logger.info(`[Inbound WhatsApp] From: ${cleanPhone} (${pushName}): "${text}" [Type: ${messageType}]`);

        // Forward to Sunlife CRM Webhook
        if (CRM_WEBHOOK_URL) {
          try {
            const payload = {
              event: "INBOUND_MESSAGE",
              gatewayMessageId: msg.key.id,
              phone: cleanPhone,
              senderName: pushName,
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
  } catch (error) {
    logger.error("Error initializing WhatsApp connection:", error);
    connectionStatus = "DISCONNECTED";
    setTimeout(connectToWhatsApp, 10000);
  }
}

// Format Phone to WhatsApp JID
function formatJid(phone) {
  let clean = String(phone).replace(/\D/g, "");
  if (clean.length === 10) clean = "91" + clean;
  return `${clean}@s.whatsapp.net`;
}

// Authentication Middleware
function authMiddleware(req, res, next) {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  if (API_KEY && apiKey !== API_KEY) {
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
    service: "Sunlife WhatsApp Gateway",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 2. Gateway Status
app.get("/status", (req, res) => {
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

// 3. QR Code endpoint
app.get("/qr", (req, res) => {
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

// 4. Send Text Message (Supports /send-message and /send-text)
app.post("/send-message", authMiddleware, handleSendText);
app.post("/send-text", authMiddleware, handleSendText);

// 5. Send Media (Supports URL or Base64)
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
      const isPdf = mimeType === "application/pdf" || (mediaUrl || "").toLowerCase().endsWith(".pdf") || effectiveFileName.toLowerCase().endsWith(".pdf");
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

// 7. Disconnect / Logout
app.post("/logout", authMiddleware, async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    fs.rmSync(SESSIONS_DIR, { recursive: true, force: true });
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    connectionStatus = "DISCONNECTED";
    currentQrCodeDataUrl = null;
    connectedUser = null;
    setTimeout(connectToWhatsApp, 2000);
    return res.json({ success: true, message: "Logged out. New QR code generating..." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Sunlife Solar WhatsApp Gateway running on http://localhost:${PORT}`);
  connectToWhatsApp();
});
