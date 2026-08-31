"use client";

import React, { useEffect, useState } from "react";
import {
  Calculator,
  Zap,
  Clock,
  RefreshCw,
  TrendingDown,
  Sun,
  ShieldCheck,
  Building2,
  Home,
  Factory,
  MapPin,
} from "lucide-react";

export default function AdminEstimatesPage() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.success) {
        setEstimates(data.estimates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-solar-emerald uppercase tracking-wider mb-1">
            Estimation Records
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Solar Calculator Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of customer system sizing & monthly electricity bill evaluations from website visitors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEstimates}
            disabled={loading}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <span className="px-3 py-1.5 bg-emerald-50 text-solar-deep border border-emerald-200 text-xs font-bold rounded-xl">
            {estimates.length} Calculations
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-solar-deep mb-2" />
            Loading estimation records from database...
          </div>
        ) : estimates.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-solar-deep flex items-center justify-center mx-auto mb-3">
              <Calculator className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm">No calculations recorded yet.</p>
            <p className="max-w-sm mx-auto">
              When users interact with the Solar Savings Calculator on the homepage, their system sizing outputs will be logged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Property Type</th>
                  <th className="px-6 py-3.5">Monthly Power Bill</th>
                  <th className="px-6 py-3.5">Recommended Capacity</th>
                  <th className="px-6 py-3.5">Est. Annual Savings</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estimates.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 capitalize">
                      {est.propertyType || "Residential"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-solar-deep bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                        ₹{Number(est.monthlyBill).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {est.systemSizeKw} kW System
                    </td>
                    <td className="px-6 py-4 text-emerald-700 font-semibold">
                      ₹{Number(est.annualSavingsInr).toLocaleString("en-IN")} / yr
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{est.city || "Narmadapuram"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(est.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
