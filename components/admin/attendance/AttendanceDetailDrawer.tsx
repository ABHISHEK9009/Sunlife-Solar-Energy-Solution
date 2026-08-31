"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Clock,
  MapPin,
  Calendar,
  User,
  History,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
} from "lucide-react";
import {
  AttendanceRecord,
  formatMinutesToHours,
} from "@/lib/attendance-utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: string;
  phone: string;
  territory: string;
}

interface AttendanceDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  member: TeamMember | null;
  onEdit: () => void;
}

export function AttendanceDetailDrawer({
  isOpen,
  onClose,
  record,
  member,
  onEdit,
}: AttendanceDetailDrawerProps) {
  if (!isOpen || !record) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-200">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-solar-deep flex items-center justify-center font-bold text-sm border border-slate-200">
                {member?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2) || "EM"}
              </div>
              <div>
                <h3 className="font-bold font-heading text-slate-900 text-base leading-tight">
                  {member?.name || "Employee"}
                </h3>
                <p className="text-xs text-slate-500">{member?.role} • {member?.category}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 text-xs">
            {/* Status & Date Pill */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Attendance Status
                </span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 inline-block">
                  {record.status}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Date Logged
                </span>
                <span className="text-xs font-bold text-slate-700 mt-0.5 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-solar-deep" />
                  <span>{record.date}</span>
                </span>
              </div>
            </div>

            {/* Time & Hours Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-solar-deep" />
                <span>Duty Timings & Working Hours</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">
                    Check-In Time
                  </span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {record.checkIn || "--"}
                  </span>
                  {record.lateMinutes > 0 && (
                    <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">
                      ⚠ Late by {record.lateMinutes} mins
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">
                    Check-Out Time
                  </span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {record.checkOut || "--"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-800 text-[10px] font-bold block uppercase">
                    Net Working Hours
                  </span>
                  <span className="text-base font-extrabold text-solar-deep mt-0.5 block">
                    {formatMinutesToHours(record.workingHoursMinutes)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">
                    Break Duration
                  </span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {record.breakMinutes || 0} minutes
                  </span>
                </div>
              </div>
            </div>

            {/* Location & Remarks */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-solar-emerald" />
                <span>Project Site & Notes</span>
              </h4>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">
                    Assigned Solar Site
                  </span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {record.location || "Narmadapuram HQ"}
                  </span>
                </div>

                {record.remarks && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 text-[10px] font-bold block uppercase">
                      Admin Remarks
                    </span>
                    <p className="text-slate-700 italic mt-0.5">
                      &ldquo;{record.remarks}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-solar-deep" />
                <span>Audit Trail & Modification History</span>
              </h4>

              <div className="space-y-2">
                {record.auditTrail && record.auditTrail.length > 0 ? (
                  record.auditTrail.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-500 font-medium">
                        <span>{log.author || "Admin"}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <div className="text-slate-800">
                        <span className="text-slate-400">{log.oldValue}</span> →{" "}
                        <span className="font-bold text-solar-deep">{log.newValue}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 text-slate-400 text-center">
                    Original system record created by {record.createdBy || "Admin"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="flex-1 py-2.5 rounded-xl bg-solar-deep hover:bg-slate-900 text-white font-bold transition-all shadow-xs cursor-pointer"
          >
            Edit Record
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
