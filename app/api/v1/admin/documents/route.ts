export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";
import { generateDocumentId } from "@/lib/crm/sequence-generator";
import { deleteDocumentFromDrive } from "@/lib/storage/google-drive";

export async function GET(req: Request) {
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

  try {
    const documents = await prisma.document.findMany({
      orderBy: { uploadedDate: "desc" },
      include: {
        customer: { select: { customerId: true, fullName: true, primaryMobile: true } },
        project: { select: { projectId: true, projectName: true } },
      },
      take: 100,
    });
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, verificationStatus, customerCanView } = body;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(verificationStatus && { verificationStatus, verifiedBy: "ADMIN" }),
        ...(customerCanView !== undefined && { customerCanView }),
      },
    });

    await logAuditEvent({
      entityType: "Document",
      entityId: id,
      fieldChanged: "verificationStatus",
      action: "STATUS_CHANGE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      newValue: `Document verification set to ${verificationStatus}`,
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update document." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      customerId,
      projectId,
      documentCategory,
      documentName,
      fileLocation,
      mimeType,
      fileSizeBytes,
      uploadedBy = "Admin",
      verificationStatus = "VERIFIED",
    } = body;

    if (!customerId || !documentName || !documentCategory) {
      return NextResponse.json(
        { error: "Customer, document name, and category are required." },
        { status: 400 }
      );
    }

    const documentId = await generateDocumentId();

    const doc = await prisma.document.create({
      data: {
        documentId,
        customerId,
        projectId: projectId || null,
        documentCategory,
        documentName: documentName.trim(),
        fileLocation: fileLocation || `/uploads/docs/${documentId}.pdf`,
        mimeType: mimeType || "application/pdf",
        fileSizeBytes: fileSizeBytes || 250000,
        uploadedBy: uploadedBy || "Admin",
        verificationStatus: verificationStatus || "VERIFIED",
        verifiedBy: verificationStatus === "VERIFIED" ? "Admin" : null,
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
      newValue: `Uploaded document ${doc.documentName} (${doc.documentCategory}) for customer ${doc.customer.fullName}`,
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error("[Documents POST Error]:", error);
    return NextResponse.json({ error: "Failed to upload document." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // Explicit cloud file deletion only if purgeCloudFile is set; preserves cloud storage by default
    const purgeCloudFile = searchParams.get("purgeCloudFile") === "true";
    if (purgeCloudFile && doc.fileLocation && !doc.fileLocation.startsWith("/uploads/")) {
      try {
        await deleteDocumentFromDrive(doc.fileLocation);
      } catch (driveErr) {
        console.warn("[Document DELETE] Could not delete cloud file:", driveErr);
      }
    }

    await prisma.document.delete({
      where: { id },
    });

    await logAuditEvent({
      entityType: "Document",
      entityId: id,
      fieldChanged: "document",
      action: "DELETE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      previousValue: JSON.stringify({
        documentId: doc.documentId,
        documentName: doc.documentName,
        documentCategory: doc.documentCategory,
        customerId: doc.customerId,
        fileLocation: doc.fileLocation,
      }),
      newValue: `Deleted document ${doc.documentName} (${doc.documentId})`,
    });

    return NextResponse.json({ success: true, message: "Document deleted successfully." });
  } catch (error: any) {
    console.error("[Documents DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete document." }, { status: 500 });
  }
}
