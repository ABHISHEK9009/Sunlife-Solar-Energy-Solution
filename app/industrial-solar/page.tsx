import React from "react";
import Image from "next/image";
import { Metadata } from "next";
import {
  Factory,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Cpu,
  BarChart2,
} from "lucide-react";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";

export const metadata: Metadata = {
  title: "Industrial Solar Power Plant Installations | Sunlife Solar",
  description:
    "High-capacity industrial rooftop solar installations for factories, manufacturing facilities, and warehouses across Madhya Pradesh. Engineered for heavy continuous industrial loads.",
};

export default function IndustrialSolarPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block">
                High-Capacity Industrial Solar
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
                Solar Solutions for Factories, Warehouses & Manufacturing Plants
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Industrial solar power systems (50 kW to 500 kW+) engineered for heavy continuous motor loads, metal shed rooftops, and high-tension (HT) grid synchronization in Madhya Pradesh.
              </p>
            </div>
            <div className="lg:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl border border-white/15">
              <Image
                src="/images/industrial-solar.jpg"
                alt="Industrial Solar Plant Installation by Sunlife Solar"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
                Heavy-Duty Engineering for Industrial Applications
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Manufacturing facilities and cold storages operate with massive electricity bills that directly impact product margins. With vast unshaded corrugated metal shed roofs, industries are uniquely positioned to install high-capacity captive solar systems.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-solar-emerald" />
                    <span>Non-Penetrative Metal Roof Clamping</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    We use custom aluminium mini-rail and standing-seam clamps with EPDM rubber gaskets to guarantee 100% leak-proof installation on industrial tin sheds.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-solar-emerald" />
                    <span>Transformer & HT Grid Synchronisation</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    Seamless synchronization with LT/HT transformer setups, reverse power protection relays, and dedicated chemical earthing grid pits.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-solar-emerald" />
                    <span>Rapid Capital Amortization</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">
                    Industrial power consumers typically achieve complete capital payback within 3 to 4 years, enjoying 20+ years of practically zero-cost operational electricity.
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
