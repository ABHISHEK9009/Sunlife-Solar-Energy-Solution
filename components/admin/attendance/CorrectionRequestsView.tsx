"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Send,
  User,
  ShieldCheck,
} from "lucide-react";
import { CorrectionRequest } from "@/lib/attendance-utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: string;
}

interface CorrectionRequestsViewProps {
  teamMembers: TeamMember[];
  correctionRequests: CorrectionRequest[];
  onApprove: (request: CorrectionRequest) => void;
  onReject: (requestId: string) => void;
  onSubmitNew: (request: Omit<CorrectionRequest, "id" | "status" | "submittedAt">) => void;
}

export function CorrectionRequestsView({
  teamMembers,
  correctionRequests,
  onApprove,
  onReject,
  onSubmitNew,
}: CorrectionRequestsViewProps) {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [memberId, setMemberId] = useState(teamMembers[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [checkIn, setCheckIn] = useState("09:00 AM");
  const [checkOut, setCheckOut] = useState("05:30 PM");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    onSubmitNew({
      memberId,
      date,
      requestedCheckIn: checkIn,
      requestedCheckOut: checkOut,
      reason: reason.trim(),
    });

    setIsSubmitOpen(false);
    setReason("");
  };

  const pendingRequests = correctionRequests.filter((r) => r.status === "Pending");
  const processedRequests = correctionRequests.filter((r) => r.status !== "Pending");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Submit Trigger */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold font-heading text-base text-slate-900">
            Attendance Correction & Missing Punch Requests
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Employees can request attendance adjustments for missed biometric punches or field duty delays.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitOpen(!isSubmitOpen)}
          className="px-4 py-2.5 bg-solar-deep hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Correction Request</span>
        </button>
      </div>

      {/* Submission Form (Collapsible) */}
      {isSubmitOpen && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-solar-deep" />
              <span>New Correction Request</span>
            </h4>
            <button
              onClick={() => setIsSubmitOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Employee
                </label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Requested Check-In
                </label>
                <input
                  type="text"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Requested Check-Out
                </label>
                <input
                  type="text"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  placeholder="05:30 PM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Reason for Correction <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Remote rooftop survey in Babai without network connectivity for mobile check-in"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-solar-deep hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Requests Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold font-heading text-sm text-slate-900 flex items-center gap-2">
            <span>Pending Review Queue</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              {pendingRequests.length} Pending
            </span>
          </h4>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Requested Timings</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Submitted On</th>
                <th className="px-6 py-3.5 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No pending correction requests awaiting approval.
                  </td>
                </tr>
              ) : (
                pendingRequests.map((req) => {
                  const member = teamMembers.find((m) => m.id === req.memberId);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {member?.name || req.memberId}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {member?.role || "Staff"}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {req.date}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-solar-deep">
                          {req.requestedCheckIn} → {req.requestedCheckOut}
                        </span>
                      </td>

                      <td className="px-6 py-4 max-w-xs text-slate-700 italic">
                        &ldquo;{req.reason}&rdquo;
                      </td>

                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {req.submittedAt}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onApprove(req)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => onReject(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Previously Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <h4 className="font-bold font-heading text-sm text-slate-900">
              Resolved Requests History
            </h4>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Requested Timings</th>
                  <th className="px-6 py-3.5">Decision</th>
                  <th className="px-6 py-3.5">Reviewed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedRequests.map((req) => {
                  const member = teamMembers.find((m) => m.id === req.memberId);

                  return (
                    <tr key={req.id} className="text-slate-600">
                      <td className="px-6 py-3 font-semibold text-slate-800">
                        {member?.name || req.memberId}
                      </td>
                      <td className="px-6 py-3">{req.date}</td>
                      <td className="px-6 py-3 font-medium">
                        {req.requestedCheckIn} - {req.requestedCheckOut}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === "Approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[11px] text-slate-400">
                        {req.reviewedBy || "Admin"} ({req.reviewedAt || ""})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
