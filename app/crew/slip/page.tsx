"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  User,
  Users,
  ImageIcon,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: "Engineer" | "Fitter" | "Electrician" | "Survey" | "Management";
  phone: string;
  territory: string;
  status: string;
  skills: string[];
  joinedYear: string;
  monthlySalary?: number;
}

interface AttendanceRecord {
  memberId: string;
  status: "Present" | "On Survey" | "Half Day" | "Absent" | "Leave";
  checkIn: string;
  checkOut: string;
  assignedSite: string;
  remarks?: string;
}

function SlipContent() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get("id") || "owner-1";
  const monthParam = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const [member, setMember] = useState<TeamMember | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, Record<string, AttendanceRecord>>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load Team Roster
      const savedTeam = localStorage.getItem("sunlife_admin_team_roster");
      let list: TeamMember[] = [];
      if (savedTeam) {
        try {
          list = JSON.parse(savedTeam);
        } catch {
          list = [];
        }
      }
      if (list.length === 0) {
        list = [
          {
            id: "owner-1",
            name: siteConfig.owner.name,
            role: "Founder & Lead Solar Specialist",
            category: "Management",
            phone: siteConfig.contact.phoneClean,
            territory: `${siteConfig.contact.address.city}, MP`,
            status: "Available",
            skills: ["Solar EPC", "DISCOM Liaison", "System Sizing"],
            joinedYear: "2021",
          },
        ];
      }

      const found = list.find((m) => m.id === memberId) || list[0];
      setMember(found);

      // Load Attendance History
      const savedAtt = localStorage.getItem("sunlife_attendance_database_v3");
      if (savedAtt) {
        try {
          setAttendanceHistory(JSON.parse(savedAtt));
        } catch {
          setAttendanceHistory({});
        }
      }

      setIsLoaded(true);
    }
  }, [memberId]);

  if (!isLoaded || !member) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            Loading Verified Attendance Slip...
          </p>
        </div>
      </div>
    );
  }

  const [yearStr, monthStr] = monthParam.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthNameFormatted = new Date(year, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  let present = 0;
  let onSurvey = 0;
  let halfDay = 0;
  let absent = 0;
  let leave = 0;

  const dayBreakdown: {
    day: number;
    dateISO: string;
    formattedDate: string;
    status: string;
    checkIn: string;
    checkOut: string;
    assignedSite: string;
  }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateISO = `${yearStr}-${monthStr}-${String(d).padStart(2, "0")}`;
    const dayDate = new Date(year, month - 1, d);
    const formattedDate = dayDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    const dayMap = attendanceHistory[dateISO] || {};
    const rec = dayMap[member.id];

    if (rec) {
      if (rec.status === "Present") present++;
      else if (rec.status === "On Survey") onSurvey++;
      else if (rec.status === "Half Day") halfDay++;
      else if (rec.status === "Absent") absent++;
      else if (rec.status === "Leave") leave++;

      dayBreakdown.push({
        day: d,
        dateISO,
        formattedDate,
        status: rec.status,
        checkIn: rec.checkIn || "--",
        checkOut: rec.checkOut || "--",
        assignedSite: rec.assignedSite || "Solar Installation Site",
      });
    } else {
      const isSunday = dayDate.getDay() === 0;
      dayBreakdown.push({
        day: d,
        dateISO,
        formattedDate,
        status: isSunday ? "Sunday" : "--",
        checkIn: "--",
        checkOut: "--",
        assignedSite: isSunday ? "Weekly Off" : "--",
      });
    }
  }

  const totalLogged = present + onSurvey + halfDay + absent + leave;
  const verifiedPayableDays = present + onSurvey + halfDay * 0.5;
  const attendancePercentage =
    totalLogged > 0
      ? (((present + onSurvey + halfDay * 0.5) / totalLogged) * 100).toFixed(1)
      : "100.0";

  const handleDownloadPNG = async () => {
    const element = document.getElementById("public-attendance-slip");
    if (!element) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const cleanName = member.name.replace(/\s+/g, "_");
      link.href = image;
      link.download = `Sunlife_Attendance_Slip_${cleanName}_${monthParam}.png`;
      link.click();
    } catch (err) {
      console.error("Download slip error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <Link
            href="/crew/punch"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-solar-deep transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Mobile Punch Portal</span>
          </Link>

          <button
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="px-4 py-2 bg-solar-deep hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-emerald-300" />
            )}
            <span>Download Slip (PNG)</span>
          </button>
        </div>

        {/* Printable Attendance Slip */}
        <div
          id="public-attendance-slip"
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/logo.png"
                alt="Sunlife Solar"
                className="h-10 w-auto object-contain shrink-0"
                crossOrigin="anonymous"
              />
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div>
                <h1 className="font-bold font-heading text-lg text-slate-900 leading-tight">
                  Verified Monthly Attendance Slip
                </h1>
                <p className="text-xs text-slate-500">
                  {siteConfig.name} • Period: <span className="font-bold text-slate-900">{monthNameFormatted}</span>
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-solar-deep border border-emerald-200 rounded-xl font-extrabold text-xs self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-solar-emerald" />
              <span>Official HRM Verified</span>
            </div>
          </div>

          {/* Staff Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Staff Name</span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{member.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{member.role}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{member.category}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
              <span className="font-bold text-solar-deep mt-0.5 block">{member.phone}</span>
            </div>
          </div>

          {/* 6 Monthly Stats KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                Present (Full)
              </span>
              <div className="text-2xl font-extrabold text-solar-deep mt-1">
                {present} <span className="text-xs font-medium">Days</span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">
                On Survey
              </span>
              <div className="text-2xl font-extrabold text-amber-900 mt-1">
                {onSurvey} <span className="text-xs font-medium">Days</span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">
                Half Days
              </span>
              <div className="text-2xl font-extrabold text-amber-900 mt-1">
                {halfDay} <span className="text-xs font-medium">Days</span>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">
                Absent Days
              </span>
              <div className="text-2xl font-extrabold text-rose-900 mt-1">
                {absent} <span className="text-xs font-medium">Days</span>
              </div>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-purple-800 block">
                Leave Days
              </span>
              <div className="text-2xl font-extrabold text-purple-900 mt-1">
                {leave} <span className="text-xs font-medium">Days</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-solar-deep block">
                Payable Days
              </span>
              <div className="text-2xl font-extrabold text-solar-deep mt-1">
                {verifiedPayableDays} <span className="text-xs font-medium">Days</span>
              </div>
            </div>
          </div>

          {/* Calendar Log Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold font-heading text-sm text-slate-900 uppercase tracking-wider">
                Day-by-Day Attendance Log ({monthNameFormatted})
              </h2>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Score: {attendancePercentage}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {dayBreakdown.map((item) => {
                const isPresent = item.status === "Present" || item.status === "On Survey";
                const isHalf = item.status === "Half Day";
                const isAbsent = item.status === "Absent";
                const isLeave = item.status === "Leave";
                const isSunday = item.status === "Sunday";

                return (
                  <div
                    key={item.day}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isPresent
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        : isHalf
                        ? "bg-amber-50/80 border-amber-200 text-amber-900"
                        : isAbsent
                        ? "bg-rose-50/80 border-rose-200 text-rose-900 font-bold"
                        : isLeave
                        ? "bg-purple-50/80 border-purple-200 text-purple-900"
                        : isSunday
                        ? "bg-slate-100/80 border-slate-200 text-slate-500"
                        : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    <span className="text-xs font-extrabold block">Day {item.day}</span>
                    <span className="text-[10px] font-extrabold uppercase block mt-1">
                      {item.status}
                    </span>
                    {item.checkIn && item.checkIn !== "--" ? (
                      <span className="text-[10px] text-slate-700 block mt-1 font-semibold">
                        In: {item.checkIn}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block mt-1">--</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slip Footer Branding */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
            <div>
              Sunlife Solar Energy Solution • Employee Workforce Portal
            </div>
            <div>
              Verified on: {new Date().toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicSlipPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <SlipContent />
    </Suspense>
  );
}
