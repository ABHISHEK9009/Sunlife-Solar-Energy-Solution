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
    <section className="fluid-py bg-slate-50 border-b border-slate-200/80">
      <div className="fluid-container">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-emerald-100/80 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Core Advantages
          </span>
          <h2 className="fluid-h2 font-extrabold font-heading text-slate-950">
            Why Switch to Solar Energy?
          </h2>
          <p className="fluid-p text-slate-600 mt-3 leading-relaxed">
            A transition to solar provides financial stability, technical autonomy, and measurable environmental benefits for decades to come.
          </p>
        </motion.div>

        {/* Intrinsic Fluid Grid 3 with Staggered Entrance */}
        <div className="fluid-grid-3">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="p-8 rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-500/40 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-solar-light text-solar-deep flex items-center justify-center group-hover:bg-solar-deep group-hover:text-sun-amber transition-colors duration-300 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-slate-900 leading-snug">
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-solar-deep hover:bg-solar-dark text-white font-bold text-sm sm:text-base rounded-full shadow-lg shadow-emerald-950/20 transition-all group cursor-pointer"
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
