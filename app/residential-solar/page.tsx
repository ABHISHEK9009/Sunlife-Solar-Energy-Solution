import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import {
  Home,
  CheckCircle2,
  Zap,
  TrendingDown,
  ShieldCheck,
  Phone,
  ArrowRight,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";
import { SolarCalculator } from "@/components/calculator/SolarCalculator";

export const metadata: Metadata = {
  title: "Residential Rooftop Solar Installation in Narmadapuram | Sunlife Solar",
  description:
    "Cut home electricity bills with high-efficiency residential rooftop solar systems in Narmadapuram and MP. Net metering, subsidy assistance, and 25-year panel warranty.",
};

export default function ResidentialSolarPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block">
                Residential Rooftop Solar
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
                Solar Power for Indian Homes & Independent Villas
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Slash your domestic electricity bills, protect your family against escalating tariffs, and generate your own clean power with rooftop solar systems engineered for Indian terraces.
              </p>
            </div>
            <div className="lg:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl border border-white/15">
              <Image
                src="/images/residential-solar.jpg"
                alt="Residential Rooftop Solar Installation by Sunlife Solar"
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
                Why Indian Homeowners Are Switching to Rooftop Solar
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                With air conditioning, geysers, refrigerators, and heavy household appliances running daily, domestic electricity bills often exceed ₹3,000 to ₹10,000+ each month. An on-grid residential solar power system generates electricity right above your living space, feeding surplus power back to the grid via bidirectional Net Metering.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-solar-emerald" />
                    <span>Typical System Sizing: 2 kW to 10 kW</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    A 3 kW system typically generates 12–14 units per day, covering 80% to 95% of an average 3-BHK household&apos;s daily electricity demand.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-solar-emerald" />
                    <span>Elevated Structures to Retain Terrace Utility</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    We can install elevated hot-dip GI structures (6 to 9 feet height), allowing you to walk, sit, and utilize your rooftop freely underneath the panels.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-solar-emerald" />
                    <span>Government Subsidy Guidance</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    We guide you through PM Surya Ghar / National Rooftop Portal applications and DISCOM documentation for eligible domestic installations.
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

      {/* Calculator on Page */}
      <section className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold font-heading text-slate-900">
              Calculate Your Home Solar Savings
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Select your monthly power bill to estimate required capacity and payback.
            </p>
          </div>
          <SolarCalculator standalone />
        </div>
      </section>
    </div>
  );
}
