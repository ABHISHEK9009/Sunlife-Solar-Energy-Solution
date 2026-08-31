"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu, Bell, RefreshCw, ShieldCheck, User } from "lucide-react";

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // If on /admin/login, don't show sidebar wrapper
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-sm">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-sun-amber" />
          <span>Verifying secure admin session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Dedicated Admin Sidebar */}
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Admin Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Admin Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sunlife Solar EPC Management
              </div>
              <h1 className="text-base sm:text-lg font-bold font-heading text-slate-900 leading-tight">
                {pathname === "/admin/dashboard" || pathname === "/admin"
                  ? "Executive Dashboard"
                  : pathname === "/admin/leads"
                  ? "Customer Leads & Inquiries"
                  : pathname === "/admin/estimates"
                  ? "Solar Calculator Sizing Records"
                  : pathname === "/admin/system"
                  ? "Database & Infrastructure Health"
                  : "Admin Portal"}
              </h1>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Neon DB Active</span>
            </div>

            <div className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
              <div className="w-6 h-6 rounded-full bg-solar-deep text-sun-amber flex items-center justify-center text-[10px]">
                RK
              </div>
              <span className="hidden sm:inline">Rahul Kumar Bamne</span>
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
