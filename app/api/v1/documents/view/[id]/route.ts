export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const doc = await prisma.document.findFirst({
      where: {
        OR: [{ id }, { documentId: id }],
      },
    });

    if (!doc || !doc.fileLocation) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // If it's a Google Drive file, extract fileId and redirect to direct view/download
    if (doc.fileLocation.includes("drive.google.com")) {
      const match =
        doc.fileLocation.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
        doc.fileLocation.match(/id=([a-zA-Z0-9_-]+)/);

      if (match && match[1]) {
        const fileId = match[1];
        const isDownload = req.nextUrl.searchParams.get("download") === "1";
        const targetUrl = isDownload
          ? `https://drive.google.com/uc?export=download&id=${fileId}`
          : `https://drive.google.com/file/d/${fileId}/view`;

        return NextResponse.redirect(targetUrl);
      }

      return NextResponse.redirect(doc.fileLocation);
    }

    // If it's a local file
    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || "https://sunlifesolar.in";
    const localUrl = doc.fileLocation.startsWith("http")
      ? doc.fileLocation
      : `${origin}${doc.fileLocation.startsWith("/") ? "" : "/"}${doc.fileLocation}`;

    return NextResponse.redirect(localUrl);
  } catch (error: any) {
    console.error("[Document View Proxy Error]:", error);
    return NextResponse.json({ error: "Failed to open document" }, { status: 500 });
  }
}
