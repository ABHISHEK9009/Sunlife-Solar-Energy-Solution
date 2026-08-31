export interface AuditLog {
  id: string;
  timestamp: string;
  author: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM AM/PM or HH:MM
  checkOut: string; // HH:MM AM/PM or HH:MM
  breakMinutes: number;
  workingHoursMinutes: number;
  status:
    | "Present"
    | "Absent"
    | "Half Day"
    | "Leave"
    | "Late"
    | "Holiday"
    | "Week Off"
    | "Pending";
  location: string;
  remarks: string;
  lateMinutes: number;
  overtimeMinutes: number;
  createdBy: string;
  lastUpdated: string;
  auditTrail: AuditLog[];
}

export interface CorrectionRequest {
  id: string;
  memberId: string;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface LeaveRecord {
  id: string;
  memberId: string;
  startDate: string;
  endDate: string;
  type: "Casual" | "Sick" | "Paid" | "Unpaid";
  status: "Approved" | "Pending" | "Rejected";
  reason: string;
}

export const ORG_CONFIG = {
  expectedCheckIn: "09:30 AM",
  standardWorkHoursMinutes: 480, // 8 hours
  halfDayThresholdMinutes: 240, // 4 hours
  holidays: [
    { date: "2026-01-26", name: "Republic Day" },
    { date: "2026-03-04", name: "Holi" },
    { date: "2026-08-15", name: "Independence Day" },
    { date: "2026-10-02", name: "Gandhi Jayanti" },
    { date: "2026-10-20", name: "Dussehra" },
    { date: "2026-11-08", name: "Diwali" },
  ],
};

// Convert "09:30 AM" or "17:45" to total minutes from midnight
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || !timeStr.trim()) return null;
  const clean = timeStr.trim();

  // Check if has AM/PM
  const is12Hour = /am|pm/i.test(clean);
  if (is12Hour) {
    const parts = clean.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (!parts) return null;
    let hours = parseInt(parts[1], 10);
    const minutes = parseInt(parts[2], 10);
    const meridiem = parts[3].toLowerCase();

    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // 24 Hour format HH:MM
  const parts = clean.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  }

  return null;
}

export function formatMinutesToHours(minutes: number): string {
  if (!minutes || minutes <= 0) return "0h 00m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m < 10 ? "0" : ""}${m}m`;
}

export function calculateWorkingMinutes(
  checkIn: string,
  checkOut: string,
  breakMinutes: number = 0
): { valid: boolean; workingMinutes: number; error?: string } {
  const inMin = parseTimeToMinutes(checkIn);
  const outMin = parseTimeToMinutes(checkOut);

  if (inMin === null || outMin === null) {
    return { valid: true, workingMinutes: 0 };
  }

  if (outMin < inMin) {
    return {
      valid: false,
      workingMinutes: 0,
      error: "Check-out time cannot be earlier than check-in time.",
    };
  }

  const rawMinutes = outMin - inMin;
  const netMinutes = Math.max(0, rawMinutes - (breakMinutes || 0));
  return { valid: true, workingMinutes: netMinutes };
}

export function calculateLateMinutes(checkIn: string, expected = ORG_CONFIG.expectedCheckIn): number {
  const actualMin = parseTimeToMinutes(checkIn);
  const expectedMin = parseTimeToMinutes(expected);
  if (actualMin === null || expectedMin === null) return 0;
  return Math.max(0, actualMin - expectedMin);
}

export function isSundayDate(dateString: string): boolean {
  const d = new Date(dateString);
  return d.getDay() === 0;
}

export function getPublicHolidayName(dateString: string): string | null {
  const match = ORG_CONFIG.holidays.find((h) => h.date === dateString);
  return match ? match.name : null;
}

export function getDaysArrayForMonth(year: number, monthZeroIndexed: number): string[] {
  const date = new Date(year, monthZeroIndexed, 1);
  const days: string[] = [];
  while (date.getMonth() === monthZeroIndexed) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${d}`);
    date.setDate(date.getDate() + 1);
  }
  return days;
}
