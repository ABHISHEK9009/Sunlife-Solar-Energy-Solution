"use client";

import React, { useEffect, useState } from "react";
import { ClipboardCheck, Search, RefreshCw, Calendar, MapPin, CheckCircle2, Clock, Plus, X } from "lucide-react";

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/surveys");
      const data = await res.json();
      if (data.success) setSurveys(data.surveys || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const filteredSurveys = surveys.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.surveyId.toLowerCase().includes(q) ||
      s.customer?.fullName.toLowerCase().includes(q) ||
      s.customer?.primaryMobile.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Site Surveys & Roof Audits
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical roof area audits, shadow analysis, orientation measurements, and engineer visits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSurveys}
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
            placeholder="Search by survey ID, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredSurveys.length} Surveys
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Survey ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Scheduled Date</th>
                <th className="px-5 py-3.5">Roof Specs</th>
                <th className="px-5 py-3.5">Recommended kW</th>
                <th className="px-5 py-3.5">Assigned Engineer</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading survey audits...
                  </td>
                </tr>
              ) : filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No site surveys found.
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{s.surveyId}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{s.customer?.fullName}</div>
                      <div className="text-[11px] text-slate-500">{s.customer?.primaryMobile}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(s.scheduledDateTime).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{s.roofType || "RCC"}</div>
                      <div className="text-[11px] text-slate-500">{s.availableRoofAreaSqFt ? `${s.availableRoofAreaSqFt} sq ft` : "Area Pending"}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-solar-deep">
                      {s.recommendedCapacityKw ? `${s.recommendedCapacityKw} kW` : "--"}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {s.surveyEngineer?.name || "Unassigned"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        {s.surveyStatus}
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
