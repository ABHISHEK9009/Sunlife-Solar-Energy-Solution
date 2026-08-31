"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, ArrowRight, ShieldCheck, CheckCircle2, FileText, Zap } from "lucide-react";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function SubsidyOverview() {
  const [modalOpen, setModalOpen] = useState(false);

  const tiers = [
    {
      capacity: "1 kW System",
      subsidy: "₹30,000 Direct Subsidy",
      ideal: "Small households (1-2 members, 100-120 units/mo)",
      area: "~100 sq.ft. shadow-free roof area",
    },
    {
      capacity: "2 kW System",
      subsidy: "₹60,000 Direct Subsidy",
      ideal: "Medium households (3-4 members, 200-250 units/mo)",
      area: "~200 sq.ft. shadow-free roof area",
    },
    {
      capacity: "3 kW to 10 kW System",
      subsidy: "₹78,000 Maximum Subsidy",
      ideal: "Large residences, duplexes with ACs & water pumps",
      area: "~300+ sq.ft. shadow-free roof area",
    },
  ];

  return (
    <section className="fluid-py bg-white">
      <div className="fluid-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left: Subsidy Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sun-amber/20 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-sun-amber" />
              <span>Government Schemes & Benefits</span>
            </div>

            <h2 className="fluid-h2 font-extrabold font-heading text-slate-950">
              PM Surya Ghar: Muft Bijli Yojana Subsidies in MP
            </h2>

            <p className="fluid-p text-slate-600 leading-relaxed">
              Under the Government of India&apos;s <strong>PM Surya Ghar Muft Bijli Yojana</strong>, residential consumers in Madhya Pradesh receive direct subsidies deposited directly into their bank accounts upon installation of a grid-tied rooftop solar system.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-solar-emerald shrink-0" />
                <span>Zero hassle: We handle entire National Portal documentation.</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-solar-emerald shrink-0" />
                <span>DISCOM Net-meter application & inspection support included.</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-solar-emerald shrink-0" />
                <span>DCR (Domestic Content Requirement) certified solar panels.</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/solar-subsidy"
                className="inline-flex items-center gap-2 text-sm font-bold text-solar-deep hover:text-solar-dark group"
              >
                <span>Read Full PM Surya Ghar Guide & Eligibility</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Right: Subsidy Breakdown Cards */}
          <div className="lg:col-span-6 space-y-4">
            {tiers.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/40 shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="font-heading font-bold text-lg text-slate-900">
                    {t.capacity}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-solar-dark font-bold text-xs">
                    {t.subsidy}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{t.ideal}</p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-sun-amber" />
                  <span>Required roof space: {t.area}</span>
                </div>
              </motion.div>
            ))}

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalOpen(true)}
              className="w-full mt-2 py-4 rounded-full bg-solar-deep hover:bg-solar-dark text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Check My Home Subsidy & Total Cost
            </motion.button>
          </div>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Check PM Surya Ghar Subsidy Eligibility"
      />
    </section>
  );
}
