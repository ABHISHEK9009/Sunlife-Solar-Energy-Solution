"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, Phone, ShieldCheck, Zap, Sun } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function Hero() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="relative bg-gradient-to-b from-emerald-950 via-solar-dark to-slate-900 text-white overflow-hidden pt-28 sm:pt-32 pb-16 lg:pt-36 lg:pb-20">
      {/* Decorative ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sun/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-solar-emerald/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column (7 cols): Copy and Primary CTAs */}
          <div className="lg:col-span-7 space-y-6 lg:space-y-8 text-center lg:text-left">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-emerald-200 text-xs sm:text-sm font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-sun-amber animate-ping" />
              <span>Rooftop Solar EPC • Narmadapuram, MP</span>
            </div>

            {/* H1 Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-extrabold font-heading tracking-tight leading-[1.12] text-white">
              Power Your Future <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sun-amber via-yellow-200 to-emerald-300">
                With Solar Energy
              </span>
            </h1>

            {/* Supporting Subheading */}
            <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Professional rooftop solar installation solutions for homes, commercial businesses, and industrial facilities in Narmadapuram and across Madhya Pradesh.
            </p>

            {/* CTA Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-gradient-to-r from-sun-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all group cursor-pointer"
              >
                <span>Get Free Solar Quote</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-base rounded-xl backdrop-blur-sm transition-all"
              >
                <Phone className="w-4 h-4 text-sun-amber" />
                <span>Call {siteConfig.contact.phoneDisplay}</span>
              </a>
            </div>

            {/* Micro Trust Proof */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-300/90 border-t border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Govt. Subsidy Guidance</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-sun-amber" />
                <span>Net Metering Assistance</span>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-yellow-300" />
                <span>25-Year Performance Warranty</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): High-Quality Realistic Solar Image & Floating Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 group">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/hero-solar.jpg"
                  alt="Modern Indian house with sleek rooftop solar panel installation in Narmadapuram Madhya Pradesh"
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              </div>

              {/* Floating Real Badge on Image */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-solar-deep text-sun-amber flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm font-heading">
                        Clean Rooftop Energy
                      </div>
                      <div className="text-[11px] text-emerald-300">
                        Long-Term Power Bill Reduction
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-950 text-emerald-300 rounded-lg border border-emerald-700/50">
                    Est. 2021
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
