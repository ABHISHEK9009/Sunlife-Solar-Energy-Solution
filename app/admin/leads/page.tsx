"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  LogOut,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export default function AdminLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("sunlife_admin_auth");
      if (auth !== "true") {
        router.replace("/admin/login");
        return;
      }
      setAuthenticated(true);
      fetchLeads();
    }
  }, [router]);

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

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sunlife_admin_auth");
      localStorage.removeItem("sunlife_admin_user");
    }
    router.replace("/admin/login");
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.city && l.city.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ? true : l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-sm">
        Verifying admin session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pt-28 pb-12">
      <div className="site-container space-y-8">
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

          <div className="flex flex-wrap items-center gap-3">
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

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "NEW", "CONTACTED", "SURVEY_SCHEDULED", "COMPLETED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === st
                    ? "bg-solar-deep text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-solar-deep" />
              <span>Customer Quote & Consultation Inquiries</span>
            </h2>
            <span className="text-xs text-slate-400">
              Showing {filteredLeads.length} record(s)
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-solar-emerald mb-2" />
              Loading records from PostgreSQL database...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              No leads found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3">Customer Name</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Requirement</th>
                    <th className="px-6 py-3">Monthly Bill</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {lead.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href={`tel:${lead.phone}`}
                            className="font-medium text-solar-deep hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {lead.phone}
                          </a>
                          {lead.email && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {lead.city || "Narmadapuram"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">
                          {lead.propertyType || "Residential"} • {lead.interestedSolution || "Rooftop"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {lead.monthlyBill || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            lead.status === "NEW"
                              ? "bg-emerald-100 text-emerald-800"
                              : lead.status === "CONTACTED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {lead.status}
                        </span>
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
