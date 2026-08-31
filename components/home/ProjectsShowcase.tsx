"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function ProjectsShowcase() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

  const projects = [
    {
      title: "5 kW Residential Rooftop Solar Plant",
      location: "Malakhedi, Narmadapuram",
      category: "Residential",
      capacity: "5 kW Grid-Tied",
      modules: "Mono-PERC 545W (Top-Tier)",
      image: "/images/residential-solar.jpg",
      result: "Generates ~20-22 units daily • Saves ~₹4,500 monthly",
    },
    {
      title: "25 kW Commercial Rooftop Installation",
      location: "Itarsi Main Market, MP",
      category: "Commercial",
      capacity: "25 kW On-Grid",
      modules: "High-Efficiency Monocrystalline",
      image: "/images/commercial-solar.jpg",
      result: "Powering 3-floor retail complex • ~38% power cost cut",
    },
    {
      title: "75 kW Industrial Factory Shed Plant",
      location: "Industrial Area, Central MP",
      category: "Industrial",
      capacity: "75 kW High-Voltage Net Meter",
      modules: "Bifacial Mono Modules",
      image: "/images/industrial-solar.jpg",
      result: "Heavy continuous machinery support • High depreciation ROI",
    },
    {
      title: "3 kW PM Surya Ghar Rooftop Setup",
      location: "Civil Lines, Narmadapuram",
      category: "Residential",
      capacity: "3 kW Standard Grid-Tied",
      modules: "DCR Compliant Modules",
      image: "/images/hero-solar.jpg",
      result: "Zero electricity bills • Received ₹78,000 Direct Subsidy",
    },
  ];

  const filtered =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <section className="section-py bg-slate-50 border-b border-slate-200/80">
      <div className="site-container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-emerald-100/80 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Field Installations
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading text-slate-950 leading-tight">
              Solar Installations That Make a Difference
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Representative rooftop solar installations engineered across Narmadapuram and neighboring Central MP districts.
            </p>
          </motion.div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {["All", "Residential", "Commercial", "Industrial"].map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-solar-deep text-white shadow-md"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Responsive Grid: 1 col on mobile, 2 cols on tablet, 4 cols on desktop */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <motion.div
                layout
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-emerald-500/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 text-solar-dark font-bold text-[10px] sm:text-[11px] rounded-full backdrop-blur-md shadow-sm">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-solar-emerald shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 leading-snug group-hover:text-solar-deep transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <Zap className="w-3.5 h-3.5 text-sun-amber shrink-0" />
                        <span className="truncate">{item.capacity}</span>
                      </div>
                      <p className="text-emerald-700 bg-emerald-50 p-2.5 rounded-xl font-medium leading-relaxed text-[11px] sm:text-xs">
                        {item.result}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 sm:mt-12 text-center"
        >
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-slate-900 hover:bg-solar-deep text-white font-bold text-xs sm:text-sm rounded-full transition-all group shadow-md"
          >
            <span>View Full Portfolio & Specifications</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
