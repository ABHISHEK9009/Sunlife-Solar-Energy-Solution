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
      title: "Site Survey",
      desc: "On-site shadow analysis, roof verification & electrical load profiling.",
    },
    {
      num: "02",
      icon: PenTool,
      title: "System Design",
      desc: "Custom 3D layout, module configuration & transparent proposal.",
    },
    {
      num: "03",
      icon: FileCheck2,
      title: "Subsidy Liaison",
      desc: "National portal filing & MP DISCOM net-metering permission.",
    },
    {
      num: "04",
      icon: Hammer,
      title: "Installation",
      desc: "Hot-dip GI structures, Mono-PERC modules & certified earthing.",
    },
    {
      num: "05",
      icon: Activity,
      title: "Net Metering",
      desc: "Bidirectional meter testing & grid synchronization.",
    },
    {
      num: "06",
      icon: CheckCircle2,
      title: "Support & App",
      desc: "Live generation tracking, system handover & warranty.",
    },
  ];

  return (
    <section className="section-py bg-white">
      <div className="site-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-14"
        >
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-solar-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Systematic Execution
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading text-slate-950 leading-tight">
            How It Works: Our 6-Step Process
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            From initial roof survey in Narmadapuram to final grid synchronization, we handle every step with total transparency.
          </p>
        </motion.div>

        {/* Responsive Grid: 2 cols on Mobile, 3 cols on Tablet, 6 cols on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 md:gap-5">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-emerald-500/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Step Number & Icon */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl sm:text-2xl font-extrabold font-heading text-slate-300 group-hover:text-solar-emerald transition-colors">
                    {item.num}
                  </span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white group-hover:bg-solar-deep text-solar-deep group-hover:text-sun-amber flex items-center justify-center shadow-sm border border-slate-200 group-hover:border-transparent transition-all duration-300 shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <h3 className="font-heading font-bold text-xs sm:text-sm md:text-base text-slate-900 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Central CTA */}
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
