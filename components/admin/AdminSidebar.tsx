"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calculator,
  Database,
  ExternalLink,
  LogOut,
  X,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

interface AdminSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function AdminSidebar({ mobileOpen, setMobileOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sunlife_admin_auth");
      localStorage.removeItem("sunlife_admin_user");
    }
    router.replace("/admin/login");
  };

  const navItems = [
    {
      name: "Dashboard Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      desc: "Key metrics & live pipeline",
    },
    {
      name: "Customer Leads",
      href: "/admin/leads",
      icon: Users,
      desc: "Inquiries & consultations",
    },
    {
      name: "Calculator Estimates",
      href: "/admin/estimates",
      icon: Calculator,
      desc: "User generated solar sizing",
    },
    {
      name: "Database & System",
      href: "/admin/system",
      icon: Database,
      desc: "Neon PostgreSQL status",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container - All White Theme with Green Accents */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white text-slate-900 flex flex-col justify-between border-r border-slate-200 shadow-sm transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/logo/logo.svg"
                alt="Sunlife Solar Energy Solution"
                width={180}
                height={60}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Profile Card - Clean Green Glass Tint */}
          <div className="p-3.5 mx-3 mt-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-solar-deep text-sun-amber flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                RK
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  Rahul Kumar Bamne
                </div>
                <div className="text-[11px] text-solar-deep font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-solar-emerald" />
                  <span>Admin & Founder</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1 mt-3">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Admin Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/admin/dashboard" && pathname === "/admin");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-solar-deep text-white shadow-md shadow-emerald-950/15 font-bold"
                      : "text-slate-600 hover:text-solar-deep hover:bg-emerald-50/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? "text-sun-amber" : "text-slate-400 group-hover:text-solar-deep"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="leading-tight truncate">{item.name}</div>
                    <div
                      className={`text-[10px] truncate font-normal mt-0.5 ${
                        isActive ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Sidebar Info & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2.5">
          {/* Neon Database Status */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-semibold">Neon PostgreSQL</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md uppercase">
              Online
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              target="_blank"
              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-solar-deep text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
