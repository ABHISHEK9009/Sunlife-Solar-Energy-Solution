"use client";

import React, { useState } from "react";
import { ArrowRight, MessageCircle, Phone, Sun, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function FinalCTA() {
  const [modalOpen, setModalOpen] = useState(false);
  const encodedMsg = encodeURIComponent(siteConfig.contact.whatsappText);
  const whatsappUrl = `https://wa.me/91${siteConfig.contact.whatsapp}?text=${encodedMsg}`;

  return (
    <section className="relative py-20 bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-sun-amber/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-solar-emerald/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-sun-amber text-xs font-bold uppercase tracking-wider">
          <Sun className="w-4 h-4" /> Start Saving Today
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
          Ready to Make the Switch to Solar?
        </h2>

        <p className="text-slate-200 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Tell us about your property and electricity requirements. Our local team in Narmadapuram will help you understand the right solar solution, net metering process, and subsidy eligibility.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-sun-amber hover:bg-amber-400 text-slate-950 font-bold text-base rounded-xl shadow-xl shadow-amber-500/20 transition-all group cursor-pointer"
          >
            <span>Get Free Solar Quote</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-base rounded-xl shadow-lg transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>WhatsApp Us</span>
          </a>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200/90 border-t border-white/10 max-w-xl mx-auto">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-sun-amber" />
            <span>Direct Call: {siteConfig.contact.phoneDisplay}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>VINAYAK COMPLEX, Malakhedi, Narmadapuram</span>
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
