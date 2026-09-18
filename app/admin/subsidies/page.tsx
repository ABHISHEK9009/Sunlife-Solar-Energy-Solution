"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useEffect, useState } from "react";
import { Award, Search, RefreshCw, CheckCircle2, Clock, AlertCircle, ArrowRight, X } from "lucide-react";

const SUBSIDY_STAGES = [
  "NOT_STARTED",
  "PORTAL_REGISTRATION",
  "DISCOM_APPLICATION",
  "FEASIBILITY_APPROVAL",
  "INSTALLATION",
  "INSPECTION",
  "NET_METER_INSTALLED",
  "SUBSIDY_PROCESSING",
  "SUBSIDY_APPROVED",
  "SUBSIDY_CREDITED",
  "REJECTED",
];

export default function AdminSubsidiesPage() {
  const [subsidies, setSubsidies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubsidy, setSelectedSubsidy] = useState<any | null>(null);
  const [nextStage, setNextStage] = useState("");
  const [portalRegNo, setPortalRegNo] = useState("");
  const [approvedAmt, setApprovedAmt] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadRequest = useRef(0);
  const fetchSubsidies = async (background = false) => {
    const request = ++loadRequest.current;
    if (!background) setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/subsidies");
      const data = await res.json();
      if (request !== loadRequest.current) return;
      if (data.success) setSubsidies(data.subsidies || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubsidies();
  }, []);

  useLiveRefresh(() => fetchSubsidies(true), !loading);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubsidy) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/v1/admin/subsidies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSubsidy.id,
          currentStatus: nextStage,
          portalRegistrationNumber: portalRegNo || undefined,
          approvedSubsidy: approvedAmt ? parseFloat(approvedAmt) : undefined,
          remarks: remarks || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedSubsidy(null);
        fetchSubsidies();
      } else {
        alert("Failed to update subsidy status.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setUpdating(false);
    }
  };

  const filtered = subsidies.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.subsidyRecordId.toLowerCase().includes(q) ||
      s.customer?.fullName.toLowerCase().includes(q) ||
      (s.portalRegistrationNumber && s.portalRegistrationNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            PM Surya Ghar Subsidy Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            National Solar Portal registration, DISCOM inspection status, bank verification, and direct credit tracker
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSubsidies()}
            disabled={loading}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, portal number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filtered.length} Subsidy Records
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Record ID</th>
                <th className="px-5 py-3.5">Customer & Project</th>
                <th className="px-5 py-3.5">Portal Reg Number</th>
                <th className="px-5 py-3.5">Expected Subsidy</th>
                <th className="px-5 py-3.5">Approved Amount</th>
                <th className="px-5 py-3.5">Current Stage</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading subsidy records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No subsidy records found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{s.subsidyRecordId}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{s.customer?.fullName}</div>
                      <div className="text-[10px] text-slate-500">{s.project?.projectId} ({s.project?.plantCapacityKw} kW)</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-700 font-medium">
                      {s.portalRegistrationNumber || <span className="text-slate-400 font-sans italic">Pending Registration</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-semibold">
                      ₹{s.expectedSubsidy.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-600">
                      {s.approvedSubsidy ? `₹${s.approvedSubsidy.toLocaleString("en-IN")}` : "--"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          s.currentStatus === "SUBSIDY_CREDITED"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.currentStatus === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {s.currentStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => {
                          setSelectedSubsidy(s);
                          setNextStage(s.currentStatus);
                          setPortalRegNo(s.portalRegistrationNumber || "");
                          setApprovedAmt(s.approvedSubsidy ? String(s.approvedSubsidy) : "");
                        }}
                        className="px-2.5 py-1 bg-solar-deep text-white font-semibold rounded-lg hover:bg-solar-deep/90 text-[11px] cursor-pointer"
                      >
                        Update Stage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Transition Modal */}
      {selectedSubsidy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Advance Subsidy Stage</h3>
                <p className="text-xs text-slate-500">{selectedSubsidy.subsidyRecordId} — {selectedSubsidy.customer?.fullName}</p>
              </div>
              <button
                onClick={() => setSelectedSubsidy(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Subsidy Stage *</label>
                <select
                  value={nextStage}
                  onChange={(e) => setNextStage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                >
                  {SUBSIDY_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">National Portal Registration No.</label>
                <input
                  type="text"
                  value={portalRegNo}
                  onChange={(e) => setPortalRegNo(e.target.value)}
                  placeholder="e.g. PSG-MP-2026-XXXX"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Approved Subsidy Amount (₹)</label>
                <input
                  type="number"
                  value={approvedAmt}
                  onChange={(e) => setApprovedAmt(e.target.value)}
                  placeholder="78000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Action Remarks / History Notes</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Discom physical inspection passed, net meter installed"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubsidy(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 shadow-xs"
                >
                  {updating ? "Saving..." : "Update Subsidy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
