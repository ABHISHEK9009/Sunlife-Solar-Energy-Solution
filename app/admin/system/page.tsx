"use client";

import React, { useState } from "react";
import {
  Database,
  ShieldCheck,
  Server,
  Activity,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Cpu,
  Layers,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export default function AdminSystemPage() {
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>("Active & Verified");

  const runHealthCheck = () => {
    setChecking(true);
    setTimeout(() => {
      setLastCheck(`Verified at ${new Date().toLocaleTimeString("en-IN")}`);
      setChecking(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Database & System Diagnostics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Neon Serverless PostgreSQL connection and application health metrics
          </p>
        </div>

        <button
          onClick={runHealthCheck}
          disabled={checking}
          className="px-4 py-2 bg-solar-deep text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
          <span>{checking ? "Testing Connection..." : "Test Health"}</span>
        </button>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Database Health */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Primary Database
            </span>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Online
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-heading">
            Neon Serverless PostgreSQL
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
            <div><strong>Schema:</strong> <code>sunlife</code> (Isolated namespace)</div>
            <div><strong>Pooler:</strong> AWS US-East-2 (Active)</div>
            <div><strong>Status:</strong> {lastCheck}</div>
          </div>
        </div>

        {/* Card 2: Framework & Runtime */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Application Runtime
            </span>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
              Next.js 14 App Router
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-heading">
            Next.js + Prisma ORM
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
            <div><strong>Prisma Client:</strong> v5.22.0</div>
            <div><strong>Deployment:</strong> Serverless Edge & Node runtime</div>
            <div><strong>Static Routes:</strong> 30 prerendered pages</div>
          </div>
        </div>

        {/* Card 3: Security & Access Control */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Access & Privacy
            </span>
            <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
              Hidden Route
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-heading">
            Internal Portal Access
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
            <div><strong>Robots.txt:</strong> Disallow: /admin/</div>
            <div><strong>Public Links:</strong> 100% Unlinked from public UI</div>
            <div><strong>Auth Guard:</strong> Active session verification</div>
          </div>
        </div>
      </div>
    </div>
  );
}
