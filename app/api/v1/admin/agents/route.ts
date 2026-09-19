export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/crm/audit-logger";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    const agents = await prisma.teamMember.findMany({
      where: includeInactive ? undefined : { activeStatus: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        category: true,
        phone: true,
        territory: true,
        department: true,
        status: true,
        activeStatus: true,
        employeeAccessEnabled: true,
        email: true,
        joinedYear: true,
        serviceArea: true,
        _count: {
          select: {
            assignedCustomers: true,
            surveys: true,
          },
        },
      },
    });

    const mappedAgents = agents.map((a) => ({
      ...a,
      pin: a.serviceArea || "123456",
    }));

    return NextResponse.json(
      { success: true, agents: mappedAgents },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("[Admin Agents GET Error]:", error);
    return NextResponse.json({ error: "Failed to load team agents." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      employeeId,
      role,
      category = "Field Team",
      territory,
      department = "Operations",
      email,
      initialPin,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Full Name is mandatory." },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "Mobile Number is mandatory." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Valid 10-digit mobile number is mandatory." },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email Address is mandatory." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. agent@sunlifesolar.in)." },
        { status: 400 }
      );
    }

    if (!role || !role.trim()) {
      return NextResponse.json(
        { error: "Role Title is mandatory." },
        { status: 400 }
      );
    }

    if (!territory || !territory.trim()) {
      return NextResponse.json(
        { error: "Assigned Territory is mandatory." },
        { status: 400 }
      );
    }

    const activePin = initialPin ? initialPin.toString().trim() : "";
    if (!activePin || activePin.length < 4 || activePin.length > 6) {
      return NextResponse.json(
        { error: "Initial Login PIN is mandatory (4-6 digits)." },
        { status: 400 }
      );
    }

    // Check if phone or employeeId already exists
    const existing = await prisma.teamMember.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(employeeId ? [{ employeeId: employeeId.trim() }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Agent already exists with this phone or ID (${existing.employeeId || existing.id} - ${existing.name}).`,
        },
        { status: 409 }
      );
    }

    // Generate standard employee ID if not provided
    const agentCount = await prisma.teamMember.count();
    const finalEmpId =
      employeeId && employeeId.toString().trim().length > 0
        ? employeeId.toString().trim()
        : `SL-A${100 + agentCount + 1}`;

    const newAgent = await prisma.teamMember.create({
      data: {
        id: `agent_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        employeeId: finalEmpId,
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        role: role.trim(),
        category: (category || "Field Team").trim(),
        territory: territory.trim(),
        serviceArea: activePin,
        department: (department || "Operations").trim(),
        activeStatus: true,
        employeeAccessEnabled: true,
        joinedYear: new Date().getFullYear().toString(),
        status: "Available",
      },
    });

    await logAuditEvent({
      entityType: "TeamMember",
      entityId: newAgent.id,
      fieldChanged: "all",
      action: "CREATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      source: "CRM",
      newValue: `Registered agent ${newAgent.name} (${finalEmpId}, ${cleanPhone}, ${cleanEmail})`,
    });

    return NextResponse.json(
      {
        success: true,
        agent: {
          id: newAgent.id,
          employeeId: newAgent.employeeId,
          name: newAgent.name,
          phone: newAgent.phone,
          email: newAgent.email,
          role: newAgent.role,
          territory: newAgent.territory,
          department: newAgent.department,
          pin: activePin,
        },
        initialPin: activePin,
        loginInstructions: `Agent can now log in to the Sunlife Agent App using Employee ID (${finalEmpId}) or Phone (${cleanPhone}) with 6-digit PIN: ${activePin}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Admin Agents POST Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register new agent." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      activeStatus,
      employeeAccessEnabled,
      role,
      territory,
      department,
      status,
      newPin,
      phone,
      name,
      email,
    } = body;
    if (!id) {
      return NextResponse.json({ error: "Agent ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof activeStatus === "boolean") updateData.activeStatus = activeStatus;
    if (typeof employeeAccessEnabled === "boolean") updateData.employeeAccessEnabled = employeeAccessEnabled;
    if (role !== undefined) updateData.role = role.trim();
    if (territory !== undefined) updateData.territory = territory.trim();
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length >= 10) updateData.phone = cleanPhone;
    }
    if (email !== undefined) {
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
      }
      updateData.email = cleanEmail;
    }
    if (newPin && newPin.toString().trim().length >= 4) {
      const cleanPin = newPin.toString().trim();
      updateData.serviceArea = cleanPin;
    }

    const updated = await prisma.teamMember.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      entityType: "TeamMember",
      entityId: updated.id,
      fieldChanged: "settings",
      action: "UPDATE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      source: "CRM",
      newValue: `Updated agent ${updated.name} (${updated.employeeId || updated.id})`,
    });

    return NextResponse.json({
      success: true,
      agent: {
        ...updated,
        pin: updated.serviceArea || "123456",
      },
    });
  } catch (error: any) {
    console.error("[Admin Agents PATCH Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update agent." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Agent ID is required." }, { status: 400 });
    }

    const updated = await prisma.teamMember.update({
      where: { id },
      data: { activeStatus: false, employeeAccessEnabled: false },
    });

    await logAuditEvent({
      entityType: "TeamMember",
      entityId: id,
      fieldChanged: "activeStatus",
      action: "STATUS_CHANGE",
      actorId: "ADMIN",
      actorType: "ADMIN",
      source: "CRM",
      newValue: `Deactivated agent ${updated.name} (${updated.employeeId || updated.id})`,
    });

    return NextResponse.json({ success: true, message: "Agent account deactivated successfully." });
  } catch (error: any) {
    console.error("[Admin Agents DELETE Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to deactivate agent." }, { status: 500 });
  }
}
