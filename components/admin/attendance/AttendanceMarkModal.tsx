"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Zap,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  AttendanceRecord,
  LeaveRecord,
} from "@/lib/attendance-utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: string;
  territory: string;
  phone: string;
}

interface AttendanceMarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  initialRecord?: Partial<AttendanceRecord> | null;
  onSave: (record: AttendanceRecord) => void;
  approvedLeaves?: LeaveRecord[];
  currentAdminUser?: string;
}

export function AttendanceMarkModal({
  isOpen,
  onClose,
  teamMembers,
  initialRecord,
  onSave,
  approvedLeaves = [],
  currentAdminUser = "Rahul Kumar Bamne (Admin)",
}: AttendanceMarkModalProps) {
  const getTodayISO = () => new Date().toISOString().split("T")[0];
  const todayISO = getTodayISO();

  const [memberId, setMemberId] = useState(
    initialRecord?.memberId || teamMembers[0]?.id || ""
  );
  // Strictly locked to Today's date (tamper-proof)
  const date = todayISO;

  const [status, setStatus] = useState<AttendanceRecord["status"]>(
    initialRecord?.status || "Present"
  );
  const [checkIn, setCheckIn] = useState(initialRecord?.checkIn || "--");
  const [checkOut, setCheckOut] = useState(initialRecord?.checkOut || "--");
  const [location, setLocation] = useState(
    initialRecord?.location || "Narmadapuram HQ"
  );
  const [remarks, setRemarks] = useState(initialRecord?.remarks || "");
  const [liveClock, setLiveClock] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setLiveClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialRecord) {
      if (initialRecord.memberId) setMemberId(initialRecord.memberId);
      if (initialRecord.status) setStatus(initialRecord.status);
      if (initialRecord.checkIn) setCheckIn(initialRecord.checkIn);
      if (initialRecord.checkOut) setCheckOut(initialRecord.checkOut);
      if (initialRecord.location) setLocation(initialRecord.location);
      if (initialRecord.remarks) setRemarks(initialRecord.remarks);
    }
  }, [initialRecord]);

  if (!isOpen) return null;

  const selectedMember = teamMembers.find((m) => m.id === memberId);

  const handlePunchIn = () => {
    const nowTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setCheckIn(nowTime);
    if (status === "Absent" || status === "Leave") {
      setStatus("Present");
    }
  };

  const handlePunchOut = () => {
    const nowTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setCheckOut(nowTime);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordToSave: AttendanceRecord = {
      id: initialRecord?.id || `${memberId}_${date}`,
      memberId,
      date,
      status,
      checkIn: status === "Absent" || status === "Leave" ? "--" : checkIn,
      checkOut: status === "Absent" || status === "Leave" ? "--" : checkOut,
      breakMinutes: 0,
      workingHoursMinutes: 480,
      lateMinutes: 0,
      overtimeMinutes: 0,
      location: location.trim() || `${selectedMember?.territory || "HQ"} Site`,
      remarks: remarks.trim(),
      createdBy: currentAdminUser,
      lastUpdated: new Date().toISOString(),
      auditTrail: [],
    };

    onSave(recordToSave);
    onClose();
  };

  return typeof document !== "undefined"
    ? createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo/logo.svg"
                  alt="Sunlife Solar"
                  width={130}
                  height={38}
                  className="h-7 w-auto object-contain"
                />
                <div className="h-5 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <h3 className="font-bold font-heading text-base text-slate-900 leading-tight">
                    Duty Punch & Attendance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedMember?.name || "Staff Member"} (
                    {selectedMember?.role || "Technician"})
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Locked Date & Live Clock Banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Attendance Date (Auto-Locked Today)
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                    {new Date().toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Live Clock
                  </span>
                  <span className="text-xs font-mono font-bold text-solar-deep mt-0.5 block">
                    {liveClock}
                  </span>
                </div>
              </div>

              {/* Real-Time Punch In / Punch Out Buttons */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="text-[11px] font-bold text-solar-deep uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-solar-emerald" />
                  <span>Real-Time Time Capture (Punch)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Punch In */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={handlePunchIn}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>PUNCH IN</span>
                    </button>
                    <div className="text-center text-[11px] text-slate-600 font-semibold pt-1">
                      {checkIn && checkIn !== "--" ? (
                        <span className="text-emerald-700 font-bold">
                          ✓ {checkIn}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not Punched</span>
                      )}
                    </div>
                  </div>

                  {/* Punch Out */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={handlePunchOut}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>PUNCH OUT</span>
                    </button>
                    <div className="text-center text-[11px] text-slate-600 font-semibold pt-1">
                      {checkOut && checkOut !== "--" ? (
                        <span className="text-sun-amber font-bold">
                          ✓ {checkOut}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not Punched</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Buttons */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Duty Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: "Present", label: "🟢 Present (Full Day)" },
                    { key: "On Survey", label: "🟡 On Site Survey" },
                    { key: "Half Day", label: "🟠 Half Day" },
                    { key: "Absent", label: "🔴 Mark Absent" },
                    { key: "Leave", label: "🟣 On Leave" },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => {
                        setStatus(st.key as AttendanceRecord["status"]);
                        if (st.key === "Absent" || st.key === "Leave") {
                          setCheckIn("--");
                          setCheckOut("--");
                        }
                      }}
                      className={`p-2 rounded-xl font-bold text-left transition-all border cursor-pointer ${
                        status === st.key
                          ? "bg-solar-deep text-white border-solar-deep shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Project Site / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Narmadapuram 5kW Rooftop Site"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Work Notes / Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Structure erection and DC cabling completed"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-solar-deep hover:bg-slate-900 text-white font-bold cursor-pointer transition-all shadow-md shadow-emerald-950/15"
                >
                  Save Attendance Record
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;
}
