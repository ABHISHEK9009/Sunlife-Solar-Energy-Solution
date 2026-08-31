"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, Phone, ShieldCheck, Zap, Sun, MapPin, CheckCircle2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function Hero() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center text-white overflow-hidden pt-28 sm:pt-36 pb-20 lg:pb-24">
      {/* Full-Bleed Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-solar.jpg"
          alt="Modern Indian house with rooftop solar panels in Narmadapuram Madhya Pradesh"
          fill
          priority
          className="object-cover object-center scale-105 animate-pulse-subtle"
        />
        {/* Sophisticated Multi-Layered Dark Solar Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/85 to-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
      </div>

      {/* Decorative ambient lighting glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-sun-amber/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-solar-emerald/20 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Content Container */}
      <div className="relative z-10 w-full fluid-container">
        <div className="max-w-5xl space-y-6 sm:space-y-8 text-left">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-sun-amber animate-ping" />
            <span className="text-white font-bold">SUNLIFE SOLAR</span>
            <span className="text-emerald-300">• Rooftop Solar EPC in Narmadapuram, MP</span>
          </div>

          {/* H1 Heading */}
          <h1 className="fluid-h1 font-extrabold font-heading text-white drop-shadow-md">
            Power Your Future <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sun-amber via-yellow-200 to-emerald-300">
              With Solar Energy
            </span>
          </h1>

          {/* Supporting Subheading */}
          <p className="fluid-lead text-slate-200 max-w-3xl leading-relaxed font-normal drop-shadow-sm">
            Professional rooftop solar installation solutions for homes, commercial businesses, and industrial facilities in Narmadapuram and across Madhya Pradesh.
          </p>

          {/* CTA Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-xl">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-5 bg-gradient-to-r from-sun-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base sm:text-lg rounded-full shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/40 transition-all group cursor-pointer"
            >
              <span>Get Free Solar Quote</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href={`tel:${siteConfig.contact.phoneClean}`}
              className="inline-flex items-center justify-center gap-3 px-7 py-4 sm:py-5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-base sm:text-lg rounded-full backdrop-blur-md transition-all shadow-lg"
            >
              <Phone className="w-5 h-5 text-sun-amber" />
              <span>Call {siteConfig.contact.phoneDisplay}</span>
            </a>
          </div>

          {/* Micro Trust Indicators */}
          <div className="pt-6 flex flex-wrap items-center gap-6 sm:gap-8 text-xs sm:text-sm text-slate-200 border-t border-white/15 max-w-3xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PM Surya Ghar Subsidy Assistance</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sun-amber" />
              <span>DISCOM Net Metering</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-300" />
              <span>25-Year Panel Warranty</span>
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
