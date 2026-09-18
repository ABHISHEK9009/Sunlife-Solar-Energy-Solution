"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Zap,
  TrendingUp,
  MapPin,
  Phone,
  Clock,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Award,
  Headphones,
  FolderLock,
  ClipboardCheck,
  FileText,
  Gift,
  Plus,
  ExternalLink,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [subsidiesCount, setSubsidiesCount] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequest = useRef(0);
  const fetchDashboardData = async (background = false) => {
    const request = ++loadRequest.current;
    if (!background) setLoading(true);
    try {
      // Parallel fetch from CRM endpoints
      const [leadsRes, custRes, prjRes, subRes, tckRes, auditRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/v1/admin/customers"),
        fetch("/api/v1/admin/projects"),
        fetch("/api/v1/admin/subsidies"),
        fetch("/api/v1/admin/tickets"),
        fetch("/api/v1/admin/audit"),
      ]);

      const [leadsData, custData, prjData, subData, tckData, auditData] = await Promise.all([
        leadsRes.json(),
        custRes.json(),
        prjRes.json(),
        subRes.json(),
        tckRes.json(),
        auditRes.json(),
      ]);

      if (request !== loadRequest.current) return;
      if (leadsData.success) setLeads(leadsData.leads || []);
      if (custData.success) setCustomersCount(custData.customers?.length || 0);
      if (prjData.success) setProjects(prjData.projects || []);
      if (subData.success) setSubsidiesCount(subData.subsidies?.length || 0);
      if (tckData.success) setTicketsCount(tckData.tickets?.length || 0);
      if (auditData.success) setRecentLogs((auditData.logs || []).slice(0, 5));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useLiveRefresh(() => fetchDashboardData(true), !loading);

  const activeProjectsCount = projects.filter(
    (p) => p.projectStatus !== "CANCELLED" && p.projectStatus !== "ENQUIRY"
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Clean Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Solar CRM Command Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time operations center for installations, customers, PM Surya Ghar subsidies, and mobile telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchDashboardData()}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-solar-deep" : ""}`} />
            <span>Sync All</span>
          </button>

          <Link
            href="/admin/projects"
            className="px-4 py-2 bg-solar-deep hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-sun-amber" />
            <span>Solar Projects</span>
          </Link>
        </div>
      </div>

      {/* Core Operational KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <Link
          href="/admin/customers"
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Clients</div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-2">
            {customersCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Registered Customers</span>
          </div>
        </Link>

        <Link
          href="/admin/projects"
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Installations</div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-2">
            {activeProjectsCount}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Active Plant Workflows</span>
          </div>
        </Link>

        <Link
          href="/admin/subsidies"
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Subsidies</div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-2">
            {subsidiesCount}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
            <span>PM Surya Ghar Portal</span>
          </div>
        </Link>

        <Link
          href="/admin/tickets"
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Support</div>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-2">
            {ticketsCount}
          </div>
          <div className="text-[11px] text-purple-700 font-semibold mt-1 flex items-center gap-1">
            <span>Maintenance Tickets</span>
          </div>
        </Link>
      </div>

      {/* Quick Launchpad to All 18 CRM Modules */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-heading text-slate-900">CRM Operational Hub</h2>
            <p className="text-xs text-slate-500 mt-0.5">Quick access to manage all aspects of client solar journeys</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <Link
            href="/admin/surveys"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 text-slate-700 hover:text-solar-deep transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-bold">Site Surveys</span>
          </Link>

          <Link
            href="/admin/quotations"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 text-slate-700 hover:text-solar-deep transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-bold">Quotations</span>
          </Link>

          <Link
            href="/admin/documents"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 text-slate-700 hover:text-solar-deep transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <FolderLock className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-bold">Documents</span>
          </Link>

          <Link
            href="/admin/payments"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 text-slate-700 hover:text-solar-deep transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-bold">Payments</span>
          </Link>

          <Link
            href="/admin/monitoring"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 text-slate-700 hover:text-solar-deep transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-bold">Monitoring</span>
          </Link>

          <Link
            href="/admin/referrals"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 text-slate-700 hover:text-solar-deep transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Gift className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-bold">Referrals</span>
          </Link>
        </div>
      </div>

      {/* Two Columns: Recent Projects & Security Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Solar Projects */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Active Solar Projects</h3>
            <Link href="/admin/projects" className="text-xs font-bold text-solar-deep hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {projects.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">{p.projectName}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {p.projectId} • {p.customer?.fullName}
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                    {p.projectStatus.replace(/_/g, " ")}
                  </span>
                  <div className="text-[11px] font-bold text-solar-deep mt-1">
                    {p.plantCapacityKw} kW
                  </div>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-6 text-slate-400">No projects recorded yet.</div>
            )}
          </div>
        </div>

        {/* Right: Security & Audit Activity Trail */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Immutable Audit Trail</h3>
            <Link href="/admin/audit" className="text-xs font-bold text-solar-deep hover:underline">
              Full Logs →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span className="font-mono text-emerald-700">{log.entityType}</span>
                    <span className="text-slate-400">•</span>
                    <span>{log.action}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {log.fieldChanged}: <span className="font-medium text-slate-700">{log.newValue || "Modified"}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="text-center py-6 text-slate-400">No audit activity logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
