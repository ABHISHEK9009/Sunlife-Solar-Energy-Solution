export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";
import { authenticateAdminRequest } from "@/lib/crm/admin-auth";

interface CustomerImportPayload {
  fullName: string;
  primaryMobile: string;
  alternateMobile?: string;
  email?: string;
  installationAddress: string;
  billingAddress?: string;
  propertyType?: string;
  plantCapacityKw?: number | string;
  solarType?: string;
  consumerNumber?: string;
  discom?: string;
  customerStatus?: string;
}

export async function POST(req: Request) {
  if (!(await authenticateAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const items: CustomerImportPayload[] = Array.isArray(body?.customers)
      ? body.customers
      : Array.isArray(body)
      ? body
      : [];

    if (!items.length) {
      return NextResponse.json(
        { error: "No customer records provided for import." },
        { status: 400 }
      );
    }

    // Collect all phones to pre-fetch duplicates
    const cleanedItems = items.map((item, index) => {
      const cleanPhone = (item.primaryMobile || "").toString().replace(/\D/g, "").slice(-10);
      return {
        ...item,
        originalIndex: index + 1,
        cleanPhone,
      };
    });

    const phoneList = cleanedItems
      .map((i) => i.cleanPhone)
      .filter((p) => p && p.length === 10);

    // Fetch existing customers with these phones
    const existingCustomers = await prisma.customer.findMany({
      where: { primaryMobile: { in: phoneList } },
      select: { customerId: true, primaryMobile: true, fullName: true },
    });

    const existingPhoneMap = new Map(
      existingCustomers.map((c) => [c.primaryMobile, c])
    );

    // Pre-calculate collision-proof ID sequences
    const existingCust = await prisma.customer.findMany({
      where: { customerId: { startsWith: "SL-CUST-" } },
      select: { customerId: true },
    });
    const existingCustNums = new Set(
      existingCust.map((c) => {
        const match = c.customerId.match(/SL-CUST-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
    );

    const existingPrj = await prisma.solarProject.findMany({
      where: { projectId: { startsWith: "SL-PRJ-" } },
      select: { projectId: true },
    });
    const existingPrjNums = new Set(
      existingPrj.map((p) => {
        const match = p.projectId.match(/SL-PRJ-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
    );

    let nextCustNum = 1001;
    let nextPrjNum = 1001;
    const getNextCustomerCode = () => {
      while (existingCustNums.has(nextCustNum)) {
        nextCustNum++;
      }
      const code = `SL-CUST-${nextCustNum}`;
      existingCustNums.add(nextCustNum);
      return code;
    };
    const getNextProjectCode = () => {
      while (existingPrjNums.has(nextPrjNum)) {
        nextPrjNum++;
      }
      const code = `SL-PRJ-${nextPrjNum}`;
      existingPrjNums.add(nextPrjNum);
      return code;
    };

    const imported: any[] = [];
    const skipped: any[] = [];
    const errors: any[] = [];
    const seenBatchPhones = new Set<string>();

    let createdCount = 0;

    for (const item of cleanedItems) {
      const {
        fullName,
        cleanPhone,
        alternateMobile,
        email,
        installationAddress,
        billingAddress,
        propertyType,
        plantCapacityKw,
        solarType,
        consumerNumber,
        discom,
        customerStatus,
        originalIndex,
      } = item;

      // Validation 1: Required fields
      if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
        errors.push({
          row: originalIndex,
          name: fullName || "Unnamed",
          phone: cleanPhone || "N/A",
          reason: "Full name is missing or invalid.",
        });
        continue;
      }

      if (!cleanPhone || cleanPhone.length !== 10) {
        errors.push({
          row: originalIndex,
          name: fullName.trim(),
          phone: cleanPhone || "N/A",
          reason: "Primary mobile must be a valid 10-digit number.",
        });
        continue;
      }

      if (!installationAddress || typeof installationAddress !== "string" || !installationAddress.trim()) {
        errors.push({
          row: originalIndex,
          name: fullName.trim(),
          phone: cleanPhone,
          reason: "Installation address is missing.",
        });
        continue;
      }

      // Validation 2: In-batch duplicate
      if (seenBatchPhones.has(cleanPhone)) {
        skipped.push({
          row: originalIndex,
          name: fullName.trim(),
          phone: cleanPhone,
          reason: "Duplicate phone number found within the import file.",
        });
        continue;
      }
      seenBatchPhones.add(cleanPhone);

      // Validation 3: Already exists in database
      const existing = existingPhoneMap.get(cleanPhone);
      if (existing) {
        skipped.push({
          row: originalIndex,
          name: fullName.trim(),
          phone: cleanPhone,
          reason: `Already registered as ${existing.customerId} (${existing.fullName}).`,
        });
        continue;
      }

      // Normalize fields
      const normPropertyType =
        (propertyType || "").toUpperCase().includes("COMMERCIAL") ||
        (propertyType || "").toUpperCase().includes("INDUSTRIAL")
          ? "COMMERCIAL"
          : "RESIDENTIAL";

      const normSolarType =
        (solarType || "").toUpperCase().includes("HYBRID")
          ? "HYBRID"
          : (solarType || "").toUpperCase().includes("OFF")
          ? "OFF_GRID"
          : "ON_GRID";

      const parsedCapacity =
        typeof plantCapacityKw === "number"
          ? plantCapacityKw
          : parseFloat(String(plantCapacityKw || "5.0")) || 5.0;

      const normCustomerStatus =
        (customerStatus || "").toUpperCase() === "INACTIVE"
          ? "INACTIVE"
          : (customerStatus || "").toUpperCase() === "BLACKLISTED"
          ? "BLACKLISTED"
          : "ACTIVE";

      try {
        const customerCode = getNextCustomerCode();
        const projectCode = getNextProjectCode();

        // Create Customer
        const customer = await prisma.customer.create({
          data: {
            customerId: customerCode,
            fullName: fullName.trim(),
            primaryMobile: cleanPhone,
            alternateMobile: alternateMobile ? String(alternateMobile).trim() : null,
            email: email ? String(email).trim().toLowerCase() : null,
            installationAddress: installationAddress.trim(),
            billingAddress: billingAddress ? String(billingAddress).trim() : null,
            propertyType: normPropertyType,
            customerStatus: normCustomerStatus,
            appAccessEnabled: normCustomerStatus === "ACTIVE",
          },
        });

        // Create Solar Project for customer
        const project = await prisma.solarProject.create({
          data: {
            projectId: projectCode,
            customerId: customer.id,
            projectName: `${customer.fullName}'s Solar Plant`,
            plantCapacityKw: parsedCapacity > 0 ? parsedCapacity : 5.0,
            solarType: normSolarType,
            propertyType: normPropertyType,
            projectStatus: "IN_PROGRESS",
            installationAddress: customer.installationAddress,
            consumerNumber: consumerNumber ? String(consumerNumber).trim() : null,
            discom: discom ? String(discom).trim() : "MPMKVVCL",
          },
        });

        createdCount++;
        imported.push({
          row: originalIndex,
          customerId: customer.customerId,
          projectId: project.projectId,
          fullName: customer.fullName,
          primaryMobile: customer.primaryMobile,
          capacityKw: project.plantCapacityKw,
        });
      } catch (insertError: any) {
        console.error(`[Customer Import Row Error ${originalIndex}]:`, insertError);
        errors.push({
          row: originalIndex,
          name: fullName.trim(),
          phone: cleanPhone,
          reason: insertError.message || "Database insert failed.",
        });
      }
    }

    if (createdCount > 0) {
      await logAuditEvent({
        entityType: "Customer",
        entityId: "BULK_IMPORT",
        fieldChanged: "all",
        action: "CREATE",
        actorId: "ADMIN",
        actorType: "ADMIN",
        source: "CRM",
        newValue: `Admin bulk imported ${createdCount} customers (${skipped.length} skipped, ${errors.length} errors)`,
      });
    }

    return NextResponse.json({
      success: true,
      totalSubmitted: items.length,
      importedCount: createdCount,
      skippedCount: skipped.length,
      errorCount: errors.length,
      imported,
      skipped,
      errors,
      message: `Successfully imported ${createdCount} customer${createdCount === 1 ? "" : "s"}.`,
    });
  } catch (error: any) {
    console.error("[Admin Customers Import Error]:", error);
    return NextResponse.json(
      { error: "Failed to process customer import." },
      { status: 500 }
    );
  }
}
