export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadDocumentToDrive } from "@/lib/storage/google-drive";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customerId = formData.get("customerId") as string;
    const documentCategory = formData.get("documentCategory") as string;
    const documentName = formData.get("documentName") as string;
    const projectId = formData.get("projectId") as string | null;
    const uploadedBy = (formData.get("uploadedBy") as string) || "Admin";
    const verificationStatus = (formData.get("verificationStatus") as string) || "VERIFIED";

    if (!customerId || !documentCategory || !documentName) {
      return NextResponse.json(
        { error: "Customer, document category, and title are required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [{ id: customerId }, { customerId: customerId }],
      },
      select: { id: true, customerId: true, fullName: true, primaryMobile: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    let fileLocation = `/uploads/docs/${Date.now()}.pdf`;
    let fileSizeBytes = 250000;
    let mimeType = "application/pdf";
    let storageProvider = "LOCAL";

    if (file && typeof file.arrayBuffer === "function") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await uploadDocumentToDrive({
        buffer,
        fileName: file.name || `${documentName}.pdf`,
        mimeType: file.type || "application/pdf",
        customerName: `${customer.fullName} (${customer.customerId})`,
        folderCategory: documentCategory,
      });

      fileLocation = uploadRes.webViewLink;
      fileSizeBytes = uploadRes.fileSizeBytes;
      mimeType = uploadRes.mimeType;
      storageProvider = uploadRes.storageProvider;
    }

    const docCount = await prisma.document.count();
    const documentId = `SL-DOC-${1000 + docCount + 1}`;

    const doc = await prisma.document.create({
      data: {
        documentId,
        customerId: customer.id,
        projectId: projectId || null,
        documentCategory,
        documentName: documentName.trim(),
        fileLocation,
        mimeType,
        fileSizeBytes,
        uploadedBy,
        verificationStatus,
        verifiedBy: verificationStatus === "VERIFIED" ? uploadedBy : null,
        customerCanView: true,
        customerCanDownload: true,
      },
      include: {
        customer: { select: { customerId: true, fullName: true, primaryMobile: true } },
        project: { select: { projectId: true, projectName: true } },
      },
    });

    await logAuditEvent({
      entityType: "Document",
      entityId: doc.id,
      fieldChanged: "document",
      action: "CREATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Uploaded ${doc.documentName} (${doc.documentCategory}) to ${storageProvider} for customer ${customer.fullName}`,
    });

    return NextResponse.json({
      success: true,
      document: doc,
      storageProvider,
    });
  } catch (error: any) {
    console.error("[Document Multipart Upload Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document." },
      { status: 500 }
    );
  }
}
