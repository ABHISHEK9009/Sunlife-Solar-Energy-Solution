import React from "react";
import Link from "next/link";
import { MapPin, Navigation, CheckCircle2, ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function LocalSEOSnippet() {
  const towns = [
    { name: "Narmadapuram", detail: "Primary Headquarters & Malakhedi Office" },
    { name: "Itarsi", detail: "Commercial, Industrial & Rooftop Solar Installations" },
    { name: "Seoni Malwa", detail: "Residential Rooftop & Farm Solar Solutions" },
    { name: "Pipariya", detail: "Rooftop & Commercial Solar EPC Systems" },
    { name: "Sohagpur", detail: "Residential On-Grid Solar & Subsidy Setup" },
    { name: "Babai & District Region", detail: "Complete Site Assessment & Grid Liaison" },
  ];

  return (
    <section className="fluid-py bg-slate-900 text-white border-y border-emerald-950">
      <div className="fluid-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Description (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar-deep text-emerald-200 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-sun-amber" />
              <span>Narmadapuram & Surrounding Region</span>
            </div>

            <h2 className="fluid-h2 font-extrabold font-heading text-white">
              Your Trusted Local Rooftop Solar Partner
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              As a dedicated local <strong>solar company in Narmadapuram</strong>, Sunlife Solar Energy Solution provides end-to-end <strong>solar panel installation in Narmadapuram</strong>, Itarsi, and surrounding Madhya Pradesh districts.
            </p>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              From residential rooftop solar installation under government schemes to large-scale commercial solar EPC and industrial setups, our engineering team ensures optimal panel orientation, shadow-free terrace designs, and seamless DISCOM net metering connectivity.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sun-amber hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>Visit Our Office in Malakhedi</span>
              </Link>
            </div>
          </div>

          {/* Right Towns List (5 cols) */}
          <div className="lg:col-span-5 bg-white/[0.04] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
              Key Local Service Areas
            </div>

            {towns.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-sun-amber shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.detail}</div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
