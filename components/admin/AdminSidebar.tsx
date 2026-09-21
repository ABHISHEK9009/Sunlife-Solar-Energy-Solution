"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Zap,
  ClipboardCheck,
  FileText,
  FolderLock,
  CreditCard,
  Award,
  Calculator,
  UserCheck,
  UserCog,
  ShieldAlert,
  ExternalLink,
  LogOut,
  X,
  ChevronRight,
  ChevronDown,
  MessageSquare,
} from "lucide-react";

interface AdminSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavSection {
  title: string;
  items: {
    name: string;
    href: string;
    icon: any;
    hasSubmenu?: boolean;
  }[];
}

export function AdminSidebar({ mobileOpen, setMobileOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);

  const handleLogout = () => {
    void fetch("/api/admin/login", { method: "DELETE" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("sunlife_admin_auth");
      localStorage.removeItem("sunlife_admin_user");
    }
    router.replace("/admin/login");
  };

  const navSections: NavSection[] = [
    {
      title: "Pipeline & Customers",
      items: [
        { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "WhatsApp Inbox", href: "/admin/whatsapp", icon: MessageSquare },
        { name: "Leads & Inquiries", href: "/admin/leads", icon: UserPlus },
        { name: "Customer Registry", href: "/admin/customers", icon: Users },
        { name: "Solar Projects", href: "/admin/projects", icon: Zap },
      ],
    },
    {
      title: "Field & Operations",
      items: [
        { name: "Site Surveys", href: "/admin/surveys", icon: ClipboardCheck },
        { name: "Quotations", href: "/admin/quotations", icon: FileText },
        { name: "Central Documents", href: "/admin/documents", icon: FolderLock },
        { name: "Payments & Billing", href: "/admin/payments", icon: CreditCard },
        { name: "Subsidy Tracker", href: "/admin/subsidies", icon: Award },
      ],
    },
    {
      title: "Management & System",
      items: [
        { name: "Agent Management", href: "/admin/agents", icon: UserCog },
        { name: "Team & Field Crew", href: "/admin/team", icon: UserCheck, hasSubmenu: true },
        { name: "Calculator Logs", href: "/admin/estimates", icon: Calculator },
        { name: "Audit Trail", href: "/admin/audit", icon: ShieldAlert },
      ],
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

      {/* Sidebar Container */}
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
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/90 bg-white shrink-0 sticky top-0 z-10">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo/logo.svg"
                alt="Sunlife Solar"
                width={210}
                height={68}
                className="h-12 w-auto object-contain"
                priority
              />
            </Link>

            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-solar-deep border border-emerald-200/80 hidden sm:inline-block">
              CRM Admin
            </span>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links Grouped by Section */}
          <div className="p-3 space-y-5 flex-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>

                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href === "/admin/dashboard" && pathname === "/admin");
                    const isTeamItem = item.hasSubmenu;

                    return (
                      <div key={item.href} className="space-y-0.5">
                        <div
                          className={`flex items-center rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? "bg-slate-100 text-slate-900 font-semibold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2"
                          >
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-slate-900" : "text-slate-400"
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </Link>

                          {isTeamItem ? (
                            <button
                              type="button"
                              onClick={() => setTeamMenuOpen((isOpen) => !isOpen)}
                              aria-label="Toggle Team Submenu"
                              className="mr-2 p-1 rounded-md hover:bg-slate-200/80 text-slate-500 transition-colors cursor-pointer"
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  teamMenuOpen ? "rotate-0" : "-rotate-90"
                                }`}
                              />
                            </button>
                          ) : (
                            isActive && (
                              <ChevronRight className="mr-3 w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )
                          )}
                        </div>

                        {/* Team Submenu */}
                        {isTeamItem && teamMenuOpen && (
                          <div id="team-submenu" className="pl-7 pr-2 py-1 space-y-0.5">
                            <Link
                              href="/admin/team?tab=attendance"
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span>Daily Attendance</span>
                            </Link>

                            <Link
                              href="/admin/team?tab=monthly"
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span>Monthly Reports</span>
                            </Link>

                            <Link
                              href="/admin/team?tab=profiles"
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span>Employee Profiles</span>
                            </Link>

                            <Link
                              href="/admin/team?tab=payroll"
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span>Payroll & Payment</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Shortcuts */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
