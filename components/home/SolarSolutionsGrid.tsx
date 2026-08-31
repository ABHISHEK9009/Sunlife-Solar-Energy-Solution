import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Home, Building2, Factory, Sun, ArrowRight, ShieldCheck } from "lucide-react";

export function SolarSolutionsGrid() {
  const solutions = [
    {
      title: "Residential Solar",
      tagline: "Homes, Villas & Independent Houses",
      description:
        "High-efficiency rooftop solar systems tailored for Indian households to slash electricity bills and claim eligible government subsidies.",
      image: "/images/residential-solar.jpg",
      icon: Home,
      href: "/residential-solar",
      cta: "Explore Residential Solar",
      capacity: "1 kW to 15 kW",
      features: ["On-Grid & Hybrid Options", "Net Metering Setup", "PM Surya Ghar Assistance"],
    },
    {
      title: "Commercial Solar",
      tagline: "Offices, Shops, Showrooms & Schools",
      description:
        "Custom engineered solar solutions for commercial establishments aiming to significantly cut operational day-time peak tariff expenses.",
      image: "/images/commercial-solar.jpg",
      icon: Building2,
      href: "/commercial-solar",
      cta: "Explore Commercial Solar",
      capacity: "10 kW to 100 kW+",
      features: ["Accelerated Depreciation", "High Daytime Offset", "Custom Structural Design"],
    },
    {
      title: "Industrial Solar",
      tagline: "Factories, Warehouses & Plants",
      description:
        "Heavy-duty solar installations built for high-consumption industrial loads, metal shed rooftops, and captive manufacturing plants.",
      image: "/images/industrial-solar.jpg",
      icon: Factory,
      href: "/industrial-solar",
      cta: "Explore Industrial Solar",
      capacity: "50 kW to 500 kW+",
      features: ["HT / LT Grid Sync", "High Wind Load GI Structures", "Remote SCADA Monitoring"],
    },
    {
      title: "Rooftop Solar Systems",
      tagline: "Unused Rooftop Space Optimization",
      description:
        "Transform inactive terrace space into high-yield clean power plants with elevated structures, maintaining rooftop usability.",
      image: "/images/hero-solar.jpg",
      icon: Sun,
      href: "/rooftop-solar",
      cta: "Explore Rooftop Solar",
      capacity: "Tailored to Rooftop Area",
      features: ["Elevated / Gazebo Mounts", "Waterproof Anchoring", "Walkway & Cleaning Access"],
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-solar-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Tailored Engineering
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-950 tracking-tight">
            Solar Solutions Designed Around Your Energy Needs
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            Whether for your family home in Narmadapuram, commercial showroom in Itarsi, or industrial shed in Central MP, our systems are engineered for maximum generation and reliability.
          </p>
        </div>

        {/* 4 Premium Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group rounded-3xl bg-white border border-slate-200/90 shadow-premium hover:shadow-premium-hover transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Card Image */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-solar-dark shadow-sm">
                        {item.capacity}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-sun-amber text-slate-950 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-sun-amber uppercase tracking-wider">
                          {item.tagline}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-heading">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 sm:p-7 space-y-4">
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {item.description}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {item.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <ShieldCheck className="w-4 h-4 text-solar-emerald shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer CTA */}
                <div className="p-6 pt-0">
                  <Link
                    href={item.href}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-50 group-hover:bg-solar-deep text-slate-800 group-hover:text-white text-sm font-semibold border border-slate-200 group-hover:border-solar-deep transition-all"
                  >
                    <span>{item.cta}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
