"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, CheckCircle2, ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function LocalSEOSnippet() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="fluid-py bg-slate-50 border-b border-slate-200/80">
      <div className="fluid-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Local Coverage */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-solar-deep text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-solar-emerald" />
              <span>Madhya Pradesh Solar EPC</span>
            </div>

            <h2 className="fluid-h2 font-extrabold font-heading text-slate-950">
              Your Trusted Local Solar Energy Partner in Narmadapuram & Central MP
            </h2>

            <p className="fluid-p text-slate-600 leading-relaxed">
              Based in Malakhedi, Narmadapuram, we provide fast, on-ground site survey, fast DISCOM net-meter liaising with MPPKVVCL / MPMKVVCL, and rapid installation support across the district and neighboring regions.
            </p>

            {/* Service Areas Pills */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Key Service Locations & Surrounding Coverage:
              </div>
              <div className="flex flex-wrap gap-2">
                {siteConfig.contact.serviceAreas.map((area, idx) => (
                  <motion.span
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 font-medium shadow-sm hover:border-emerald-500/40 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3 text-solar-emerald" />
                    <span>{area}</span>
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Direct Contact & Fast Action */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Speak Directly with Our Solar Engineer
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Have questions about your roof structure, DISCOM permissions, or PM Surya Ghar subsidies? Get immediate answers without waiting.
              </p>

              <div className="space-y-3 pt-2">
                <motion.a
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  href={`tel:${siteConfig.contact.phoneClean}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-solar-deep hover:bg-solar-dark text-white font-bold text-sm shadow-md transition-all"
                >
                  <Phone className="w-4 h-4 text-sun-amber" />
                  <span>Call {siteConfig.contact.phoneDisplay}</span>
                </motion.a>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <span>Request In-Person Site Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Local Site Survey in MP"
      />
    </section>
  );
}
