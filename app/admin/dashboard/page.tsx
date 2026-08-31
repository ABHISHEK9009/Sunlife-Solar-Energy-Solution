"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Zap,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Clock,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Home,
  Factory,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export default function AdminDashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
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
    fetchDashboardData();
  }, []);

  const newLeads = leads.filter((l) => l.status === "NEW");
  const contactedLeads = leads.filter((l) => l.status === "CONTACTED");
  const completedLeads = leads.filter((l) => l.status === "COMPLETED");

  const residentialCount = leads.filter((l) => (l.propertyType || "").toLowerCase().includes("res")).length;
  const commercialCount = leads.filter((l) => (l.propertyType || "").toLowerCase().includes("com")).length;
  const industrialCount = leads.filter((l) => (l.propertyType || "").toLowerCase().includes("ind")).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sun-amber text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Founder & Admin Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">
            Welcome, Rahul Kumar Bamne
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl">
            Real-time management portal for solar inquiries, rooftop surveys, and customer estimates across Central Madhya Pradesh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Data</span>
          </button>

          <Link
            href="/admin/leads"
            className="px-5 py-2.5 rounded-xl bg-sun-amber hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
          >
            <span>View All Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Total Leads */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Inquiries
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-solar-deep flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
              {loading ? "..." : leads.length}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>{newLeads.length} new awaiting review</span>
            </div>
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              New Leads
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-600">
              {loading ? "..." : newLeads.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Direct form submissions
            </div>
          </div>
        </div>

        {/* Card 3: Calculator Estimates */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Solar Estimates
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
              {loading ? "..." : estimates.length}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">
              Calculated on website
            </div>
          </div>
        </div>

        {/* Card 4: Service Territory */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Primary Hub
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base sm:text-lg font-extrabold font-heading text-slate-900 truncate">
              Narmadapuram, MP
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              Itarsi • Babai • Pipariya
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Recent Leads (7 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900">
                Recent Lead Submissions
              </h2>
              <p className="text-xs text-slate-500">
                Latest customer quote inquiries requiring follow-up
              </p>
            </div>
            <Link
              href="/admin/leads"
              className="text-xs font-bold text-solar-deep hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-solar-deep mb-2" />
              Loading inquiries...
            </div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No leads currently in the database.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {lead.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.status === "NEW"
                            ? "bg-amber-100 text-amber-800"
                            : lead.status === "CONTACTED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {lead.city || "Narmadapuram"}
                      </span>
                      <span>•</span>
                      <span>{lead.propertyType || "Residential"}</span>
                      <span>•</span>
                      <span>Bill: {lead.monthlyBill || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${lead.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-solar-deep text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-solar-deep" />
                      <span>{lead.phone}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Category Distribution & System Status (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Solution Mix Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold font-heading text-sm text-slate-900">
              Inquiry Categories
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-solar-deep flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Residential</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{residentialCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Commercial</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{commercialCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Factory className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Industrial</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{industrialCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Direct Link to Site */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white space-y-3 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-sun-amber">
              <Zap className="w-4 h-4" />
              <span>Production Live Website</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Website is running live with high conversion contact forms connected directly to this backend.
            </p>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl transition-all"
            >
              <span>Visit Live Website</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
