"use client";

import React, { useEffect, useState } from "react";
import { FileText, Search, RefreshCw, CheckCircle2, Clock, XCircle, ArrowUpRight } from "lucide-react";

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/quotations");
      const data = await res.json();
      if (data.success) setQuotations(data.quotations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const filteredQuotations = quotations.filter((q) => {
    const s = search.toLowerCase();
    return (
      q.quotationId.toLowerCase().includes(s) ||
      q.project?.projectName.toLowerCase().includes(s) ||
      q.project?.customer?.fullName.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Versioned Quotation Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer quotation drafts, revision requests, subsidy deductions, and net contract values
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchQuotations}
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
            placeholder="Search by quote ID, customer name, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredQuotations.length} Quotations
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Quotation ID</th>
                <th className="px-5 py-3.5">Customer & Project</th>
                <th className="px-5 py-3.5">Capacity</th>
                <th className="px-5 py-3.5">Gross Cost</th>
                <th className="px-5 py-3.5">Expected Subsidy</th>
                <th className="px-5 py-3.5">Customer Net Cost</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading quotations...
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No quotation versions found.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      <div>{q.quotationId}</div>
                      <div className="text-[10px] font-sans text-slate-400">Version {q.versionNumber}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{q.project?.customer?.fullName}</div>
                      <div className="text-[11px] text-slate-500">{q.project?.projectName}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">{q.capacityKw} kW</td>
                    <td className="px-5 py-4 text-slate-700">₹{q.grossProjectCost.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 text-emerald-600 font-medium">₹{q.expectedSubsidy.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 font-bold text-solar-deep text-sm">
                      ₹{q.customerNetCost.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          q.approvalStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : q.approvalStatus === "REVISION_REQUESTED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {q.approvalStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
