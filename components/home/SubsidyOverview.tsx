"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Info, ArrowRight, HelpCircle, FileCheck, CheckCircle2 } from "lucide-react";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function SubsidyOverview() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="fluid-py bg-white">
      <div className="fluid-container">
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-200/80 rounded-3xl p-6 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-solar-deep text-xs font-bold uppercase tracking-wider">
                <FileCheck className="w-4 h-4 text-solar-emerald" />
                <span>Central Government Scheme</span>
              </div>

              <h2 className="fluid-h2 font-extrabold font-heading text-slate-950">
                PM Surya Ghar Muft Bijli Yojana & Subsidy Guide
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Eligible residential homeowners installing grid-connected rooftop solar in Narmadapuram and across Madhya Pradesh may qualify for financial assistance under central and state rooftop solar subsidy programs (such as <strong>PM Surya Ghar: Muft Bijli Yojana</strong>).
              </p>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-solar-emerald shrink-0 mt-0.5" />
                  <span>Direct subsidy credited into customer bank accounts post-net-meter commissioning.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-solar-emerald shrink-0 mt-0.5" />
                  <span>Complete documentation, DISCOM application, and inspection support handled by Sunlife Solar.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-solar-emerald shrink-0 mt-0.5" />
                  <span>Applicable on standard 1 kW to 3 kW+ residential rooftop systems.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Government schemes and subsidy rules can change. Final eligibility depends on applicable MNRE guidelines, DISCOM feasibility, and customer property specifications.
                </span>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-solar-deep hover:bg-solar-dark text-white text-sm font-semibold rounded-xl shadow-md transition-all group cursor-pointer"
                >
                  <span>Check Your Solar Eligibility</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <Link
                  href="/solar-subsidy"
                  className="inline-flex items-center gap-2 px-5 py-3.5 bg-white text-slate-800 border border-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Read Detailed Subsidy Guide
                </Link>
              </div>
            </div>

            {/* Right Quick Eligibility Box (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-premium space-y-4">
              <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sun-amber" />
                <span>Quick Subsidy Checklist</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="text-slate-900 block mb-0.5">1. Active Electricity Connection</strong>
                  Domestic DISCOM connection in your name (MPPKVVCL / MPMKVVCL).
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="text-slate-900 block mb-0.5">2. Roof Ownership & Clear Space</strong>
                  Unshaded rooftop or terrace with permanent structural access.
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="text-slate-900 block mb-0.5">3. DCR (Domestic) Solar Panels</strong>
                  Approved ALMM-listed solar modules manufactured in India.
                </div>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-500">
                  Need help registering on the National Portal? We assist you step-by-step.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Check Solar Subsidy Eligibility"
      />
    </section>
  );
}
