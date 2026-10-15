import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

function safeCompare(a: string | null, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// GET /api/v1/whatsapp/get-message?id=...
// Fetches stored message payload to resolve Baileys E2EE retry requests
export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    const expectedSecret = process.env.CRM_WEBHOOK_SECRET || "sunlife_webhook_secret_key_2026";
    if (!safeCompare(secret, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("id");

    if (!messageId) {
      return NextResponse.json({ error: "Message id is required" }, { status: 400 });
    }

    const msg = await prisma.whatsAppMessage.findFirst({
      where: {
        OR: [
          { gatewayMessageId: messageId },
          { providerMessageId: messageId },
          { id: messageId },
        ],
      },
    });

    if (!msg) {
      return NextResponse.json({ found: false });
    }

    // Reconstruct proto.IMessage payload based on type
    let messagePayload: any = {};
    if (msg.messageType === "IMAGE" && msg.mediaUrl) {
      messagePayload = {
        imageMessage: {
          url: msg.mediaUrl,
          caption: msg.content || msg.caption || undefined,
        },
      };
    } else if (msg.messageType === "DOCUMENT" && msg.mediaUrl) {
      messagePayload = {
        documentMessage: {
          url: msg.mediaUrl,
          title: msg.fileName || "Document.pdf",
          caption: msg.content || msg.caption || undefined,
        },
      };
    } else {
      messagePayload = {
        conversation: msg.content || "",
      };
    }

    return NextResponse.json({
      found: true,
      message: messagePayload,
    });
  } catch (error: any) {
    console.error("[Get-Message API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch message" }, { status: 500 });
  }
}
