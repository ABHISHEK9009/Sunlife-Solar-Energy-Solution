"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calculator,
  UserCheck,
  ExternalLink,
  LogOut,
  X,
  ChevronRight,
  Shield,
  Activity,
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
      name: "Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Customer Leads",
      href: "/admin/leads",
      icon: Users,
    },
    {
      name: "Calculator Logs",
      href: "/admin/estimates",
      icon: Calculator,
    },
    {
      name: "Team & Field Crew",
      href: "/admin/team",
      icon: UserCheck,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container - Minimal, Clean SaaS Theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 ${
          mobileOpen ? "z-40" : "z-20"
        } w-64 bg-white text-slate-800 flex flex-col justify-between border-r border-slate-200/90 transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo Bar */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/90 bg-white shrink-0">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo/logo.svg"
                alt="Sunlife Solar"
                width={170}
                height={55}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>

            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-solar-deep border border-emerald-200/80 hidden sm:inline-block">
              Admin
            </span>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-6 flex-1">
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Main Menu
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
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-solar-deep text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-sun-amber" : "text-slate-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Shortcuts
              </div>

              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>Live Website</span>
                </div>
                <span className="text-[10px] text-slate-400">↗</span>
              </Link>
            </div>
          </div>

          {/* Bottom Profile Bar */}
          <div className="p-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-solar-deep text-sun-amber flex items-center justify-center font-bold text-xs shrink-0">
                  RK
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    Rahul Kumar
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Admin Active</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
