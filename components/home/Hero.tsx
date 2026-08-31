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
    <section className="relative min-h-[85vh] lg:min-h-[92vh] flex items-center text-white overflow-hidden pt-28 sm:pt-36 pb-20 lg:pb-24">
      {/* Full-Bleed Background Image with Subtle Slow Zoom Motion */}
      <motion.div
        initial={{ scale: 1.08, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
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
        className="absolute top-1/4 left-1/3 w-96 h-96 bg-sun-amber rounded-full blur-3xl pointer-events-none z-0"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-10 left-10 w-80 h-80 bg-solar-emerald rounded-full blur-3xl pointer-events-none z-0"
      />

      {/* Content Container */}
      <div className="relative z-10 w-full fluid-container">
        <div className="max-w-5xl space-y-6 sm:space-y-8 text-left">
          {/* H1 Heading with Staggered Entrance */}
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="fluid-h1 font-extrabold font-heading text-white drop-shadow-md"
          >
            Power Your Future <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sun-amber via-yellow-200 to-emerald-300">
              With Solar Energy
            </span>
          </motion.h1>

          {/* Supporting Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="fluid-lead text-slate-200 max-w-3xl leading-relaxed font-normal drop-shadow-sm"
          >
            Professional rooftop solar installation solutions for homes, commercial businesses, and industrial facilities in Narmadapuram and across Madhya Pradesh.
          </motion.p>

          {/* CTA Action Buttons with Hover Springs */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-xl"
          >
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-5 bg-gradient-to-r from-sun-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base sm:text-lg rounded-full shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all group cursor-pointer"
            >
              <span>Get Free Solar Quote</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              href={`tel:${siteConfig.contact.phoneClean}`}
              className="inline-flex items-center justify-center gap-3 px-7 py-4 sm:py-5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-base sm:text-lg rounded-full backdrop-blur-md transition-all shadow-lg"
            >
              <Phone className="w-5 h-5 text-sun-amber" />
              <span>Call {siteConfig.contact.phoneDisplay}</span>
            </motion.a>
          </motion.div>

          {/* Micro Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="pt-6 flex flex-wrap items-center gap-6 sm:gap-8 text-xs sm:text-sm text-slate-200 border-t border-white/15 max-w-3xl"
          >
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
