export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";
// Google Play Review helpers with safe fallbacks for test harness isolation
let isGooglePlayAgentPhone = (phone: string) => false;
let handleDemoAgentAttendance: any = null;

try {
  const gpr = require("@/lib/crm/google-play-review");
  if (gpr && typeof gpr.isGooglePlayAgentPhone === "function") {
    isGooglePlayAgentPhone = gpr.isGooglePlayAgentPhone;
    handleDemoAgentAttendance = gpr.handleDemoAgentAttendance;
  }
} catch (_) {}

const toDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("A valid attendance date is required.");
  return new Date(`${value}T00:00:00.000Z`);
};

const nowInIndia = () => {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => dateParts.find((part) => part.type === type)?.value;
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
  };
};

const minutesFromTime = (value: string) => {
  const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (match[3].toUpperCase() === "PM" && hour < 12) hour += 12;
  if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
};

const toRecord = (record: any) => ({
  id: record.id,
  memberId: record.memberId,
  date: record.date.toISOString().slice(0, 10),
  status: record.status,
  checkIn: record.checkIn,
  checkOut: record.checkOut,
  workingMinutes: record.workingMinutes,
  assignedSite: record.assignedSite,
  remarks: record.remarks || "",
  updatedAt: record.updatedAt.toISOString(),
});

export async function GET(req: Request) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const records = await prisma.attendance.findMany({
      where: {
        memberId: agent.id,
        ...(dateParam ? { date: toDate(dateParam) } : {}),
      },
      orderBy: { date: "desc" },
      take: 31,
    });

    return NextResponse.json({ success: true, records: records.map(toRecord) });
  } catch (error: any) {
    console.error("[Agent Attendance GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch attendance records." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, latitude, longitude, siteName } = body;

    if (!action || (action !== "punch-in" && action !== "punch-out")) {
      return NextResponse.json({ error: "A valid action ('punch-in' or 'punch-out') is required." }, { status: 400 });
    }

    // Google Play Review Demonstration Mode: safe repeatable punch without modifying real payroll
    if (isGooglePlayAgentPhone(agent.phone)) {
      const demoRecord = await handleDemoAgentAttendance({
        agent,
        action,
        latitude: typeof latitude === "number" ? latitude : undefined,
        longitude: typeof longitude === "number" ? longitude : undefined,
        siteName,
      });
      return NextResponse.json({ success: true, record: demoRecord });
    }

    // Always bind to the authenticated agent's ID to prevent impersonation
    const memberId = agent.id;

    // Server-side GPS coordinate check
    let locationRemark = "Mobile punch";
    if (latitude !== undefined || longitude !== undefined) {
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return NextResponse.json(
          { error: "Invalid GPS coordinates provided for attendance location." },
          { status: 400 }
        );
      }
      locationRemark = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }

    const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "Team member not found in CRM." }, { status: 404 });
    }

    const now = nowInIndia();
    const date = toDate(now.date);

    const existing = await prisma.attendance.findUnique({
      where: { memberId_date: { memberId, date } },
    });

    if (action === "punch-out" && (!existing || existing.checkIn === "--")) {
      return NextResponse.json({ error: "Cannot punch out before punching in." }, { status: 400 });
    }
    if (action === "punch-in" && existing && existing.checkIn !== "--") {
      return NextResponse.json({ error: "Check-in is already recorded for today." }, { status: 409 });
    }
    if (action === "punch-out" && existing && existing.checkOut !== "--") {
      return NextResponse.json({ error: "Check-out is already recorded for today." }, { status: 409 });
    }

    const workingMinutes =
      action === "punch-out" && existing
        ? Math.max(0, (minutesFromTime(now.time) || 0) - (minutesFromTime(existing.checkIn) || 0))
        : existing?.workingMinutes || 0;

    const assignedSite = siteName || `${member.territory || "Jaipur"} Solar Site`;

    const record = await prisma.attendance.upsert({
      where: { memberId_date: { memberId, date } },
      create: {
        memberId,
        date,
        status: "Present",
        checkIn: now.time,
        checkOut: "--",
        workingMinutes: 0,
        assignedSite,
        remarks: locationRemark,
      },
      update: {
        checkOut: now.time,
        workingMinutes,
        remarks: `${existing?.remarks ? existing.remarks + " | " : ""}${locationRemark} (Shift finished)`,
      },
    });

    return NextResponse.json({ success: true, record: toRecord(record) });
  } catch (error: any) {
    console.error("[Agent Attendance POST Error]:", error);
    return NextResponse.json({ error: "Failed to record attendance." }, { status: 500 });
  }
}
