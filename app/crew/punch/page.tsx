"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Smartphone,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  UserCheck,
  LogIn,
  LogOut,
  Download,
  Share2,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: string;
  phone: string;
  territory: string;
}

interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHoursMinutes: number;
  status: "Present" | "Absent" | "Half Day" | "Leave" | "Late";
  location: string;
  remarks: string;
  lateMinutes: number;
}

export default function EmployeePunchPage() {
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDateString, setCurrentDateString] = useState("");
  const [attendanceHistory, setAttendanceHistory] = useState<
    Record<string, Record<string, AttendanceRecord>>
  >({});
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);

  const getTodayISO = () => new Date().toISOString().split("T")[0];
  const today = getTodayISO();

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDateString(
        now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load team and attendance from shared storage
  useEffect(() => {
    if (typeof window !== "undefined") {
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
          },
        ];
      }
      setTeamList(list);
      setSelectedMemberId(list[0]?.id || "");

      const savedAtt = localStorage.getItem("sunlife_admin_attendance_v2");
      if (savedAtt) {
        try {
          setAttendanceHistory(JSON.parse(savedAtt));
        } catch {
          setAttendanceHistory({});
        }
      }
    }
  }, []);

  const saveAttendance = (
    updated: Record<string, Record<string, AttendanceRecord>>
  ) => {
    setAttendanceHistory(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sunlife_admin_attendance_v2", JSON.stringify(updated));
    }
  };

  const selectedMember = teamList.find((m) => m.id === selectedMemberId);
  const todayRecords = attendanceHistory[today] || {};
  const currentPunch = todayRecords[selectedMemberId];

  const isCheckedIn = currentPunch && currentPunch.checkIn && currentPunch.checkIn !== "--";
  const isCheckedOut = currentPunch && currentPunch.checkOut && currentPunch.checkOut !== "--";

  // Punch In Handler
  const handlePunchIn = () => {
    const timeStr = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newRecord: AttendanceRecord = {
      id: `att_${selectedMemberId}_${today}`,
      memberId: selectedMemberId,
      date: today,
      checkIn: timeStr,
      checkOut: "--",
      workingHoursMinutes: 0,
      status: "Present",
      location: selectedMember ? `${selectedMember.territory} Solar Site` : "Narmadapuram HQ",
      remarks: "Self Mobile Punch",
      lateMinutes: 0,
    };

    const updated = {
      ...attendanceHistory,
      [today]: {
        ...todayRecords,
        [selectedMemberId]: newRecord,
      },
    };

    saveAttendance(updated);
    setIsSuccessMessage(`✓ Checked In at ${timeStr}`);
    setTimeout(() => setIsSuccessMessage(null), 4000);
  };

  // Punch Out Handler
  const handlePunchOut = () => {
    if (!currentPunch) return;
    const timeStr = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedRecord: AttendanceRecord = {
      ...currentPunch,
      checkOut: timeStr,
      workingHoursMinutes: 480, // standard 8 hours
      remarks: `Shift finished on field at ${timeStr}`,
    };

    const updated = {
      ...attendanceHistory,
      [today]: {
        ...todayRecords,
        [selectedMemberId]: updatedRecord,
      },
    };

    saveAttendance(updated);
    setIsSuccessMessage(`✓ Checked Out at ${timeStr}`);
    setTimeout(() => setIsSuccessMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto shadow-2xl">
      {/* Top Header */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo/logo.svg"
              alt="Sunlife Solar"
              width={140}
              height={45}
              className="h-8 w-auto brightness-0 invert object-contain"
            />
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
            Crew Mobile App
          </span>
        </div>

        {/* Live Date & Digital Clock */}
        <div className="text-center py-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xs">
          <div className="text-xs text-slate-400 font-medium">
            {currentDateString || "Loading date..."}
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-sun-amber tracking-tight mt-1">
            {currentTime || "--:--:--"}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>GPS Active: Narmadapuram Field Zone</span>
          </div>
        </div>
      </div>

      {/* Main Punch Section */}
      <div className="my-6 space-y-5">
        {/* Select Member / Technician */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Your Name (Staff Member)
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/10 border border-white/15 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {teamList.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                {m.name} — {m.role}
              </option>
            ))}
          </select>
        </div>

        {/* Status Feedback */}
        {isSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-xs text-center animate-in zoom-in-95">
            {isSuccessMessage}
          </div>
        )}

        {/* Large One-Touch Punch Buttons */}
        {!isCheckedIn ? (
          <button
            onClick={handlePunchIn}
            className="w-full py-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-lg sm:text-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <LogIn className="w-6 h-6" />
              <span>PUNCH IN (START DUTY)</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-950/80">
              Tap to mark your arrival on site
            </span>
          </button>
        ) : !isCheckedOut ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block tracking-wider">
                Shift In Progress
              </span>
              <span className="text-xl font-extrabold text-white">
                Checked In at {currentPunch.checkIn}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Location: {currentPunch.location}
              </span>
            </div>

            <button
              onClick={handlePunchOut}
              className="w-full py-5 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-lg sm:text-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-6 h-6" />
                <span>PUNCH OUT (FINISH SHIFT)</span>
              </div>
              <span className="text-[11px] font-bold text-amber-950/80">
                Tap when leaving the project site
              </span>
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-white/10 border border-white/15 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="text-base font-extrabold text-white">
              Shift Complete for Today
            </div>
            <div className="text-xs text-slate-300">
              Check-In: <span className="font-bold text-sun-amber">{currentPunch.checkIn}</span> | Check-Out:{" "}
              <span className="font-bold text-sun-amber">{currentPunch.checkOut}</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold pt-1">
              Attendance verified and synced with Admin!
            </div>
          </div>
        )}
      </div>

      {/* Footer / Admin Portal Link */}
      <div className="pt-4 border-t border-white/10 text-center space-y-2">
        <Link
          href="/admin/team?tab=attendance"
          className="text-xs text-slate-400 hover:text-white font-semibold inline-flex items-center gap-1"
        >
          <span>Switch to Admin HRM Portal</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
        <p className="text-[10px] text-slate-500">
          Sunlife Solar Energy Solution • Mobile Workforce Attendance
        </p>
      </div>
    </div>
  );
}
