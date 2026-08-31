"use client";

import React, { useState } from "react";
import {
  Calendar,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Users,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import {
  AttendanceRecord,
  getDaysArrayForMonth,
  isSundayDate,
  getPublicHolidayName,
  formatMinutesToHours,
} from "@/lib/attendance-utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: string;
  territory: string;
}

interface MonthlyMatrixViewProps {
  teamMembers: TeamMember[];
  attendanceHistory: Record<string, Record<string, AttendanceRecord>>;
  onSelectCell?: (memberId: string, date: string) => void;
}

export function MonthlyMatrixView({
  teamMembers,
  attendanceHistory,
  onSelectCell,
}: MonthlyMatrixViewProps) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // 0-indexed

  const daysInMonth = getDaysArrayForMonth(selectedYear, selectedMonth);
  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Helper to determine status code for a member on a specific date
  const getDayStatus = (memberId: string, dateStr: string) => {
    const isSun = isSundayDate(dateStr);
    const holiday = getPublicHolidayName(dateStr);
    const dayRecord = attendanceHistory[dateStr]?.[memberId];

    if (dayRecord) {
      if (dayRecord.status === "Present") return { code: "P", label: "Present", color: "bg-emerald-500 text-white" };
      if (dayRecord.status === "Late") return { code: "L8", label: "Late", color: "bg-amber-400 text-slate-950 font-bold" };
      if (dayRecord.status === "Half Day") return { code: "H", label: "Half Day", color: "bg-orange-500 text-white" };
      if (dayRecord.status === "Leave") return { code: "L", label: "Leave", color: "bg-purple-600 text-white" };
      if (dayRecord.status === "Absent") return { code: "A", label: "Absent", color: "bg-red-500 text-white" };
      if (dayRecord.status === "Holiday") return { code: "HD", label: "Holiday", color: "bg-blue-600 text-white" };
      if (dayRecord.status === "Week Off") return { code: "WO", label: "Week Off", color: "bg-slate-300 text-slate-700" };
    }

    if (holiday) return { code: "HD", label: holiday, color: "bg-blue-100 text-blue-800 font-bold" };
    if (isSun) return { code: "WO", label: "Week Off", color: "bg-slate-100 text-slate-500" };

    // Default unrecorded past/future
    return { code: "-", label: "Unrecorded", color: "bg-slate-50 text-slate-300" };
  };

  // Calculate monthly stats for an employee
  const calculateMemberMonthlyStats = (memberId: string) => {
    let present = 0;
    let halfDays = 0;
    let late = 0;
    let leaves = 0;
    let absent = 0;
    let totalMinutes = 0;

    daysInMonth.forEach((dateStr) => {
      const record = attendanceHistory[dateStr]?.[memberId];
      if (record) {
        if (record.status === "Present") {
          present += 1;
          totalMinutes += record.workingHoursMinutes || 480;
        } else if (record.status === "Late") {
          present += 1;
          late += 1;
          totalMinutes += record.workingHoursMinutes || 480;
        } else if (record.status === "Half Day") {
          halfDays += 1;
          totalMinutes += record.workingHoursMinutes || 240;
        } else if (record.status === "Leave") {
          leaves += 1;
        } else if (record.status === "Absent") {
          absent += 1;
        }
      }
    });

    const workingDays = daysInMonth.filter((d) => !isSundayDate(d) && !getPublicHolidayName(d)).length;
    const effectivePresent = present + halfDays * 0.5;
    const percentage = workingDays > 0 ? Math.min(100, Math.round((effectivePresent / workingDays) * 100)) : 100;

    return {
      present,
      halfDays,
      late,
      leaves,
      absent,
      totalMinutes,
      percentage,
    };
  };

  // Download Monthly Sheet as CSV
  const handleExportMonthlyCSV = () => {
    let csv = `SUNLIFE SOLAR ENERGY SOLUTION - MONTHLY ATTENDANCE MATRIX (${monthName.toUpperCase()})\n\n`;

    // Header Row: Employee, Role, 1..31, Present, Half Day, Leave, Absent, Hours, Att %
    const dayNumbers = daysInMonth.map((d) => d.split("-")[2]);
    csv += `Employee,Role,Department,${dayNumbers.join(",")},Present Days,Half Days,Leaves,Absent,Total Hours,Attendance %\n`;

    teamMembers.forEach((m) => {
      const stats = calculateMemberMonthlyStats(m.id);
      const dayCodes = daysInMonth.map((d) => `"${getDayStatus(m.id, d).code}"`);
      const row = [
        `"${m.name}"`,
        `"${m.role}"`,
        `"${m.category}"`,
        ...dayCodes,
        stats.present,
        stats.halfDays,
        stats.leaves,
        stats.absent,
        `"${formatMinutesToHours(stats.totalMinutes)}"`,
        `"${stats.percentage}%"`,
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Sunlife_Solar_Monthly_Attendance_${selectedYear}_${selectedMonth + 1}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Controls & Month Switcher */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Picker Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-extrabold text-slate-900 min-w-[140px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline-block">
            {daysInMonth.length} Calendar Days
          </span>
        </div>

        {/* Legend & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Legend Pills */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">P</span> Present
            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 font-bold ml-1">L8</span> Late
            <span className="px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold ml-1">H</span> Half Day
            <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold ml-1">L</span> Leave
            <span className="px-1.5 py-0.5 rounded bg-red-500 text-white font-bold ml-1">A</span> Absent
            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold ml-1">HD</span> Holiday
            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold ml-1">WO</span> Week Off
          </div>

          <button
            onClick={handleExportMonthlyCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Monthly Sheet</span>
          </button>
        </div>
      </div>

      {/* Monthly Attendance Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto w-full max-h-[600px] overflow-y-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[10px] text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-4 py-3 text-left sticky left-0 bg-slate-50 z-20 min-w-[160px] border-r border-slate-200">
                  Staff Member
                </th>
                {daysInMonth.map((dateStr) => {
                  const dayNum = parseInt(dateStr.split("-")[2], 10);
                  const isSun = isSundayDate(dateStr);
                  const isHol = !!getPublicHolidayName(dateStr);

                  return (
                    <th
                      key={dateStr}
                      className={`px-1.5 py-3 min-w-[32px] border-r border-slate-100 ${
                        isSun
                          ? "bg-slate-100/90 text-slate-600 font-bold"
                          : isHol
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : ""
                      }`}
                    >
                      <span>{dayNum}</span>
                      <span className="block text-[8px] font-normal opacity-70">
                        {new Date(dateStr).toLocaleDateString("en-US", { weekday: "narrow" })}
                      </span>
                    </th>
                  );
                })}
                <th className="px-3 py-3 bg-emerald-50 text-solar-deep font-bold border-l border-slate-200 min-w-[60px]">
                  P
                </th>
                <th className="px-3 py-3 bg-orange-50 text-orange-800 font-bold min-w-[60px]">
                  HD
                </th>
                <th className="px-3 py-3 bg-purple-50 text-purple-800 font-bold min-w-[60px]">
                  L
                </th>
                <th className="px-3 py-3 bg-red-50 text-red-800 font-bold min-w-[60px]">
                  A
                </th>
                <th className="px-3 py-3 bg-slate-50 text-slate-900 font-bold min-w-[75px]">
                  Hours
                </th>
                <th className="px-3 py-3 bg-emerald-50 text-solar-deep font-bold min-w-[70px]">
                  Att %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.map((member) => {
                const stats = calculateMemberMonthlyStats(member.id);

                return (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Member Info Sticky Left */}
                    <td className="px-4 py-3 text-left sticky left-0 bg-white z-10 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                      <div className="text-xs">{member.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {member.category}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {daysInMonth.map((dateStr) => {
                      const { code, color, label } = getDayStatus(member.id, dateStr);

                      return (
                        <td
                          key={dateStr}
                          onClick={() => onSelectCell && onSelectCell(member.id, dateStr)}
                          title={`${member.name} - ${dateStr}: ${label}`}
                          className="p-1 border-r border-slate-100 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <span
                            className={`w-6 h-6 rounded-md inline-flex items-center justify-center text-[10px] font-bold ${color}`}
                          >
                            {code}
                          </span>
                        </td>
                      );
                    })}

                    {/* Summary Columns */}
                    <td className="px-2 py-3 font-bold text-solar-deep bg-emerald-50/40 border-l border-slate-200">
                      {stats.present}
                    </td>
                    <td className="px-2 py-3 font-bold text-orange-700 bg-orange-50/40">
                      {stats.halfDays}
                    </td>
                    <td className="px-2 py-3 font-bold text-purple-700 bg-purple-50/40">
                      {stats.leaves}
                    </td>
                    <td className="px-2 py-3 font-bold text-red-600 bg-red-50/40">
                      {stats.absent}
                    </td>
                    <td className="px-2 py-3 font-extrabold text-slate-800">
                      {formatMinutesToHours(stats.totalMinutes)}
                    </td>
                    <td className="px-2 py-3 font-extrabold text-xs text-solar-deep bg-slate-50">
                      {stats.percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
