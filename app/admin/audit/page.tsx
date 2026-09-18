"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useEffect, useState } from "react";
import { ShieldAlert, Search, RefreshCw, Clock, Filter, User, ArrowRight } from "lucide-react";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");

  const loadRequest = useRef(0);
  const fetchLogs = async (background = false) => {
    const request = ++loadRequest.current;
    if (!background) setLoading(true);
    try {
      const url = entityFilter !== "ALL" ? `/api/v1/admin/audit?entityType=${entityFilter}` : "/api/v1/admin/audit";
      const res = await fetch(url);
      const data = await res.json();
      if (request !== loadRequest.current) return;
      if (data.success) setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  useLiveRefresh(() => fetchLogs(true), !loading);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.entityType.toLowerCase().includes(q) ||
      l.fieldChanged.toLowerCase().includes(q) ||
      l.actorId.toLowerCase().includes(q) ||
      (l.newValue && l.newValue.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            System Activity & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log tracking all CRM record modifications, payment reconciliations, status transitions, and user actions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLogs()}
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
            placeholder="Search audit trail by entity, actor, field..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["ALL", "SolarProject", "Customer", "Payment", "Quotation", "SubsidyRecord"].map((ent) => (
            <button
              key={ent}
              onClick={() => setEntityFilter(ent)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                entityFilter === ent
                  ? "bg-solar-deep text-white shadow-xs font-bold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {ent}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Field Changed</th>
                <th className="px-5 py-3.5">Change Value</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      <div>{l.entityType}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{l.entityId}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          l.action === "CREATE"
                            ? "bg-emerald-100 text-emerald-800"
                            : l.action === "STATUS_CHANGE"
                            ? "bg-blue-100 text-blue-800"
                            : l.action === "DELETE"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-700 font-medium">
                      {l.fieldChanged}
                    </td>
                    <td className="px-5 py-4 max-w-[240px] truncate text-slate-900">
                      {l.previousValue && (
                        <span className="text-slate-400 line-through mr-1">{l.previousValue}</span>
                      )}
                      <span className="font-semibold text-slate-900">{l.newValue || "--"}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      <div>{l.actorId}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{l.actorType}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {l.source}
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
