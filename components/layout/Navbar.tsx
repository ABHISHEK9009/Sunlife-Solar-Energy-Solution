"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Phone,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSolutionsOpen(false);
    setMobileSolutionsOpen(false);
  }, [pathname]);

  const solutions = siteConfig.navLinks.find((l) => l.name === "Solutions")?.children || [];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "py-2 sm:py-2.5 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 shadow-xl"
            : "py-2.5 sm:py-3.5 bg-slate-950/80 backdrop-blur-md lg:bg-transparent"
        }`}
      >
        <div className="site-container flex items-center justify-between gap-3">
          {/* Left Brand Logo - Scaled responsibly across breakpoints */}
          <Link href="/" className="flex items-center group shrink-0 py-0.5">
            <Image
              src="/logo/logo.svg"
              alt="Sunlife Solar Energy Solution Logo"
              width={340}
              height={140}
              className="h-9 sm:h-12 md:h-16 lg:h-20 xl:h-22 w-auto object-contain drop-shadow-2xl group-hover:scale-105 transition-all duration-300"
              priority
            />
          </Link>

          {/* Right Floating Nav Pill (Desktop lg: 1024px+) */}
          <nav className="hidden lg:flex items-center bg-white/95 backdrop-blur-md rounded-full px-2 py-1.5 shadow-xl border border-white/60">
            <div className="flex items-center gap-0.5 xl:gap-1 px-1">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                Home
              </Link>

              <Link
                href="/about"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/about"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                About
              </Link>

              {/* Solutions Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setSolutionsOpen(true)}
                onMouseLeave={() => setSolutionsOpen(false)}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                    pathname.includes("solar") &&
                    pathname !== "/solar-calculator" &&
                    pathname !== "/solar-subsidy"
                      ? "bg-slate-200/80 text-solar-dark"
                      : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                  }`}
                >
                  <span>Solutions</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {solutionsOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 border border-slate-200/80 p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Our Solar Services
                    </div>
                    {solutions.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSolutionsOpen(false)}
                        className="group flex flex-col px-3 py-2 rounded-xl text-left hover:bg-emerald-50/80 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-900 group-hover:text-solar-deep transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {item.desc}
                        </span>
                      </Link>
                    ))}
                    <div className="pt-2 mt-1 border-t border-slate-100 px-2">
                      <Link
                        href="/solar-solutions"
                        onClick={() => setSolutionsOpen(false)}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-solar-deep hover:bg-emerald-100/50 transition-colors"
                      >
                        <span>View All Solutions</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/solar-calculator"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/solar-calculator"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                Calculator
              </Link>

              <Link
                href="/solar-subsidy"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/solar-subsidy"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                Subsidy
              </Link>

              <Link
                href="/projects"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/projects"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                Projects
              </Link>

              <Link
                href="/faqs"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/faqs"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                FAQs
              </Link>

              <Link
                href="/contact"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/contact"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                Contact
              </Link>
            </div>

            {/* Nested CTA Pill Button */}
            <button
              onClick={() => setQuoteModalOpen(true)}
              className="ml-1.5 inline-flex items-center gap-1.5 px-4 xl:px-5 py-2.5 bg-gradient-to-r from-solar-dark to-solar-deep hover:from-solar-deep hover:to-solar-emerald text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all group cursor-pointer"
            >
              <span>Get Free Quote</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </nav>

          {/* Mobile Right Controls (< 1024px) */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setQuoteModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-sun-amber to-amber-500 text-slate-950 text-xs font-extrabold rounded-full shadow-md"
            >
              Get Quote
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/15 backdrop-blur-md transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 mx-3 sm:mx-6 bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 space-y-3 text-white shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-center"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-center"
              >
                About Us
              </Link>
              <Link
                href="/solar-calculator"
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-center text-sun-amber"
              >
                Calculator
              </Link>
              <Link
                href="/solar-subsidy"
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-center"
              >
                Subsidy
              </Link>
              <Link
                href="/projects"
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-center"
              >
                Projects
              </Link>
              <Link
                href="/faqs"
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-center"
              >
                FAQs
              </Link>
            </div>

            {/* Mobile Solutions Accordion */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
              >
                <span>Solar Solutions</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileSolutionsOpen ? "rotate-180" : ""}`} />
              </button>

              {mobileSolutionsOpen && (
                <div className="grid grid-cols-1 gap-1.5 mt-2 pl-2">
                  {solutions.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-emerald-500/20 text-xs text-slate-200 hover:text-white font-medium flex items-center justify-between"
                    >
                      <span>{item.name}</span>
                      <span className="text-[10px] text-emerald-400">View →</span>
                    </Link>
                  ))}
                  <Link
                    href="/solar-solutions"
                    className="p-2.5 rounded-xl bg-solar-deep/50 text-xs font-bold text-sun-amber text-center"
                  >
                    View All Solutions Overview
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="block p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-center"
            >
              Contact & Location
            </Link>

            {/* Direct Action CTAs in Drawer */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setQuoteModalOpen(true);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-sun-amber to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center gap-2"
              >
                <span>Get Free Solar Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="w-full py-3 bg-white/10 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 border border-white/15"
              >
                <Phone className="w-4 h-4 text-sun-amber" />
                <span>Call {siteConfig.contact.phoneDisplay}</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Quote Form Modal */}
      <LeadQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
      />
    </>
  );
}
