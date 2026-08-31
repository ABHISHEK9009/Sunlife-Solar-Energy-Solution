import React from "react";
import Image from "next/image";
import { Metadata } from "next";
import {
  Building2,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Zap,
  BarChart3,
} from "lucide-react";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";
import { SolarCalculator } from "@/components/calculator/SolarCalculator";

export const metadata: Metadata = {
  title: "Commercial Rooftop Solar Solutions in Narmadapuram & MP | Sunlife Solar",
  description:
    "Cut business operating expenses with commercial solar installations for offices, showrooms, schools, hospitals, and shopping complexes in Narmadapuram & Central MP.",
};

export default function CommercialSolarPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block">
                Commercial Solar EPC
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
                Commercial Solar for Offices, Showrooms, Schools & Hospitals
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Offset expensive day-time peak electricity tariffs, leverage accelerated tax depreciation, and convert vacant commercial rooftops into clean energy assets.
              </p>
            </div>
            <div className="lg:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl border border-white/15">
              <Image
                src="/images/commercial-solar.jpg"
                alt="Commercial Rooftop Solar Installation by Sunlife Solar"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
                Strategic Energy Cost Reduction for Businesses
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Commercial establishments incur high non-domestic power tariffs (ranging from ₹8.5 to ₹10+ per unit in MP). Because commercial energy demand peaks during standard daytime business hours (9:00 AM to 6:00 PM), solar power directly offsets your most expensive electricity consumption.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-solar-emerald" />
                    <span>Accelerated Tax Depreciation Benefits</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    Commercial businesses can claim up to 40% accelerated depreciation on solar capital assets under Indian Income Tax regulations, significantly reducing net tax outgo in the initial years.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-solar-emerald" />
                    <span>Heavy Daytime Peak Load Shaving</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    Air conditioning, lighting, servers, and computational equipment run exactly when solar output is at its highest, minimizing reliance on the power grid during peak tariff slabs.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-solar-emerald" />
                    <span>High-Reliability String Inverters & Monitoring</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    Industrial-grade three-phase inverters equipped with mobile and cloud telemetry to monitor per-panel generation, daily yield, and system health in real-time.
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
    </div>
  );
}
