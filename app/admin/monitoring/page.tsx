"use client";

import React, { useEffect, useState } from "react";
import { Activity, Search, RefreshCw, Zap, Wifi, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AdminMonitoringPage() {
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/monitoring");
      const data = await res.json();
      if (data.success) setPlants(data.plants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const filtered = plants.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.plantId.toLowerCase().includes(q) ||
      p.inverterProvider.toLowerCase().includes(q) ||
      p.project?.projectName.toLowerCase().includes(q) ||
      p.project?.customer?.fullName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Solar Plant Telemetry & Generation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inverter synchronization, kWh generation readings, grid exports, and active system alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlants}
            disabled={loading}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by plant ID, inverter, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filtered.length} Monitored Plants
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Plant ID</th>
                <th className="px-5 py-3.5">Customer & Project</th>
                <th className="px-5 py-3.5">Capacity</th>
                <th className="px-5 py-3.5">Inverter Brand</th>
                <th className="px-5 py-3.5">Connection</th>
                <th className="px-5 py-3.5">Lifetime Generation</th>
                <th className="px-5 py-3.5">System Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading plant telemetry...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No connected solar inverters found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{p.plantId}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{p.project?.customer?.fullName}</div>
                      <div className="text-[10px] text-slate-500">{p.project?.projectName}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {p.project?.plantCapacityKw} kW
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{p.inverterProvider}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.inverterSerialNumber || "SN: N/A"}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <Wifi className="w-3.5 h-3.5" />
                        <span>{p.connectionStatus}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-solar-deep text-sm">
                      {p.totalGeneratedEnergyKwh.toLocaleString("en-IN")} kWh
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {p.systemHealth}
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
