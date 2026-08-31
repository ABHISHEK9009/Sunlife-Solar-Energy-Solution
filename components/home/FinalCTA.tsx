"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Phone, MessageSquare, ShieldCheck, Sun } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function FinalCTA() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="relative fluid-py bg-gradient-to-br from-solar-dark via-solar-deep to-emerald-950 text-white overflow-hidden">
      {/* Background Animated Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 w-96 h-96 bg-sun-amber rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative z-10 fluid-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sun-amber text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/15">
            <Sun className="w-4 h-4" />
            <span>Start Saving on Electricity Today</span>
          </div>

          <h2 className="fluid-h2 font-extrabold font-heading text-white leading-tight">
            Ready to Power Your Home or Business With Clean Solar Energy?
          </h2>

          <p className="fluid-lead text-slate-200 leading-relaxed max-w-2xl mx-auto">
            Get a free, transparent rooftop solar assessment, DISCOM net-metering estimate, and direct subsidy calculation from Narmadapuram&apos;s trusted solar specialists.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-5 bg-gradient-to-r from-sun-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base sm:text-lg rounded-full shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all group cursor-pointer"
            >
              <span>Get Free Solar Quote</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              href={`https://wa.me/91${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
                siteConfig.contact.whatsappText
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 sm:py-5 bg-white/10 hover:bg-white/20 text-white font-semibold text-base sm:text-lg rounded-full border border-white/20 backdrop-blur-md transition-all shadow-lg"
            >
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <span>Chat on WhatsApp</span>
            </motion.a>
          </div>

          {/* Direct Phone Assistance */}
          <div className="pt-6 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-sun-amber" />
              <span>
                Direct Helpline:{" "}
                <a
                  href={`tel:${siteConfig.contact.phoneClean}`}
                  className="font-bold text-white hover:underline"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Free Consultation • No Obligation</span>
            </div>
          </div>
        </motion.div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Get Your Free Solar Consultation"
      />
    </section>
  );
}
