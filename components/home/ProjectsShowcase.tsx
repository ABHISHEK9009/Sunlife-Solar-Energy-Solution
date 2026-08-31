"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Zap, ArrowRight, Sun, Filter } from "lucide-react";

export function ProjectsShowcase() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const projects = [
    {
      title: "Residential Rooftop Solar System",
      location: "Narmadapuram, Madhya Pradesh",
      category: "Residential",
      capacity: "5 kW On-Grid",
      image: "/images/hero-solar.jpg",
      description: "High-efficiency Mono-PERC rooftop installation providing clean solar power for a residential home in Narmadapuram.",
    },
    {
      title: "Commercial Complex Rooftop Solar",
      location: "Itarsi, Madhya Pradesh",
      category: "Commercial",
      capacity: "20 kW On-Grid",
      image: "/images/commercial-solar.jpg",
      description: "Custom grid-tied commercial rooftop installation engineered to offset high day-time office and lighting loads.",
    },
    {
      title: "Independent Villa Rooftop Solar",
      location: "Malakhedi, Narmadapuram",
      category: "Residential",
      capacity: "3.3 kW On-Grid",
      image: "/images/residential-solar.jpg",
      description: "South-facing terrace solar setup with elevated structure to maintain terrace accessibility for the family.",
    },
    {
      title: "Industrial Warehouse Rooftop Array",
      location: "Central Madhya Pradesh",
      category: "Industrial",
      capacity: "50 kW On-Grid",
      image: "/images/industrial-solar.jpg",
      description: "Heavy-duty solar panel installation on industrial metal shed roof with multi-point chemical earthing and lightning protection.",
    },
  ];

  const filtered =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-emerald-100/80 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Field Installations
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-950 tracking-tight">
              Solar Installations That Make a Difference
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
              Representative rooftop solar installations engineered across Narmadapuram and neighboring Central MP districts.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {["All", "Residential", "Commercial", "Industrial"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-solar-deep text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid across widescreen */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-premium transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-solar-deep/90 backdrop-blur-md text-white rounded-full text-xs font-semibold">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-sun-amber text-slate-950 rounded-full text-xs font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {item.capacity}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-1 text-xs text-emerald-200 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-sun-amber" />
                      <span>{item.location}</span>
                    </div>
                    <h3 className="text-xl font-bold font-heading">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-solar-light text-solar-deep text-xs font-semibold border border-slate-200 transition-colors"
                >
                  <span>Inquire for Similar Installation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
