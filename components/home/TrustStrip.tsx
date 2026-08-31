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
    <section className="bg-slate-900 border-y border-emerald-950/80 py-6 sm:py-8 text-white">
      <div className="fluid-container">
        <div className="fluid-grid-4">
          {indicators.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group cursor-default"
              >
                <div className="w-11 h-11 rounded-xl bg-solar-deep/80 text-sun-amber flex items-center justify-center shrink-0 border border-emerald-700/40 group-hover:scale-110 group-hover:bg-solar-deep transition-all duration-300 shadow-md">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-heading font-bold text-sm sm:text-base text-white leading-tight">
                    {item.title}
                  </div>
                  <div className="text-xs text-emerald-300/80 mt-0.5">
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
