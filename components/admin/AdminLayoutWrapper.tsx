"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu, RefreshCw, ChevronRight } from "lucide-react";

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
    if (pathname === "/admin/team") return "Team & Field Crew";
    return "Admin";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sleek Admin Sidebar */}
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header - Aligned h-16 with Sidebar Header */}
        <header className="sticky top-0 z-10 h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-400">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-slate-900 text-sm">{getPageTitle()}</span>
            </div>
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Neon PostgreSQL</span>
              <span>Connected</span>
            </div>
          </div>
        </header>

        {/* Page Content - Full Width Fluid Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
