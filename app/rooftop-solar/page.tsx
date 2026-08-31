import React from "react";
import Image from "next/image";
import { Metadata } from "next";
import {
  Sun,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Compass,
  Layers,
} from "lucide-react";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";
import { SolarCalculator } from "@/components/calculator/SolarCalculator";

export const metadata: Metadata = {
  title: "Rooftop Solar Systems | Structural Engineering & Terrace Optimization",
  description:
    "Maximize your unused terrace with engineered rooftop solar mounting structures: Elevated frames, flush mounts, and tin shed solutions by Sunlife Solar Narmadapuram.",
};

export default function RooftopSolarPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block">
                Rooftop Solar Engineering
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
                Turn Your Unused Rooftop into a Clean Energy Generator
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Whether you have an RCC concrete flat roof, sloped tiled roof, or metal industrial shed, our mounting systems are designed for high wind tolerance and maximum generation yield.
              </p>
            </div>
            <div className="lg:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl border border-white/15">
              <Image
                src="/images/hero-solar.jpg"
                alt="Rooftop Solar Structural Engineering by Sunlife Solar"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Details */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
                Customized Rooftop Structural Engineering
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                A common hesitation among homeowners and building managers is losing the usability of their terrace. At Sunlife Solar Energy Solution, we offer customized structural mounting options to preserve roof space while achieving optimal solar tilt angles.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-solar-emerald" />
                    <span>Elevated Gazebo / Pergola Structures</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    Solar panels are mounted 7 to 9 feet above the roof surface on sturdy hot-dip GI columns, creating a shaded canopy that keeps the building cooler while preserving terrace space for leisure, walking, and social gatherings.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-solar-emerald" />
                    <span>True-South Orientation & Optimized Tilt</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    In Narmadapuram (latitude ~22.7° N), panels are oriented due South with a calibrated 20°–24° tilt to balance summer and winter energy output without excessive wind drag.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-solar-emerald" />
                    <span>Wind-Rated Hot-Dip Galvanized Iron (GI)</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    Corrosion-resistant structures engineered to withstand severe weather and wind gusts up to 150 km/h with stainless steel (SS304) fasteners.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <LeadQuoteForm />
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SolarCalculator standalone />
        </div>
      </section>
    </div>
  );
}
