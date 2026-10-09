export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = params;

  try {
    const documents = await prisma.document.findMany({
      where: {
        projectId: id,
        customerId: customer.id,
        customerCanView: true,
      },
      orderBy: { uploadedDate: "desc" },
      select: {
        id: true,
        documentId: true,
        documentCategory: true,
        documentName: true,
        fileLocation: true,
        mimeType: true,
        version: true,
        verificationStatus: true,
        customerCanDownload: true,
        uploadedDate: true,
        expiryDate: true,
      },
    });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch documents." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Authenticate caller (Customer, Agent, or Admin)
  const [customer, agent, isAdmin] = await Promise.all([
    authenticateCustomerRequest(req),
    authenticateAgentRequest(req),
    authenticateAdminRequest(req),
  ]);

  if (!customer && !agent && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const project = await prisma.solarProject.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
      },
      include: {
        customer: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized access." },
        { status: 404 }
      );
    }

    // Authorization checks
    if (customer && project.customerId !== customer.id) {
      return NextResponse.json({ error: "Forbidden: Cannot upload to another customer's project." }, { status: 403 });
    }

    if (!customer && !isAdmin && agent) {
      const isPrivileged = agent.role === "Admin" || agent.role === "Manager";
      const isAssigned =
        project.assignedEngineerId === agent.id ||
        project.assignedSalesExecutiveId === agent.id;
      if (!isPrivileged && !isAssigned) {
        return NextResponse.json({ error: "Forbidden: Not assigned to this project." }, { status: 403 });
      }
    }

    const contentType = req.headers.get("content-type") || "";
    let documentCategory = "OTHER";
    let documentName = "Document";
    let fileLocation = "";
    let mimeType = "application/pdf";
    let fileSizeBytes: number | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      documentCategory = (formData.get("documentCategory") as string) || "CUSTOMER_KYC";
      documentName = (formData.get("documentName") as string) || file?.name || "Uploaded Document";

      if (file && typeof file !== "string") {
        // Enforce max 15MB file size
        if (file.size > 15 * 1024 * 1024) {
          return NextResponse.json({ error: "File exceeds maximum permitted size of 15MB." }, { status: 400 });
        }

        mimeType = file.type || "application/octet-stream";
        const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (!allowedMimes.includes(mimeType.toLowerCase())) {
          return NextResponse.json({ error: "Unsupported file type. Only PDF and JPEG/PNG/WEBP images are permitted." }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { uploadDocumentToDrive } = await import("@/lib/storage/google-drive");
        const uploadResult = await uploadDocumentToDrive({
          buffer,
          fileName: file.name,
          mimeType,
          customerName: project.customer.fullName,
          folderCategory: documentCategory,
        });

        fileLocation = uploadResult.webViewLink;
        fileSizeBytes = uploadResult.fileSizeBytes;
      } else {
        fileLocation = (formData.get("fileLocation") as string) || "";
        mimeType = (formData.get("mimeType") as string) || "application/pdf";
      }
    } else {
      // JSON payload
      const body = await req.json();
      documentCategory = body.documentCategory || "OTHER";
      documentName = body.documentName || "Document";
      fileLocation = body.fileLocation || "";
      mimeType = body.mimeType || "application/pdf";
    }

    if (!documentCategory || !documentName || !fileLocation) {
      return NextResponse.json({ error: "Required fields (documentCategory, documentName, and file) missing." }, { status: 400 });
    }

    const docCount = await prisma.document.count();
    const documentCode = `SL-DOC-${1000 + docCount + 1}`;

    const actorId = customer
      ? customer.customerId
      : agent
        ? (agent.employeeId || agent.name || agent.id)
        : "ADMIN";

    const document = await prisma.document.create({
      data: {
        documentId: documentCode,
        customerId: project.customerId,
        projectId: project.id,
        documentCategory,
        documentName,
        fileLocation,
        mimeType,
        fileSizeBytes,
        uploadedBy: actorId,
        verificationStatus: customer ? "PENDING" : "VERIFIED",
        verifiedBy: customer ? null : actorId,
        customerCanView: true,
        customerCanDownload: true,
      },
    });

    await logAuditEvent({
      entityType: "Document",
      entityId: document.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId,
      actorType: customer ? "CUSTOMER" : "EMPLOYEE",
      source: "APP",
      newValue: `Uploaded document: ${documentName} (${documentCategory})`,
    });

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error("[Project Document Upload Error]:", error);
    return NextResponse.json({ error: "Failed to upload document record." }, { status: 500 });
  }
}
