"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Phone,
  Calendar,
  Mail,
  MapPin,
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  Zap,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
        setEstimates(data.estimates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.city && l.city.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ? true : l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-100 pt-28 pb-12">
      <div className="fluid-container space-y-8">
        {/* Header Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider">
              Internal Lead Management
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-1">
              Sunlife Solar • Leads & Inquiries
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live submissions connected to Neon PostgreSQL database (Schema: <code>sunlife</code>)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <span className="px-3 py-1.5 bg-emerald-100 text-solar-deep text-xs font-bold rounded-xl">
              Total Leads: {leads.length}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUOTED">Quoted</option>
              <option value="WON">Won</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-700 flex items-center justify-between">
            <span>Customer Inquiries & Quote Requests</span>
            <span className="text-xs text-slate-400 font-normal">
              Showing {filteredLeads.length} of {leads.length} records
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading database records from PostgreSQL...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No lead records found.</p>
              <p className="text-xs text-slate-400">
                New quote submissions from the website will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Location & Type</th>
                    <th className="px-4 py-3">Monthly Bill</th>
                    <th className="px-4 py-3">Message / Notes</th>
                    <th className="px-4 py-3">Source / Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {lead.name}
                      </td>
                      <td className="px-4 py-3.5 space-y-0.5">
                        <a
                          href={`tel:${lead.phone}`}
                          className="font-semibold text-solar-deep hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </a>
                        {lead.email && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                            {lead.email}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{lead.city || "Narmadapuram"}</div>
                        <div className="text-[11px] text-slate-500">{lead.propertyType}</div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {lead.monthlyBill || "—"}
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px] truncate text-slate-600">
                        {lead.message || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-solar-deep">
                          {lead.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{lead.source}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
