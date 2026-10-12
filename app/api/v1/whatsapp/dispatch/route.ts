import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { dispatchQueuedMessages } from "@/lib/whatsapp/queue";

function safeCompare(a: string | null, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-api-key") || req.headers.get("x-webhook-secret");
    const expectedKey = process.env.WHATSAPP_API_KEY || "sunlife_whatsapp_secret_key_2026";
    const expectedSecret = process.env.CRM_WEBHOOK_SECRET || "sunlife_webhook_secret_key_2026";

    const isAuthorized =
      safeCompare(authHeader, expectedKey) ||
      safeCompare(authHeader, expectedSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized dispatcher trigger." }, { status: 401 });
    }

    const { limit = 10 } = await req.json().catch(() => ({}));
    const result = await dispatchQueuedMessages(Number(limit) || 10);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[WhatsApp Dispatcher Route Error]:", err);
    return NextResponse.json({ error: err.message || "Dispatcher failed" }, { status: 500 });
  }
}
