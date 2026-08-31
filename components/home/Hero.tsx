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
    <section className="relative min-h-[82vh] sm:min-h-[86vh] lg:min-h-[92vh] flex items-center text-white overflow-hidden pt-20 sm:pt-28 md:pt-36 pb-12 sm:pb-16 lg:pb-24">
      {/* Full-Bleed Background Image */}
      <motion.div
        initial={{ scale: 1.05, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/images/hero-solar.jpg"
          alt="Modern Indian house with rooftop solar panels in Narmadapuram Madhya Pradesh"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Multi-Layered Dark Solar Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/85 to-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
      </motion.div>

      {/* Ambient Lighting Glows */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-sun-amber rounded-full blur-3xl pointer-events-none z-0"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-10 left-10 w-52 sm:w-80 h-52 sm:h-80 bg-solar-emerald rounded-full blur-3xl pointer-events-none z-0"
      />

      {/* Content Container */}
      <div className="relative z-10 w-full site-container">
        <div className="max-w-4xl space-y-3.5 sm:space-y-6 text-left">
          {/* H1 Heading - Responsive Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-white leading-tight drop-shadow-md"
          >
            Power Your Future <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sun-amber via-yellow-200 to-emerald-300">
              With Solar Energy
            </span>
          </motion.h1>

          {/* Supporting Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-xs sm:text-base md:text-lg text-slate-200/90 max-w-2xl leading-relaxed font-normal drop-shadow-sm"
          >
            Professional rooftop solar installation solutions for homes, commercial businesses, and industrial facilities in Narmadapuram and across Madhya Pradesh.
          </motion.p>

          {/* CTA Action Buttons - Clean Mobile Sizing */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="pt-1.5 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 max-w-xl"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-7 sm:py-4 bg-gradient-to-r from-sun-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-base rounded-xl sm:rounded-full shadow-lg shadow-amber-500/25 transition-all group cursor-pointer"
            >
              <span>Get Free Solar Quote</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              href={`tel:${siteConfig.contact.phoneClean}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-base rounded-xl sm:rounded-full backdrop-blur-md transition-all shadow-sm"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sun-amber" />
              <span>Call {siteConfig.contact.phoneDisplay}</span>
            </motion.a>
          </motion.div>

          {/* Micro Trust Indicators - Clean 2-Column Grid on Mobile, Flex on Desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="pt-3 sm:pt-6 border-t border-white/15 max-w-3xl"
          >
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 p-2 sm:p-0 rounded-xl sm:rounded-none bg-white/[0.05] sm:bg-transparent border border-white/10 sm:border-none text-[11px] sm:text-xs text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">PM Surya Ghar Subsidy</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 sm:p-0 rounded-xl sm:rounded-none bg-white/[0.05] sm:bg-transparent border border-white/10 sm:border-none text-[11px] sm:text-xs text-slate-200">
                <Zap className="w-3.5 h-3.5 text-sun-amber shrink-0" />
                <span className="truncate">DISCOM Net Metering</span>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center justify-center sm:justify-start gap-1.5 p-2 sm:p-0 rounded-xl sm:rounded-none bg-white/[0.05] sm:bg-transparent border border-white/10 sm:border-none text-[11px] sm:text-xs text-slate-200">
                <Sun className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <span>25-Year Panel Warranty</span>
              </div>
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
