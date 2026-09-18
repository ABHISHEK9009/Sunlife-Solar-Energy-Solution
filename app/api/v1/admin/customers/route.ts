import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";
import { registerCustomerInitialPin } from "@/lib/crm/auth-otp";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const customers = await prisma.customer.findMany({
      where: {
        AND: [
          status ? { customerStatus: status } : {},
          search ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { primaryMobile: { contains: search } },
              { customerId: { contains: search, mode: "insensitive" } },
              { installationAddress: { contains: search, mode: "insensitive" } },
            ],
          } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        assignedSalesExecutive: {
          select: { name: true, phone: true },
        },
        _count: {
          select: { projects: true, tickets: true },
        },
      },
      take: 100,
    });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error("[Admin Customers GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch customers." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      primaryMobile,
      alternateMobile,
      email,
      installationAddress,
      billingAddress,
      propertyType,
      assignedSalesExecutiveId,
    } = body;

    if (!fullName || !primaryMobile || !installationAddress) {
      return NextResponse.json(
        { error: "Full name, primary mobile, and installation address are required." },
        { status: 400 }
      );
    }

    const cleanPhone = primaryMobile.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Valid 10-digit mobile number required." }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({
      where: { primaryMobile: cleanPhone },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Customer with mobile ${cleanPhone} already exists (${existing.customerId}).` },
        { status: 409 }
      );
    }

    const customerCount = await prisma.customer.count();
    const customerCode = `SL-CUST-${1000 + customerCount + 1}`;

    const customer = await prisma.customer.create({
      data: {
        customerId: customerCode,
        fullName: fullName.trim(),
        primaryMobile: cleanPhone,
        alternateMobile: alternateMobile ? alternateMobile.trim() : null,
        email: email ? email.trim() : null,
        installationAddress: installationAddress.trim(),
        billingAddress: billingAddress ? billingAddress.trim() : null,
        propertyType: propertyType || "RESIDENTIAL",
        assignedSalesExecutiveId: assignedSalesExecutiveId || null,
        customerStatus: "ACTIVE",
        appAccessEnabled: true,
      },
    });

    // 1. Create Solar Project for new client
    const projectCount = await prisma.solarProject.count();
    const projectId = `SL-PRJ-${1000 + projectCount + 1}`;

    const project = await prisma.solarProject.create({
      data: {
        projectId,
        customerId: customer.id,
        projectName: `${customer.fullName}'s Solar Plant`,
        plantCapacityKw: 5,
        propertyType: propertyType || "RESIDENTIAL",
        solarType: "ON_GRID",
        projectStatus: "IN_PROGRESS",
        installationAddress: customer.installationAddress,
        assignedSalesExecutiveId: assignedSalesExecutiveId || null,
      },
    });

    // 2. Register authoritative 6-digit Login PIN
    const initialPin = "123456";
    registerCustomerInitialPin(cleanPhone, initialPin);

    await logAuditEvent({
      entityType: "Customer",
      entityId: customer.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      source: "CRM",
      newValue: `Admin created customer ${customer.customerId} (${customer.fullName}) with project ${projectId}`,
    });

    return NextResponse.json({
      success: true,
      customer,
      project: {
        id: project.id,
        projectId: project.projectId,
        projectCode: project.projectId,
        capacityKw: project.plantCapacityKw,
      },
      initialPin,
      loginInstructions: `Client can log in using mobile (+91 ${cleanPhone}) and 6-digit PIN: ${initialPin}`,
    });
  } catch (error: any) {
    console.error("[Admin Customers POST Error]:", error);
    return NextResponse.json({ error: "Failed to create customer." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { OR: [{ id }, { customerId: id }] },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id: customer.id },
    });

    await logAuditEvent({
      entityType: "Customer",
      entityId: customer.id,
      fieldChanged: "all",
      action: "DELETE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      source: "CRM",
      newValue: `Deleted customer ${customer.customerId} (${customer.fullName})`,
    });

    return NextResponse.json({ success: true, message: "Customer deleted successfully." });
  } catch (error: any) {
    console.error("[Admin Customers DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete customer." }, { status: 500 });
  }
}

