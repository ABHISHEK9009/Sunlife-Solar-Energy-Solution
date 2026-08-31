"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Phone,
  Zap,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
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
  }, [pathname]);

  const solutions = siteConfig.navLinks.find((l) => l.name === "Solutions")?.children || [];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "py-3 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 shadow-lg"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 flex items-center justify-between">
          {/* Left Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-solar-deep border border-emerald-500/30 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Sun className="w-5 h-5 text-sun-amber" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-white leading-none drop-shadow-sm">
                SUNLIFE
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-emerald-300 uppercase mt-0.5 drop-shadow-sm">
                Solar Energy Solution
              </span>
            </div>
          </Link>

          {/* Right Floating Nav Pill (Matching Reference Design) */}
          <nav className="hidden lg:flex items-center bg-white/95 backdrop-blur-md rounded-full px-2 py-1.5 shadow-xl border border-white/60">
            <div className="flex items-center gap-1 px-2">
              <Link
                href="/"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                Home
              </Link>

              <Link
                href="/about"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
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
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
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
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white/98 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-100 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {solutions.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-solar-deep transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                    <div className="pt-1.5 border-t border-slate-100">
                      <Link
                        href="/solar-solutions"
                        className="block px-3 py-1.5 text-[11px] font-bold text-solar-deep hover:underline"
                      >
                        View All Solutions →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/solar-calculator"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  pathname === "/solar-calculator"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                <span>Calculator</span>
              </Link>

              <Link
                href="/solar-subsidy"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/solar-subsidy"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                Subsidy
              </Link>

              <Link
                href="/projects"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/projects"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                Projects
              </Link>

              <Link
                href="/faqs"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/faqs"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                FAQs
              </Link>

              <Link
                href="/contact"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/contact"
                    ? "bg-slate-200/80 text-solar-dark"
                    : "text-slate-700 hover:text-solar-dark hover:bg-slate-100/70"
                }`}
              >
                Contact
              </Link>
            </div>

            {/* Nested CTA Pill Button (Inside the pill on the right, as in reference) */}
            <button
              onClick={() => setQuoteModalOpen(true)}
              className="ml-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-solar-dark to-solar-deep hover:from-solar-deep hover:to-solar-emerald text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all group cursor-pointer"
            >
              <span>Get Free Quote</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </nav>

          {/* Mobile Right Bar */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setQuoteModalOpen(true)}
              className="px-3.5 py-1.5 bg-sun-amber text-slate-950 text-xs font-bold rounded-full shadow-sm"
            >
              Quote
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 mx-4 bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 space-y-2 text-white shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <Link
              href="/"
              className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10"
            >
              About Sunlife
            </Link>
            <Link
              href="/solar-solutions"
              className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10"
            >
              Solar Solutions
            </Link>
            <Link
              href="/solar-calculator"
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-sun-amber hover:bg-white/10"
            >
              Solar Calculator
            </Link>
            <Link
              href="/solar-subsidy"
              className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10"
            >
              Subsidy Guide
            </Link>
            <Link
              href="/projects"
              className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10"
            >
              Projects Portfolio
            </Link>
            <Link
              href="/blog"
              className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10"
            >
              Blog & Guides
            </Link>
            <Link
              href="/faqs"
              className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10"
            >
              FAQs
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10"
            >
              Contact Us
            </Link>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setQuoteModalOpen(true);
                }}
                className="w-full py-3 bg-sun-amber text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl text-center shadow-md"
              >
                Get Free Solar Quote
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Quote Modal */}
      <LeadQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
      />
    </>
  );
}
