"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  AttendanceRecord,
  calculateWorkingMinutes,
  formatMinutesToHours,
  calculateLateMinutes,
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
  const [memberId, setMemberId] = useState(
    initialRecord?.memberId || teamMembers[0]?.id || ""
  );
  const [date, setDate] = useState(
    initialRecord?.date || new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<AttendanceRecord["status"]>(
    initialRecord?.status || "Present"
  );
  const [checkIn, setCheckIn] = useState(initialRecord?.checkIn || "09:00 AM");
  const [checkOut, setCheckOut] = useState(initialRecord?.checkOut || "05:30 PM");
  const [breakMinutes, setBreakMinutes] = useState(
    initialRecord?.breakMinutes ?? 30
  );
  const [location, setLocation] = useState(
    initialRecord?.location || "Narmadapuram HQ"
  );
  const [remarks, setRemarks] = useState(initialRecord?.remarks || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRecord) {
      if (initialRecord.memberId) setMemberId(initialRecord.memberId);
      if (initialRecord.date) setDate(initialRecord.date);
      if (initialRecord.status) setStatus(initialRecord.status);
      if (initialRecord.checkIn) setCheckIn(initialRecord.checkIn);
      if (initialRecord.checkOut) setCheckOut(initialRecord.checkOut);
      if (typeof initialRecord.breakMinutes === "number")
        setBreakMinutes(initialRecord.breakMinutes);
      if (initialRecord.location) setLocation(initialRecord.location);
      if (initialRecord.remarks) setRemarks(initialRecord.remarks);
    }
  }, [initialRecord]);

  if (!isOpen) return null;

  // Selected member
  const selectedMember = teamMembers.find((m) => m.id === memberId);

  // Check for approved leave on this date
  const hasApprovedLeave = approvedLeaves.some(
    (l) =>
      l.memberId === memberId &&
      l.status === "Approved" &&
      date >= l.startDate &&
      date <= l.endDate
  );

  // Live Working Hours Calculation
  const isPresentType = status === "Present" || status === "Late" || status === "Half Day";
  const { valid, workingMinutes, error: timeError } = calculateWorkingMinutes(
    isPresentType ? checkIn : "",
    isPresentType ? checkOut : "",
    breakMinutes
  );

  const lateMins = calculateLateMinutes(checkIn);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isPresentType && !valid) {
      setError(timeError || "Invalid time entry.");
      return;
    }

    const nowIso = new Date().toISOString();
    const existingAudit = initialRecord?.auditTrail || [];

    const newAudit = [
      ...existingAudit,
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
        author: currentAdminUser,
        field: "Attendance Record",
        oldValue: initialRecord?.status ? `${initialRecord.status} (${initialRecord.checkIn || "N/A"})` : "New Record",
        newValue: `${status} (${checkIn} - ${checkOut})`,
      },
    ];

    const finalRecord: AttendanceRecord = {
      id: initialRecord?.id || `att_${memberId}_${date}`,
      memberId,
      date,
      checkIn: isPresentType ? checkIn : "--",
      checkOut: isPresentType ? checkOut : "--",
      breakMinutes: isPresentType ? Number(breakMinutes) || 0 : 0,
      workingHoursMinutes: isPresentType ? workingMinutes : 0,
      status,
      location: location.trim() || `${selectedMember?.territory || "Narmadapuram"} Site`,
      remarks: remarks.trim(),
      lateMinutes: lateMins,
      overtimeMinutes: Math.max(0, workingMinutes - 480),
      createdBy: initialRecord?.createdBy || currentAdminUser,
      lastUpdated: nowIso,
      auditTrail: newAudit,
    };

    onSave(finalRecord);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/logo.svg"
              alt="Sunlife Solar"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
            />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <h3 className="font-bold font-heading text-lg text-slate-900 leading-tight">
                {initialRecord?.id ? "Edit Attendance Record" : "Mark Daily Attendance"}
              </h3>
              <p className="text-xs text-slate-500">
                Configure check-in/out times, break duration, and solar site allocation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Leave Warning Alert */}
        {hasApprovedLeave && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Approved Leave Warning:</span> This employee has an approved leave request on this date. Marking them as Present will override their approved leave record.
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Employee & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Employee <span className="text-red-500">*</span>
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Attendance Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Row 2: Status & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Attendance Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AttendanceRecord["status"])
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="Present">🟢 Present (Full Day)</option>
                <option value="Late">🟡 Late Attendance (&gt;09:30 AM)</option>
                <option value="Half Day">🟠 Half Day</option>
                <option value="Absent">🔴 Absent (Unexcused)</option>
                <option value="Leave">🟣 Leave (Approved / Sick)</option>
                <option value="Holiday">🔵 Company / Public Holiday</option>
                <option value="Week Off">⚪ Week Off / Sunday</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project / Site Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Narmadapuram 5kW Rooftop Site"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Row 3: Timings (if present/late/half day) */}
          {isPresentType && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
              <div className="text-[11px] font-bold text-solar-deep uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Duty Timing & Net Hours Calculation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="text"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {lateMins > 0 && (
                    <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">
                      ⚠ {lateMins} mins after 09:30 AM
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Check-Out Time
                  </label>
                  <input
                    type="text"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    placeholder="05:30 PM"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Break Duration (Mins)
                  </label>
                  <input
                    type="number"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Number(e.target.value))}
                    placeholder="30"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Calculated Working Hours Pill */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-200">
                <span className="text-xs text-slate-600">Calculated Net Working Hours:</span>
                <span className="text-sm font-extrabold font-heading text-solar-deep">
                  {formatMinutesToHours(workingMinutes)}
                </span>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Remarks / Work Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Completed module mounting on Sector 3 roof structure"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
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
  );
}
