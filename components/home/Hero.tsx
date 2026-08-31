"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Phone, ShieldCheck, Zap, Sun } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function Hero() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="relative min-h-[82vh] sm:min-h-[88vh] lg:min-h-[92vh] flex items-center text-white overflow-hidden pt-20 sm:pt-28 md:pt-36 pb-12 sm:pb-16 lg:pb-24">
      {/* Full-Bleed Background Image with Subtle Depth */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-solar.jpg"
          alt="Modern Indian house with rooftop solar panels in Narmadapuram Madhya Pradesh"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Multi-Layered Dark Solar Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/90 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80" />
      </div>

      {/* Ambient Lighting Glows */}
      <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-sun-amber/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-64 sm:w-80 h-64 sm:h-80 bg-solar-emerald/20 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Content Container */}
      <div className="relative z-10 w-full site-container">
        <div className="max-w-4xl space-y-3.5 sm:space-y-6 text-left">
          {/* H1 Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-white tracking-tight leading-[1.12] drop-shadow-md"
          >
            Power Your Future <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sun-amber via-amber-300 to-emerald-300">
              With Solar Energy
            </span>
          </motion.h1>

          {/* Supporting Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="text-xs sm:text-base md:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl"
          >
            Professional rooftop solar installation solutions for homes, commercial businesses, and industrial facilities in Narmadapuram and across Madhya Pradesh.
          </motion.p>

          {/* CTA Action Buttons - 2-Col Grid on Mobile, Flex Inline on Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
            className="pt-2 grid grid-cols-2 gap-2 sm:gap-3 max-w-sm sm:max-w-md lg:max-w-none lg:flex lg:flex-row lg:items-center lg:gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalOpen(true)}
              className="w-full lg:w-auto flex items-center justify-center gap-1.5 lg:gap-2.5 px-3 py-2.5 sm:px-5 sm:py-3 lg:px-7 lg:py-4 bg-gradient-to-r from-sun-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm lg:text-base rounded-full shadow-lg shadow-amber-500/25 transition-all text-center cursor-pointer"
            >
              <span>Get Free Solar Quote</span>
              <ArrowRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`tel:${siteConfig.contact.phoneClean}`}
              className="w-full lg:w-auto flex items-center justify-center gap-1.5 lg:gap-2.5 px-3 py-2.5 sm:px-5 sm:py-3 lg:px-6 lg:py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm lg:text-base rounded-full backdrop-blur-md transition-all text-center"
            >
              <Phone className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-sun-amber shrink-0" />
              <span>Call {siteConfig.contact.phoneDisplay}</span>
            </motion.a>
          </motion.div>

          {/* Desktop Trust Indicators (Visible on Desktop only) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="hidden lg:flex flex-wrap items-center gap-6 pt-6 border-t border-white/15 text-sm text-slate-200"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PM Surya Ghar Subsidy</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sun-amber shrink-0" />
              <span>DISCOM Net Metering</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>25-Year Linear Warranty</span>
            </div>
          </motion.div>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
