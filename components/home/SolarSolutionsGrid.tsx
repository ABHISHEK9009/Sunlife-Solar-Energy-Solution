"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Building2, Factory, Sun, ArrowRight, ShieldCheck } from "lucide-react";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function SolarSolutionsGrid() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState("Residential");

  const solutions = [
    {
      title: "Residential Solar",
      slug: "residential-solar",
      icon: Home,
      image: "/images/residential-solar.jpg",
      tagline: "Cut up to 90% from Home Power Bills",
      desc: "Custom on-grid and hybrid rooftop solar solutions designed for independent houses, duplexes, and villas in Narmadapuram and nearby towns.",
      badge: "PM Surya Ghar",
      features: ["1 kW to 10 kW Custom Systems", "Subsidy up to ₹78,000 Support", "25-Year Panel Warranty"],
    },
    {
      title: "Commercial Solar",
      slug: "commercial-solar",
      icon: Building2,
      image: "/images/commercial-solar.jpg",
      tagline: "Reduce High Commercial Electricity Tariffs",
      desc: "High-yield solar systems for commercial complexes, offices, hospitals, private schools, colleges, and retail showrooms across Madhya Pradesh.",
      badge: "High ROI & Tax Deprec.",
      features: ["10 kW to 100 kW+ Plants", "Accelerated Depreciation", "Smart Monitoring App"],
    },
    {
      title: "Industrial Solar",
      slug: "industrial-solar",
      icon: Factory,
      image: "/images/industrial-solar.jpg",
      tagline: "Heavy Power Solutions for Production Units",
      desc: "Robust rooftop and shed-mounted solar installations for factories, processing plants, cold storages, and warehouses in Central MP.",
      badge: "Heavy Continuous Loads",
      features: ["50 kW to 500 kW+ Engineering", "High Voltage Net Metering", "Heavy-Duty GI Structures"],
    },
    {
      title: "Rooftop Solar EPC",
      slug: "rooftop-solar",
      icon: Sun,
      image: "/images/hero-solar.jpg",
      tagline: "Gazebo, Elevated & Standard Structure EPC",
      desc: "End-to-end engineering, procurement, and construction with customized terrace elevations to preserve 100% usable rooftop recreation space.",
      badge: "Full Terrace Usability",
      features: ["High-Rise Elevated Frames", "Mono-PERC Modules", "MP DISCOM Meter Liaison"],
    },
  ];

  const handleOpenQuote = (solutionTitle: string) => {
    setSelectedSolution(solutionTitle);
    setModalOpen(true);
  };

  return (
    <section className="section-py bg-white">
      <div className="site-container">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-14"
        >
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-solar-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Tailored Engineering
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading text-slate-950 leading-tight">
            Solar Solutions Designed Around Your Energy Needs
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Whether for your family home in Narmadapuram, commercial showroom in Itarsi, or industrial shed in Central MP, our systems are engineered for maximum generation.
          </p>
        </motion.div>

        {/* Responsive Grid: 1 col on mobile, 2 cols on tablet/sm, 4 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {solutions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -5 }}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-emerald-500/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image Aspect */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <Image
                      src={item.image}
                      alt={`${item.title} installation in Narmadapuram Madhya Pradesh`}
                      fill
                      className="object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 bg-white/95 text-solar-dark backdrop-blur-md rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    </div>

                    {/* Icon & Title Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-solar-deep text-sun-amber flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-md">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-base sm:text-lg text-white leading-tight truncate">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-emerald-300 font-medium truncate">
                          {item.tagline}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      {item.desc}
                    </p>

                    {/* Feature Bullets */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {item.features.map((feat, fidx) => (
                        <div key={fidx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-solar-emerald shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom CTA Actions */}
                <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-100/60 mt-2">
                  <Link
                    href={`/${item.slug}`}
                    className="text-xs font-bold text-solar-deep hover:text-solar-dark inline-flex items-center gap-1 group/link"
                  >
                    <span>Explore Specs</span>
                    <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                  </Link>

                  <button
                    onClick={() => handleOpenQuote(item.title)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-solar-deep text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Get Quote
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultPropertyType={selectedSolution}
        title={`Get Free Quote for ${selectedSolution}`}
      />
    </section>
  );
}
