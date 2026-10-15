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

function verifyAuth(req: NextRequest): boolean {
  const secret = req.headers.get("x-webhook-secret");
  const expectedSecret = process.env.CRM_WEBHOOK_SECRET || "sunlife_webhook_secret_key_2026";
  return safeCompare(secret, expectedSecret);
}

// GET /api/v1/whatsapp/session-sync
// Retrieves all saved session files from PostgreSQL database
export async function GET(req: NextRequest) {
  try {
    if (!verifyAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.whatsAppGatewaySession.findMany();
    const files: Record<string, string> = {};
    for (const s of sessions) {
      files[s.id] = s.data;
    }

    const hasCreds = Boolean(files["creds.json"]);
    return NextResponse.json({
      success: true,
      count: sessions.length,
      hasCreds,
      files,
    });
  } catch (error: any) {
    console.error("[Session-Sync GET Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve session files" }, { status: 500 });
  }
}

// POST /api/v1/whatsapp/session-sync
// Persists updated session files into PostgreSQL database
export async function POST(req: NextRequest) {
  try {
    if (!verifyAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const files: Record<string, string> = payload.files || {};
    if (payload.file && payload.data !== undefined) {
      files[payload.file] = String(payload.data);
    }

    const fileEntries = Object.entries(files);
    if (fileEntries.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    // Upsert entries in transaction or bulk operations
    await prisma.$transaction(
      fileEntries.map(([id, data]) =>
        prisma.whatsAppGatewaySession.upsert({
          where: { id },
          create: { id, data: String(data) },
          update: { data: String(data) },
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: fileEntries.length,
    });
  } catch (error: any) {
    console.error("[Session-Sync POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to persist session files" }, { status: 500 });
  }
}

// DELETE /api/v1/whatsapp/session-sync
// Clears session files upon intentional unpairing / logout
export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || searchParams.get("id");
    const all = searchParams.get("all") === "true";

    if (all) {
      const deleted = await prisma.whatsAppGatewaySession.deleteMany({});
      return NextResponse.json({ success: true, deletedAll: true, count: deleted.count });
    } else if (key) {
      await prisma.whatsAppGatewaySession.delete({
        where: { id: key },
      }).catch(() => {});
      return NextResponse.json({ success: true, deletedKey: key });
    }

    return NextResponse.json({ error: "Provide ?key=filename or ?all=true" }, { status: 400 });
  } catch (error: any) {
    console.error("[Session-Sync DELETE Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to delete session files" }, { status: 500 });
  }
}
