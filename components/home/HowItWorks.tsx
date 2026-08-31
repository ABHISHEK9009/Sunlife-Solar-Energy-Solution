"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileSearch,
  PenTool,
  FileCheck2,
  Hammer,
  Activity,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function HowItWorks() {
  const [modalOpen, setModalOpen] = useState(false);

  const steps = [
    {
      num: "01",
      icon: FileSearch,
      title: "Site Survey & Assessment",
      desc: "Detailed on-site inspection, shadow analysis, roof structure verification, and electrical load profiling.",
    },
    {
      num: "02",
      icon: PenTool,
      title: "System Design & Proposal",
      desc: "Custom 3D layout, module configuration, single-line diagrams, and transparent itemized quote.",
    },
    {
      num: "03",
      icon: FileCheck2,
      title: "Approvals & Subsidy Liaison",
      desc: "Complete documentation filing on PM Surya Ghar portal and MP Discom net metering permission.",
    },
    {
      num: "04",
      icon: Hammer,
      title: "Precision Installation",
      desc: "Mounting of hot-dip GI structures, Tier-1 Mono-PERC modules, micro/string inverters, and lightning earthing.",
    },
    {
      num: "05",
      icon: Activity,
      title: "Net Metering & Commissioning",
      desc: "Discom meter testing, bidirectional net-meter installation, and seamless grid synchronization.",
    },
    {
      num: "06",
      icon: CheckCircle2,
      title: "Lifetime Support & Monitoring",
      desc: "Mobile app generation tracking, system handover, warranty documentation, and periodic maintenance.",
    },
  ];

  return (
    <section className="fluid-py bg-white">
      <div className="fluid-container">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-solar-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Systematic Execution
          </span>
          <h2 className="fluid-h2 font-extrabold font-heading text-slate-950">
            How It Works: Our 6-Step Installation Process
          </h2>
          <p className="fluid-p text-slate-600 mt-3 leading-relaxed">
            From your first inquiry in Narmadapuram to final grid synchronization, we handle every technical and liaison step with total transparency.
          </p>
        </motion.div>

        {/* Intrinsic Fluid 6-Step Grid with Sequential Step Animation */}
        <div className="fluid-grid-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative p-6 rounded-3xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-emerald-500/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Step Number */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-extrabold font-heading text-slate-300 group-hover:text-solar-emerald transition-colors">
                    {item.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-solar-deep text-solar-deep group-hover:text-sun-amber flex items-center justify-center shadow-sm border border-slate-200 group-hover:border-transparent transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Central CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-14 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-solar-deep hover:bg-solar-dark text-white font-bold text-sm sm:text-base rounded-full shadow-lg shadow-emerald-950/20 transition-all group cursor-pointer"
          >
            <span>Book Your Free Site Assessment</span>
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
