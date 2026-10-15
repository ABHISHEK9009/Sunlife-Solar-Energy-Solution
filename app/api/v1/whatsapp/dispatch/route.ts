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
    const expectedKey = (process.env.WHATSAPP_API_KEY || "").trim();
    const expectedSecret = (process.env.CRM_WEBHOOK_SECRET || "").trim();

    if (!expectedKey && !expectedSecret) {
      console.error("[WhatsApp Dispatch] Neither WHATSAPP_API_KEY nor CRM_WEBHOOK_SECRET is configured.");
      return NextResponse.json({ error: "Server configuration error: Dispatch credentials not set." }, { status: 500 });
    }

    const isAuthorized =
      (expectedKey ? safeCompare(authHeader, expectedKey) : false) ||
      (expectedSecret ? safeCompare(authHeader, expectedSecret) : false);

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
