import React from "react";
import { Calendar, Home, MapPin, Wrench } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function TrustStrip() {
  const indicators = [
    {
      icon: Calendar,
      title: "Since 2021",
      subtitle: "Solar Energy Solutions",
      highlight: siteConfig.foundedDateFormatted,
    },
    {
      icon: Home,
      title: "Residential & Commercial",
      subtitle: "Solar Installation",
      highlight: "On-Grid & Hybrid",
    },
    {
      icon: MapPin,
      title: "Local Expertise",
      subtitle: "Narmadapuram, MP",
      highlight: "Malakhedi Office",
    },
    {
      icon: Wrench,
      title: "End-to-End Support",
      subtitle: "Consultation → Commissioning",
      highlight: "Full Handover",
    },
  ];

  return (
    <section className="bg-slate-900 border-y border-emerald-950/80 py-6 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {indicators.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-solar-deep/80 text-sun-amber flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-heading font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
