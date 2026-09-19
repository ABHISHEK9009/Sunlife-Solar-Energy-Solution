"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Phone,
  Calendar,
  Mail,
  MapPin,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  Zap,
  MessageSquare,
  ArrowRight,
  X,
  ExternalLink,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Conversion Modal State
  const [convertLead, setConvertLead] = useState<any | null>(null);
  const [plantCapacityKw, setPlantCapacityKw] = useState("3");
  const [solarType, setSolarType] = useState("ON_GRID");
  const [conversionNotes, setConversionNotes] = useState("");
  const [converting, setConverting] = useState(false);

  // New Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Narmadapuram",
    propertyType: "Residential",
    monthlyBill: "₹3,000 - ₹5,000",
    interestedSolution: "Rooftop Solar",
    rooftopArea: "",
    message: "",
  });

  const loadRequest = useRef(0);
  const fetchLeads = async (background = false) => {
    const request = ++loadRequest.current;
    if (!background) setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (request !== loadRequest.current) return;
      if (data.success) {
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useLiveRefresh(() => fetchLeads(true), !loading);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setAddForm({
          name: "",
          phone: "",
          email: "",
          city: "Narmadapuram",
          propertyType: "Residential",
          monthlyBill: "₹3,000 - ₹5,000",
          interestedSolution: "Rooftop Solar",
          rooftopArea: "",
          message: "",
        });
        fetchLeads();
      } else {
        alert("Unable to complete the request right now. Please try again.");
      }
    } catch (err) {
      console.error("[Lead Create Error]:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads(true);
      } else {
        alert("Unable to complete the request right now. Please try again.");
      }
    } catch (err) {
      console.error("[Lead Status Update Error]:", err);
      alert("Unable to complete the request right now. Please try again.");
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete lead "${name}"?`)) return;
    try {
      const res = await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      } else {
        alert("Unable to complete the request right now. Please try again.");
      }
    } catch (err) {
      console.error("[Lead Delete Error]:", err);
      alert("Unable to complete the request right now. Please try again.");
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertLead) return;
    setConverting(true);

    try {
      const res = await fetch("/api/v1/admin/leads/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: convertLead.id,
          plantCapacityKw: parseFloat(plantCapacityKw) || 3,
          solarType,
          notes: conversionNotes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Lead successfully converted to Customer and Solar Project!");
        setConvertLead(null);
        fetchLeads();
      } else {
        alert("Unable to complete the request right now. Please try again.");
      }
    } catch (err) {
      console.error("[Lead Convert Error]:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.city && l.city.toLowerCase().includes(search.toLowerCase())) ||
      (l.interestedSolution && l.interestedSolution.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ? true : l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Customer Leads & Inquiries
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inquiries submitted across the website contact, quote forms, and referral program
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-solar-deep hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sun-amber" />
            <span>Add Lead</span>
          </button>

          <button
            onClick={() => fetchLeads()}
            disabled={loading}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <span className="px-3.5 py-2 bg-emerald-100 text-solar-deep text-xs font-bold rounded-xl">
            {leads.length} Total Records
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["ALL", "NEW", "CONTACTED", "SURVEY_SCHEDULED", "CONVERTED", "LOST"].map((st) => (
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

      {/* Leads Data Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading leads database...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No leads found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Requirement</th>
                  <th className="px-6 py-4">Monthly Bill</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {lead.name}
                      </div>
                      {lead.message && (
                        <div className="text-[11px] text-slate-400 mt-0.5 max-w-xs line-clamp-1">
                          &ldquo;{lead.message}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <a
                          href={`tel:${lead.phone}`}
                          className="font-bold text-solar-deep hover:underline flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lead.phone}</span>
                        </a>
                        {lead.email && (
                          <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[150px]">{lead.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-solar-emerald shrink-0" />
                        <span>{lead.city || "Narmadapuram"}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">
                        {lead.propertyType || "Residential"}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {lead.interestedSolution || "Rooftop Solar"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {lead.monthlyBill || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-colors ${
                          lead.status === "NEW"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : lead.status === "CONVERTED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : lead.status === "LOST"
                            ? "bg-slate-100 text-slate-600 border-slate-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="SURVEY_SCHEDULED">SURVEY SCHEDULED</option>
                        <option value="QUOTATION_SENT">QUOTATION SENT</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.status !== "CONVERTED" ? (
                          <button
                            onClick={() => {
                              setConvertLead(lead);
                              setPlantCapacityKw(lead.requestedCapacity ? String(lead.requestedCapacity) : "3");
                            }}
                            className="px-2.5 py-1.5 bg-solar-deep text-white rounded-xl text-[11px] font-bold hover:bg-solar-deep/90 flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Convert to Customer & Solar Project"
                          >
                            <Zap className="w-3 h-3 text-sun-amber" />
                            <span>Convert</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mr-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Converted</span>
                          </span>
                        )}

                        <Link
                          href={`/admin/profile/${lead.id}`}
                          title="View 360° Profile & Activity Timeline"
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-solar-deep hover:text-white text-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        <a
                          href={`tel:${lead.phone}`}
                          title="Call Lead"
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-solar-deep hover:text-white text-slate-700 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                            lead.name
                          )},%20thank%20you%20for%20contacting%20Sunlife%20Solar%20Energy%20Solution.`}
                          target="_blank"
                          rel="noreferrer"
                          title="Message on WhatsApp"
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                          title="Delete Lead"
                          className="p-1.5 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Convert Lead to Customer & Project Modal */}
      {convertLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Convert Lead to Active Project
                </h3>
                <p className="text-xs text-slate-500">
                  {convertLead.name} (+91 {convertLead.phone})
                </p>
              </div>
              <button
                onClick={() => setConvertLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConvertLead} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-slate-700 space-y-1">
                <div className="font-bold text-solar-deep flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Automated Provisioning Pipeline</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  This action creates a permanent <strong>Customer Profile</strong>, initiates an active <strong>Solar Project</strong>, schedules project timeline milestones, and opens a <strong>PM Surya Ghar Subsidy tracker</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    System Capacity (kW) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={plantCapacityKw}
                    onChange={(e) => setPlantCapacityKw(e.target.value)}
                    placeholder="3.0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Solar System Type
                  </label>
                  <select
                    value={solarType}
                    onChange={(e) => setSolarType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="ON_GRID">On-Grid (Net Metering)</option>
                    <option value="OFF_GRID">Off-Grid (Battery Storage)</option>
                    <option value="HYBRID">Hybrid (Grid + Battery)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Initial Project Notes
                </label>
                <textarea
                  rows={2}
                  value={conversionNotes}
                  onChange={(e) => setConversionNotes(e.target.value)}
                  placeholder="e.g. Quoted ₹1,85,000 for 3kW. Client agreed on 20% advance."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertLead(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-5 py-2 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-sun-amber" />
                  <span>{converting ? "Converting..." : "Provision Customer & Project"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
