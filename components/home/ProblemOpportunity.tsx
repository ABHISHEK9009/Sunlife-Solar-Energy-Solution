"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, Sun, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function ProblemOpportunity() {
  const [modalOpen, setModalOpen] = useState(false);

  const points = [
    "Grid electricity rates in Madhya Pradesh increase periodically year-on-year.",
    "Unutilized rooftop area can generate free, clean electricity for 25+ years.",
    "Central PM Surya Ghar subsidies reduce upfront residential capital cost.",
    "Commercial & industrial setups gain immediate operational expenditure tax benefits.",
  ];

  return (
    <section className="fluid-py bg-slate-50 border-b border-slate-200/80">
      <div className="fluid-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column (5 Cols): Real Installation Photograph */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-5 relative order-2 lg:order-1"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/installation-solar.jpg"
                  alt="Solar panel installation team mounting precision solar structures in MP"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-solar-deep text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-sun-amber" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold text-sm font-heading">
                      Guaranteed Generation
                    </div>
                    <div className="text-xs text-slate-600">
                      Tier-1 modules with 25-year performance warranty
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column (7 Cols): The Problem vs Opportunity */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-solar-light text-solar-deep text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-solar-emerald" />
              <span>Electricity Cost Protection</span>
            </div>

            <h2 className="fluid-h2 font-extrabold font-heading text-slate-950">
              Why Pay Rising Power Bills When Your Roof Can Generate Free Energy?
            </h2>

            <p className="fluid-p text-slate-600 leading-relaxed">
              In Madhya Pradesh, commercial, industrial, and residential power tariffs continue to escalate. Every month without solar is money spent on recurring utility bills that could instead be generating an internal return on investment.
            </p>

            <div className="space-y-3 pt-1">
              {points.map((pt, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-solar-emerald shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-slate-700 font-medium">
                    {pt}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-solar-deep hover:bg-solar-dark text-white font-bold text-sm rounded-full shadow-lg shadow-emerald-900/20 transition-all group cursor-pointer"
              >
                <span>Calculate Your Return On Investment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
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
