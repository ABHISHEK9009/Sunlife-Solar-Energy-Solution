"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu, RefreshCw, Database, ChevronRight } from "lucide-react";

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthenticated(true);
      return;
    }

    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("sunlife_admin_auth");
      if (auth !== "true") {
        router.replace("/admin/login");
        return;
      }
      setAuthenticated(true);
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-xs">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="w-4 h-4 animate-spin text-sun-amber" />
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    if (pathname === "/admin/dashboard" || pathname === "/admin") return "Overview";
    if (pathname === "/admin/leads") return "Customer Leads";
    if (pathname === "/admin/estimates") return "Calculator Logs";
    if (pathname === "/admin/system") return "System & Health";
    return "Admin";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sleek Admin Sidebar */}
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium">Admin</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-slate-900">{getPageTitle()}</span>
            </div>
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Neon PostgreSQL</span>
              <span>Connected</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
