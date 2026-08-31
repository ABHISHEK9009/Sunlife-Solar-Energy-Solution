import React from "react";
import { Metadata } from "next";
import { SolarCalculator } from "@/components/calculator/SolarCalculator";
import { Zap, HelpCircle, Info, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Solar Calculator | Estimate System Size, Generation & Savings in MP",
  description:
    "Calculate your rooftop solar capacity (kW), required shadow-free terrace space, annual unit generation, and estimated power bill savings in Narmadapuram and Madhya Pradesh.",
};

export default function SolarCalculatorPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-28 sm:pt-32 pb-16">
      <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-emerald-100/80 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Interactive Solar Sizing Engine
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading text-slate-950 tracking-tight">
            Solar Savings & System Sizing Calculator
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            Use our interactive estimator calibrated for Central India’s solar irradiance levels. Adjust your average monthly bill to see your recommended kW capacity, rooftop area requirement, and indicative 25-year financial savings.
          </p>
        </div>

        {/* The Calculator Engine */}
        <SolarCalculator standalone />

        {/* Mathematical Explanation & Methodology */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm max-w-5xl mx-auto space-y-6">
          <h3 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-solar-deep" />
            <span>How We Calculate Your Solar Potential</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <strong className="text-slate-900 block text-sm">
                1. Daily Generation Factor
              </strong>
              In Narmadapuram and Madhya Pradesh, a 1 kW grid-tied solar system produces an average of <strong>4.0 to 4.2 units (kWh)</strong> of electricity per day across 300+ sunny days annually (~1,480 units/year per kW).
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <strong className="text-slate-900 block text-sm">
                2. Rooftop Area Requirement
              </strong>
              Modern high-efficiency 540W+ Mono-PERC / TopCon photovoltaic modules require approximately <strong>80 to 90 sq. ft.</strong> of shadow-free rooftop space per kW of capacity.
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <strong className="text-slate-900 block text-sm">
                3. Payback & ROI Formula
              </strong>
              Payback period is calculated by dividing the estimated gross system cost by your projected annual electricity bill savings. Central Indian consumers typically break even in <strong>3.2 to 4.5 years</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
