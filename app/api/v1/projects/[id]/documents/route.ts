export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";
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
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const { documentCategory, documentName, fileLocation, mimeType } = body;

    if (!documentCategory || !documentName || !fileLocation) {
      return NextResponse.json({ error: "Required fields missing." }, { status: 400 });
    }

    const docCount = await prisma.document.count();
    const documentCode = `SL-DOC-${1000 + docCount + 1}`;

    const document = await prisma.document.create({
      data: {
        documentId: documentCode,
        customerId: customer.id,
        projectId: id,
        documentCategory,
        documentName,
        fileLocation,
        mimeType: mimeType || "application/pdf",
        uploadedBy: customer.customerId,
        verificationStatus: "PENDING",
        customerCanView: true,
        customerCanDownload: true,
      },
    });

    await logAuditEvent({
      entityType: "Document",
      entityId: document.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId: customer.customerId,
      actorType: "CUSTOMER",
      source: "APP",
      newValue: `Customer uploaded document: ${documentName} (${documentCategory})`,
    });

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to upload document record." }, { status: 500 });
  }
}
