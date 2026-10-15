export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";
import { generateCustomerId, generateProjectId } from "@/lib/crm/sequence-generator";

export async function GET(req: Request) {
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

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
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

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
      plantCapacityKw,
      solarType,
    } = body;

    if (!fullName || !primaryMobile || !installationAddress) {
      return NextResponse.json(
        { error: "Full name, primary mobile, and installation address are required." },
        { status: 400 }
      );
    }

    const hasCapacity =
      plantCapacityKw !== undefined &&
      plantCapacityKw !== null &&
      String(plantCapacityKw).trim() !== "";
    const parsedCapacity = hasCapacity ? parseFloat(plantCapacityKw) : null;

    if (hasCapacity && (parsedCapacity === null || isNaN(parsedCapacity) || parsedCapacity <= 0)) {
      return NextResponse.json(
        { error: "Valid positive plant capacity in kW (plantCapacityKw) is required when provisioning a project." },
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

    const { customer, project } = await prisma.$transaction(async (tx) => {
      const customerCode = await generateCustomerId(tx);

      const newCustomer = await tx.customer.create({
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

      let newProject: any = null;
      if (parsedCapacity !== null) {
        const projectId = await generateProjectId(tx);

        newProject = await tx.solarProject.create({
          data: {
            projectId,
            customerId: newCustomer.id,
            projectName: `${newCustomer.fullName}'s ${parsedCapacity} kW Solar Plant`,
            plantCapacityKw: parsedCapacity,
            propertyType: propertyType || "RESIDENTIAL",
            solarType: solarType || "ON_GRID",
            projectStatus: "IN_PROGRESS",
            installationAddress: newCustomer.installationAddress,
            assignedSalesExecutiveId: assignedSalesExecutiveId || null,
          },
        });
      }

      await logAuditEvent({
        entityType: "Customer",
        entityId: newCustomer.id,
        fieldChanged: "all",
        action: "CREATE",
        actorId: "ADMIN",
        actorType: "ADMIN",
        source: "CRM",
        client: tx,
        newValue: newProject
          ? `Admin created customer ${newCustomer.customerId} (${newCustomer.fullName}) with project ${newProject.projectId}`
          : `Admin created customer ${newCustomer.customerId} (${newCustomer.fullName})`,
      });

      return { customer: newCustomer, project: newProject };
    });

    return NextResponse.json({
      success: true,
      customer,
      project: project
        ? {
            id: project.id,
            projectId: project.projectId,
            projectCode: project.projectId,
            capacityKw: project.plantCapacityKw,
          }
        : null,
      loginInstructions: `Client can log in securely using mobile (+91 ${cleanPhone}) via authenticated one-time OTP.`,
    });
  } catch (error: any) {
    console.error("[Admin Customers POST Error]:", error);
    return NextResponse.json({ error: "Failed to create customer." }, { status: 500 });
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
      previousValue: JSON.stringify({
        customerId: customer.customerId,
        fullName: customer.fullName,
        primaryMobile: customer.primaryMobile,
        email: customer.email,
        installationAddress: customer.installationAddress,
      }),
      newValue: `Deleted customer ${customer.customerId} (${customer.fullName})`,
    });

    return NextResponse.json({ success: true, message: "Customer deleted successfully." });
  } catch (error: any) {
    console.error("[Admin Customers DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete customer." }, { status: 500 });
  }
}

