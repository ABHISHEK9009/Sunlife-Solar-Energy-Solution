# Sunlife Solar WhatsApp Gateway

Standalone microservice powered by Express and `@whiskeysockets/baileys` (WhatsApp Web multi-device protocol).

---

## Features
- **Independent Process**: Completely decoupled from the Next.js CRM.
- **Persistent Multi-Device Auth**: Credentials saved to `sessions/` folder.
- **REST Endpoints**:
  - `GET /health` & `GET /status`
  - `GET /qr` (Returns Base64 Data URL)
  - `POST /send-text` & `POST /send-message`
  - `POST /send-media` (Accepts URL or Base64)
  - `POST /send-document`
  - `POST /logout`
- **Inbound Forwarding**: Automatically posts incoming WhatsApp customer replies to Sunlife CRM Webhook (`/api/v1/whatsapp/webhook`).

---

## Quick Start

### 1. Install & Run Locally
```bash
# In the root directory:
npm run gateway:dev

# Or inside whatsapp-gateway/:
cd whatsapp-gateway
npm install
npm run dev
```

The gateway will run on `http://localhost:3001`.

### 2. Pair WhatsApp
1. Open Sunlife CRM: `http://localhost:3000/admin/whatsapp`
2. Click **Pair WhatsApp**
3. Scan the QR code using your phone (WhatsApp > Linked Devices > Link a Device).

---

## Production Deployment (PM2)
```bash
cd whatsapp-gateway
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save
```

For the complete standalone blueprint to use this in any other project, see [docs/WHATSAPP_GATEWAY_BLUEPRINT.md](../docs/WHATSAPP_GATEWAY_BLUEPRINT.md).
