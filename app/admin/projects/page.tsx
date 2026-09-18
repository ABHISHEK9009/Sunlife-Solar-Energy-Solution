"use client";

import React, { useEffect, useState } from "react";
import {
  Zap,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  FileText,
  User,
  MapPin,
  Calendar,
} from "lucide-react";

const STAGES = [
  "ENQUIRY",
  "SURVEY_SCHEDULED",
  "SURVEY_COMPLETED",
  "DESIGN_PREPARED",
  "QUOTATION_PENDING",
  "QUOTATION_APPROVED",
  "ORDER_CONFIRMED",
  "DOCUMENTS_PENDING",
  "DOCUMENTS_SUBMITTED",
  "MATERIAL_PENDING",
  "MATERIAL_DISPATCHED",
  "INSTALLATION_SCHEDULED",
  "INSTALLATION_IN_PROGRESS",
  "INSTALLATION_COMPLETED",
  "NET_METERING_PENDING",
  "NET_METER_INSTALLED",
  "SUBSIDY_PROCESSING",
  "ACTIVE",
  "ON_HOLD",
  "CANCELLED",
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [customerRemarks, setCustomerRemarks] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newStatus) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/v1/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          newStatus,
          customerRemarks: customerRemarks || undefined,
          internalNotes: internalNotes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedProject(null);
        setCustomerRemarks("");
        setInternalNotes("");
        fetchProjects();
      } else {
        alert(data.error || "Failed to update project status.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.projectId.toLowerCase().includes(search.toLowerCase()) ||
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.installationAddress.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" ? true : p.projectStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Solar Installation Projects
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage plant capacity, DISCOM paperwork, installation milestones, and customer timeline triggers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <span className="px-3.5 py-2 bg-emerald-100 text-solar-deep text-xs font-bold rounded-xl">
            {projects.length} Total Projects
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by project ID, customer, plant name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["ALL", "ORDER_CONFIRMED", "INSTALLATION_IN_PROGRESS", "ACTIVE", "SUBSIDY_PROCESSING"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === st
                  ? "bg-solar-deep text-white shadow-xs font-bold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Project ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Capacity</th>
                <th className="px-5 py-3.5">Current Status</th>
                <th className="px-5 py-3.5">Timeline Events</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Loading project records...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No projects found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      <div>{p.projectId}</div>
                      <div className="text-[10px] font-sans text-slate-400 font-normal">{p.projectName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{p.customer?.fullName || "N/A"}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.customer?.primaryMobile}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
                        {p.plantCapacityKw} kW
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.solarType}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          p.projectStatus === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.projectStatus.includes("PROGRESS") || p.projectStatus.includes("SCHEDULED")
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.projectStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {p._count?.timeline || 0} Milestones Logged
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => {
                          setSelectedProject(p);
                          setNewStatus(p.projectStatus);
                        }}
                        className="px-3 py-1.5 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Update Stage</span>
                        <ArrowRight className="w-3 h-3" />
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
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Update Project Milestone Stage
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedProject.projectId} — {selectedProject.customer?.fullName}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Next Milestone Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Customer-Facing Milestone Message (Visible in Mobile App)
                </label>
                <textarea
                  rows={3}
                  value={customerRemarks}
                  onChange={(e) => setCustomerRemarks(e.target.value)}
                  placeholder="e.g. Inverter delivery verified. Installation crew will arrive on Friday 10:00 AM."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Internal Operations Note (Confidential, Never Visible in App)
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Structure supplier invoice cleared via accounts desk"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 shadow-xs"
                >
                  {updating ? "Updating..." : "Commit Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
