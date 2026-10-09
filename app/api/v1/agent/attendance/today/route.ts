export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgentRequest } from "@/lib/crm/agent-auth";

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

export async function GET(req: Request) {
  const agent = await authenticateAgentRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized agent access" }, { status: 401 });
  }

  try {
    const now = nowInIndia();
    const date = toDate(now.date);

    const record = await prisma.attendance.findUnique({
      where: {
        memberId_date: {
          memberId: agent.id,
          date,
        },
      },
    });

    const hasPunchedIn = Boolean(record && record.checkIn !== "--");
    const hasPunchedOut = Boolean(record && record.checkOut !== "--");

    return NextResponse.json({
      success: true,
      today: {
        date: now.date,
        currentTime: now.time,
        hasPunchedIn,
        hasPunchedOut,
        checkIn: record?.checkIn || "--",
        checkOut: record?.checkOut || "--",
        workingMinutes: record?.workingMinutes || 0,
        assignedSite: record?.assignedSite || null,
        status: record?.status || "Not Marked",
      },
    });
  } catch (error: any) {
    console.error("[Agent Attendance Today Error]:", error);
    return NextResponse.json({ error: "Failed to fetch today's attendance." }, { status: 500 });
  }
}
