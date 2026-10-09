export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";
import { uploadDocumentToDrive } from "@/lib/storage/google-drive";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

export async function POST(req: Request) {
  // Must be authenticated customer, agent, or admin
  const [customer, agent, isAdmin] = await Promise.all([
    authenticateCustomerRequest(req),
    authenticateAgentRequest(req),
    authenticateAdminRequest(req),
  ]);

  if (!customer && !agent && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data with a file payload." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderCategory = (formData.get("folderCategory") as string) || "UPLOADS";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided in form data." }, { status: 400 });
    }

    // Size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds maximum allowed size of 15MB." }, { status: 400 });
    }

    const mimeType = (file.type || "application/octet-stream").toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Unsupported file type. Only PDF and JPEG/PNG/WEBP images are permitted." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaderName = customer ? customer.fullName : agent?.name || "Admin";

    const uploadResult = await uploadDocumentToDrive({
      buffer,
      fileName: file.name,
      mimeType,
      customerName: uploaderName,
      folderCategory,
    });

    return NextResponse.json({
      success: true,
      fileUrl: uploadResult.webViewLink,
      fileName: uploadResult.fileName,
      mimeType: uploadResult.mimeType,
      size: uploadResult.fileSizeBytes,
      storageProvider: uploadResult.storageProvider,
    });
  } catch (error: any) {
    console.error("[Document Binary Upload Error]:", error);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}
