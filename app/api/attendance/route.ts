import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedStatuses = new Set(["Present", "On Survey", "Half Day", "Absent", "Leave"]);

const toDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("A valid attendance date is required.");
  return new Date(`${value}T00:00:00.000Z`);
};

const toRecord = (record: any) => ({
  memberId: record.memberId,
  date: record.date.toISOString().slice(0, 10),
  status: record.status,
  checkIn: record.checkIn,
  checkOut: record.checkOut,
  workingHoursMinutes: record.workingMinutes,
  assignedSite: record.assignedSite,
  remarks: record.remarks || "",
  updatedAt: record.updatedAt.toISOString(),
});

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const records = await prisma.attendance.findMany({
      where: date ? { date: toDate(date) } : undefined,
      orderBy: [{ date: "desc" }, { memberId: "asc" }],
    });
    return NextResponse.json({ records: records.map(toRecord) });
  } catch (error) {
    console.error("Unable to load attendance:", error);
    return NextResponse.json({ error: "Unable to load attendance." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { records } = await request.json();
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Attendance records are required." }, { status: 400 });
    }

    const operations = await Promise.all(
      records.map(async (record) => {
        if (!record.memberId || !allowedStatuses.has(record.status)) {
          throw new Error("Each attendance record needs a member and valid status.");
        }
        const date = toDate(record.date);
        const existing = await prisma.attendance.findUnique({
          where: { memberId_date: { memberId: record.memberId, date } },
        });
        const data = {
          status: record.status,
          checkIn: record.status === "Absent" || record.status === "Leave" ? "--" : record.checkIn || "--",
          checkOut: record.status === "Absent" || record.status === "Leave" ? "--" : record.checkOut || "--",
          workingMinutes: Number.isFinite(record.workingHoursMinutes) ? record.workingHoursMinutes : existing?.workingMinutes || 0,
          assignedSite: record.assignedSite || "Unassigned",
          remarks: record.remarks || null,
        };
        if (existing && existing.checkIn !== "--" && data.checkIn !== existing.checkIn) {
          throw new Error("Check-in is already recorded and cannot be changed.");
        }
        if (existing && existing.checkOut !== "--" && data.checkOut !== existing.checkOut) {
          throw new Error("Check-out is already recorded and cannot be changed.");
        }
        return prisma.attendance.upsert({
          where: { memberId_date: { memberId: record.memberId, date } },
          create: { memberId: record.memberId, date, ...data },
          update: data,
        });
      })
    );
    const saved = await prisma.$transaction(operations);
    return NextResponse.json({ records: saved.map(toRecord) });
  } catch (error) {
    console.error("Unable to save attendance:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save attendance." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { memberId, action } = await request.json();
    if (!memberId || (action !== "punch-in" && action !== "punch-out")) {
      return NextResponse.json({ error: "A member and valid punch action are required." }, { status: 400 });
    }
    const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: "Team member not found." }, { status: 404 });

    const now = nowInIndia();
    const date = toDate(now.date);
    const existing = await prisma.attendance.findUnique({ where: { memberId_date: { memberId, date } } });
    if (action === "punch-out" && (!existing || existing.checkIn === "--")) {
      return NextResponse.json({ error: "Punch in before punching out." }, { status: 400 });
    }
    if (action === "punch-in" && existing && existing.checkIn !== "--") {
      return NextResponse.json({ error: "Check-in is already recorded for today." }, { status: 409 });
    }
    if (action === "punch-out" && existing && existing.checkOut !== "--") {
      return NextResponse.json({ error: "Check-out is already recorded for today." }, { status: 409 });
    }

    const workingMinutes = action === "punch-out" && existing
      ? Math.max(0, (minutesFromTime(now.time) || 0) - (minutesFromTime(existing.checkIn) || 0))
      : existing?.workingMinutes || 0;
    const record = await prisma.attendance.upsert({
      where: { memberId_date: { memberId, date } },
      create: {
        memberId, date, status: "Present", checkIn: now.time, checkOut: "--", workingMinutes: 0,
        assignedSite: `${member.territory} Solar Site`, remarks: "Self mobile punch",
      },
      update: { checkOut: now.time, workingMinutes, remarks: "Shift finished on field" },
    });
    return NextResponse.json({ record: toRecord(record) });
  } catch (error) {
    console.error("Unable to record punch:", error);
    return NextResponse.json({ error: "Unable to record punch." }, { status: 500 });
  }
}
