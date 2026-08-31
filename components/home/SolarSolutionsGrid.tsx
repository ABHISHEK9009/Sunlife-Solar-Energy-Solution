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
      desc: "Custom on-grid and hybrid rooftop solar solutions designed for independent houses, duplexes, and villas in Narmadapuram.",
      badge: "PM Surya Ghar",
      features: ["1 kW to 10 kW Custom Systems", "Subsidy up to ₹78,000 Support", "25-Year Panel Warranty"],
    },
    {
      title: "Commercial Solar",
      slug: "commercial-solar",
      icon: Building2,
      image: "/images/commercial-solar.jpg",
      tagline: "Reduce High Commercial Electricity Tariffs",
      desc: "High-yield solar systems for commercial complexes, offices, hospitals, private schools, colleges, and retail showrooms.",
      badge: "High ROI & Tax Deprec.",
      features: ["10 kW to 100 kW+ Plants", "Accelerated Depreciation", "Smart Monitoring App"],
    },
    {
      title: "Industrial Solar",
      slug: "industrial-solar",
      icon: Factory,
      image: "/images/industrial-solar.jpg",
      tagline: "Heavy Power Solutions for Production Units",
      desc: "Robust rooftop and shed-mounted solar installations for factories, processing plants, cold storages, and warehouses.",
      badge: "Heavy Continuous Loads",
      features: ["50 kW to 500 kW+ Engineering", "High Voltage Net Metering", "Heavy-Duty GI Structures"],
    },
    {
      title: "Rooftop Solar EPC",
      slug: "rooftop-solar",
      icon: Sun,
      image: "/images/hero-solar.jpg",
      tagline: "Gazebo, Elevated & Standard Structure EPC",
      desc: "End-to-end engineering, procurement, and construction with customized terrace elevations to preserve 100% usable rooftop space.",
      badge: "Full Usability",
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
          className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 md:mb-12"
        >
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-solar-light px-3.5 py-1.5 rounded-full inline-block mb-2 sm:mb-3">
            Tailored Engineering
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading text-slate-950 leading-tight">
            Solar Solutions Designed Around Your Needs
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-2 sm:mt-3 leading-relaxed">
            Whether for your family home in Narmadapuram or industrial shed in Central MP, our systems are engineered for maximum generation.
          </p>
        </motion.div>

        {/* Responsive Grid: 2 cols on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {solutions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 hover:border-emerald-500/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image Aspect */}
                  <div className="relative aspect-[16/11] sm:aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <Image
                      src={item.image}
                      alt={`${item.title} installation in Narmadapuram Madhya Pradesh`}
                      fill
                      className="object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                      <span className="text-[9px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/95 text-solar-dark backdrop-blur-md rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    </div>

                    {/* Icon & Title Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex items-center gap-1.5 sm:gap-2.5">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-solar-deep text-sun-amber flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-md">
                        <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-xs sm:text-base md:text-lg text-white leading-tight truncate">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-emerald-300 font-medium truncate hidden sm:block">
                          {item.tagline}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 sm:p-5 space-y-2 sm:space-y-3">
                    <p className="text-slate-600 text-[11px] sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {item.desc}
                    </p>

                    {/* Feature Bullets (Visible on desktop & tablet) */}
                    <div className="space-y-1 pt-1.5 border-t border-slate-100 hidden sm:block">
                      {item.features.map((feat, fidx) => (
                        <div key={fidx} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-solar-emerald shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom CTA Actions */}
                <div className="p-3 sm:p-5 pt-0 flex items-center justify-between gap-1.5 border-t border-slate-100/60 mt-1">
                  <Link
                    href={`/${item.slug}`}
                    className="text-[11px] sm:text-xs font-bold text-solar-deep hover:text-solar-dark inline-flex items-center gap-0.5 group/link truncate"
                  >
                    <span className="sm:hidden">Specs</span>
                    <span className="hidden sm:inline">Explore Specs</span>
                    <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>

                  <button
                    onClick={() => handleOpenQuote(item.title)}
                    className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-slate-900 hover:bg-solar-deep text-white text-[10px] sm:text-xs font-bold rounded-full transition-colors cursor-pointer shrink-0"
                  >
                    <span className="sm:hidden">Quote</span>
                    <span className="hidden sm:inline">Get Quote</span>
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
