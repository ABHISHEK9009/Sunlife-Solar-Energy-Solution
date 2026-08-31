"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Building2, MapPin, Wrench } from "lucide-react";

export function TrustStrip() {
  const indicators = [
    {
      icon: ShieldCheck,
      title: "Since 2021",
      desc: "Solar Energy Solutions",
    },
    {
      icon: Building2,
      title: "Residential & Commercial",
      desc: "Solar Installation",
    },
    {
      icon: MapPin,
      title: "Local Expertise",
      desc: "Narmadapuram, MP",
    },
    {
      icon: Wrench,
      title: "End-to-End Support",
      desc: "Consultation → Commissioning",
    },
  ];

  return (
    <section className="bg-slate-900 border-y border-emerald-950/80 py-5 sm:py-7 text-white">
      <div className="site-container">
        {/* Responsive Grid: 2 columns on Mobile, 4 columns on Tablet & Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {indicators.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group cursor-default"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-solar-deep/80 text-sun-amber flex items-center justify-center shrink-0 border border-emerald-700/40 group-hover:scale-105 group-hover:bg-solar-deep transition-all duration-300 shadow-md">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-heading font-bold text-xs sm:text-sm md:text-base text-white leading-tight truncate sm:whitespace-normal">
                    {item.title}
                  </div>
                  <div className="text-[10px] sm:text-xs text-emerald-300/80 mt-0.5 truncate sm:whitespace-normal">
                    {item.desc}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
