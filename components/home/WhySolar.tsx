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
      title: "Immediate Savings",
      desc: "Slash your monthly electricity bill by up to 80%–90% from the very first billing cycle after net meter synchronization.",
    },
    {
      icon: ShieldAlert,
      title: "Tariff Protection",
      desc: "Lock in your electricity costs for the next 25 years and hedge against future DISCOM rate hikes.",
    },
    {
      icon: Home,
      title: "Property Value",
      desc: "Rooftop solar increases property market valuation and appeals strongly to modern buyers.",
    },
    {
      icon: Award,
      title: "PM Surya Ghar",
      desc: "Direct bank transfer subsidies up to ₹78,000 for eligible residential rooftops in Central MP.",
    },
    {
      icon: Clock,
      title: "25-Yr Performance",
      desc: "Tier-1 Mono-PERC modules retain high conversion output over decades with linear warranty.",
    },
    {
      icon: Leaf,
      title: "Clean & Green",
      desc: "Offset ~6 tonnes of carbon dioxide emissions every single year with a standard 5 kW system.",
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
          className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 md:mb-12"
        >
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-emerald-100/80 px-3.5 py-1.5 rounded-full inline-block mb-2 sm:mb-3">
            Core Advantages
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading text-slate-950 leading-tight">
            Why Switch to Solar Energy?
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-2 sm:mt-3 leading-relaxed">
            A transition to solar provides financial stability, technical autonomy, and measurable environmental benefits for decades to come.
          </p>
        </motion.div>

        {/* Responsive 2-Column Mobile Grid, 3-Column Desktop Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="p-3.5 sm:p-5 md:p-6 lg:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-500/40 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-solar-light text-solar-deep flex items-center justify-center group-hover:bg-solar-deep group-hover:text-sun-amber transition-colors duration-300 shadow-sm">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-xs sm:text-base lg:text-lg text-slate-900 leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-slate-600 text-[11px] sm:text-xs lg:text-sm leading-relaxed line-clamp-3 sm:line-clamp-none">
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
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 sm:mt-10 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-solar-deep hover:bg-solar-dark text-white font-bold text-xs sm:text-sm md:text-base rounded-full shadow-lg shadow-emerald-950/20 transition-all group cursor-pointer"
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
