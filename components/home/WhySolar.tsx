"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  ShieldAlert,
  Home,
  Award,
  Clock,
  Leaf,
  ArrowRight,
} from "lucide-react";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function WhySolar() {
  const [modalOpen, setModalOpen] = useState(false);

  const benefits = [
    {
      icon: Coins,
      title: "Immediate & Massive Savings",
      desc: "Slash your monthly electricity bill by up to 80%–90% right from the first billing cycle after net meter synchronization.",
    },
    {
      icon: ShieldAlert,
      title: "Hedge Against Tariff Hikes",
      desc: "Lock in your electricity generation cost for the next 25 years and protect your household or business from rising Discom power rates.",
    },
    {
      icon: Home,
      title: "Appreciates Property Value",
      desc: "Properties equipped with modern rooftop solar arrays attract higher market valuation and appeal strongly to energy-conscious buyers.",
    },
    {
      icon: Award,
      title: "Direct PM Surya Ghar Subsidies",
      desc: "Eligible residential installations receive direct bank account transfers under the central PM Surya Ghar Muft Bijli Yojana.",
    },
    {
      icon: Clock,
      title: "25-Year Linear Performance",
      desc: "Tier-1 Monocrystalline PERC solar panels retain high conversion efficiency over decades with minimal routine maintenance.",
    },
    {
      icon: Leaf,
      title: "Clean Green Environmental Impact",
      desc: "A typical 5 kW residential solar setup offsets approximately 6 tonnes of carbon dioxide emissions every single year.",
    },
  ];

  return (
    <section className="section-py bg-slate-50 border-b border-slate-200/80">
      <div className="site-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-14"
        >
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-emerald-100/80 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Core Advantages
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading text-slate-950 leading-tight">
            Why Switch to Solar Energy?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            A transition to solar provides financial stability, technical autonomy, and measurable environmental benefits for decades to come.
          </p>
        </motion.div>

        {/* Responsive Grid: 1 col on mobile, 2 cols on sm, 3 cols on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                whileHover={{ y: -4 }}
                className="p-5 sm:p-6 md:p-7 rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-500/40 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-solar-light text-solar-deep flex items-center justify-center group-hover:bg-solar-deep group-hover:text-sun-amber transition-colors duration-300 shadow-sm">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 sm:mt-12 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-7 py-3.5 sm:px-8 sm:py-4 bg-solar-deep hover:bg-solar-dark text-white font-bold text-xs sm:text-sm md:text-base rounded-full shadow-lg shadow-emerald-950/20 transition-all group cursor-pointer"
          >
            <span>Claim Your Free Solar Consultation</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
