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
  MessageSquare,
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

  const residentialCount = leads.filter((l) =>
    (l.propertyType || "").toLowerCase().includes("res")
  ).length;
  const commercialCount = leads.filter((l) =>
    (l.propertyType || "").toLowerCase().includes("com")
  ).length;
  const industrialCount = leads.filter((l) =>
    (l.propertyType || "").toLowerCase().includes("ind")
  ).length;

  const totalCategorized = residentialCount + commercialCount + industrialCount || 1;
  const resPercent = Math.round((residentialCount / totalCategorized) * 100);
  const comPercent = Math.round((commercialCount / totalCategorized) * 100);
  const indPercent = Math.round((industrialCount / totalCategorized) * 100);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Clean Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome, Rahul. Here is what is happening with Sunlife Solar leads & inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-solar-deep" : ""}`} />
            <span>Sync</span>
          </button>

          <Link
            href="/admin/leads"
            className="px-4 py-2 bg-solar-deep hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>All Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Crisp KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
              {loading ? "-" : leads.length}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {newLeads.length} new awaiting review
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              New Inquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-600">
              {loading ? "-" : newLeads.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Direct quote requests
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Calculations
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-solar-deep flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
              {loading ? "-" : estimates.length}
            </div>
            <div className="text-[11px] text-solar-deep font-semibold mt-1">
              Generated on website
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Primary Region
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-lg sm:text-xl font-bold font-heading text-slate-900 truncate">
              Narmadapuram
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              MP Central Division
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Recent Lead Submissions (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                Recent Inquiries
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest customer quote & consultation submissions
              </p>
            </div>

            <Link
              href="/admin/leads"
              className="text-xs font-bold text-solar-deep hover:underline inline-flex items-center gap-1"
            >
              <span>View All ({leads.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-14 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-solar-deep mb-2" />
              Loading database records...
            </div>
          ) : leads.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-400 space-y-1">
              <Users className="w-7 h-7 text-slate-300 mx-auto mb-1" />
              <p className="font-semibold text-slate-600">No leads recorded in database yet.</p>
              <p>When customers fill out the quote or contact forms, they will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1">
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

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2.5">
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
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-solar-deep text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-solar-deep" />
                      <span>{lead.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Category Distribution & Quick Links (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Solution Mix Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold font-heading text-sm text-slate-900">
              Inquiry Categories
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>Residential Rooftop</span>
                  <span className="font-bold text-slate-900">{residentialCount}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-solar-emerald rounded-full transition-all"
                    style={{ width: `${resPercent || 15}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>Commercial Systems</span>
                  <span className="font-bold text-slate-900">{commercialCount}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${comPercent || 10}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>Industrial & Shed EPC</span>
                  <span className="font-bold text-slate-900">{industrialCount}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${indPercent || 5}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Area Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold font-heading text-sm text-slate-900">
              Service Network
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Target operational districts for site surveys and rooftop installations:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-solar-deep font-semibold border border-emerald-200/60">
                Narmadapuram (HQ)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                Itarsi
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                Pipariya
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                Babai
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                Seoni Malwa
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                Bhopal Region
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
