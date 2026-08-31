"use client";

import React, { useState, useMemo } from "react";
import {
  Sun,
  Zap,
  TrendingDown,
  Clock,
  Leaf,
  ArrowRight,
  ShieldCheck,
  Building2,
  Home,
  Factory,
  Info,
} from "lucide-react";
import { calculateSolarRequirements, SolarCalculationInput } from "@/lib/solar-calculator";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function SolarCalculator({ standalone = false }: { standalone?: boolean }) {
  const [bill, setBill] = useState<number>(4500);
  const [propertyType, setPropertyType] = useState<"residential" | "commercial" | "industrial">("residential");
  const [city, setCity] = useState<string>("Narmadapuram");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const results = useMemo(() => {
    const input: SolarCalculationInput = {
      monthlyBill: bill,
      propertyType,
      city,
    };
    return calculateSolarRequirements(input);
  }, [bill, propertyType, city]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className={`w-full ${standalone ? "max-w-[1650px] mx-auto" : "max-w-[1650px] mx-auto"}`}>
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-950/10 overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-solar-dark via-solar-deep to-solar-emerald px-6 sm:px-10 py-7 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sun-amber text-xs font-semibold uppercase tracking-wider mb-2">
                <Zap className="w-3.5 h-3.5" /> Interactive Calculator
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
                Solar Savings & System Sizing Calculator
              </h3>
              <p className="text-emerald-100/85 text-xs sm:text-sm mt-1">
                Estimate your system capacity (kW), annual generation, and electricity bill savings in Central MP.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-xs">
              <Sun className="w-5 h-5 text-sun-amber" />
              <span>Calibrated for MP Solar Irradiance</span>
            </div>
          </div>
        </div>

        {/* Body Grid */}
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Inputs (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Property Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Property Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPropertyType("residential")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    propertyType === "residential"
                      ? "bg-solar-deep text-white border-solar-deep shadow-md"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Home className="w-4 h-4 mb-1" />
                  <span>Residential</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPropertyType("commercial")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    propertyType === "commercial"
                      ? "bg-solar-deep text-white border-solar-deep shadow-md"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="w-4 h-4 mb-1" />
                  <span>Commercial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPropertyType("industrial")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    propertyType === "industrial"
                      ? "bg-solar-deep text-white border-solar-deep shadow-md"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Factory className="w-4 h-4 mb-1" />
                  <span>Industrial</span>
                </button>
              </div>
            </div>

            {/* Monthly Bill Slider & Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Average Monthly Power Bill
                </label>
                <div className="text-lg font-extrabold text-solar-deep font-heading bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  {formatCurrency(bill)}
                </div>
              </div>

              <input
                type="range"
                min={1000}
                max={propertyType === "industrial" ? 150000 : 35000}
                step={500}
                value={bill}
                onChange={(e) => setBill(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-solar-deep focus:outline-none"
              />

              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                <span>₹1,000 / mo</span>
                <span>{propertyType === "industrial" ? "₹1,50,000 / mo" : "₹35,000 / mo"}</span>
              </div>
            </div>

            {/* Location Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. Installation Location
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar"
              >
                <option value="Narmadapuram">Narmadapuram (Hoshangabad)</option>
                <option value="Itarsi">Itarsi</option>
                <option value="Seoni Malwa">Seoni Malwa</option>
                <option value="Pipariya">Pipariya</option>
                <option value="Sohagpur">Sohagpur</option>
                <option value="Babai">Babai</option>
                <option value="Bhopal / Central MP">Other Central MP District</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Based on an average solar generation factor of <strong>4.1 units/day per kW</strong> in Madhya Pradesh climate conditions.
              </span>
            </div>
          </div>

          {/* Right Estimated Outputs (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 sm:p-7 border border-slate-200/70 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Recommended Capacity
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                  {results.systemSizeKw} <span className="text-lg font-semibold text-solar-deep">kW System</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Est. Roof Area
                </span>
                <div className="text-lg sm:text-xl font-bold text-slate-800">
                  ~{results.roofAreaNeededSqFt} <span className="text-xs font-normal text-slate-500">sq. ft.</span>
                </div>
              </div>
            </div>

            {/* Metrics 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Annual Savings */}
              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-solar-emerald mb-1">
                  <TrendingDown className="w-4 h-4" />
                  <span>Est. Annual Bill Savings</span>
                </div>
                <div className="text-2xl font-extrabold text-solar-dark font-heading">
                  {formatCurrency(results.annualSavingsInr)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Over 25-year panel lifespan
                </div>
              </div>

              {/* Annual Units Generation */}
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1">
                  <Sun className="w-4 h-4 text-sun-amber" />
                  <span>Est. Annual Generation</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-800 font-heading">
                  {results.annualGenerationKwh.toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-normal text-slate-500">Units / Year</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ~{(results.annualGenerationKwh / 12).toFixed(0)} units/month
                </div>
              </div>

              {/* Payback Period */}
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1">
                  <Clock className="w-4 h-4 text-solar-deep" />
                  <span>Indicative Payback</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-800 font-heading">
                  ~{results.approximatePaybackYears}{" "}
                  <span className="text-xs font-normal text-slate-500">Years</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Free electricity post-payback
                </div>
              </div>

              {/* Environmental Offset */}
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>Carbon Offset</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-800 font-heading">
                  {results.estimatedCo2OffsetTonsYear}{" "}
                  <span className="text-xs font-normal text-slate-500">Tons CO₂ / yr</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Equivalent to {results.treesEquivalent} planted trees
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-[11px] text-slate-500 italic bg-white/70 p-3 rounded-xl border border-slate-100">
              * {results.disclaimer}
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-solar-deep to-solar-emerald hover:from-solar-dark hover:to-solar-deep text-white font-semibold rounded-xl shadow-md shadow-emerald-950/15 hover:shadow-emerald-950/25 transition-all text-sm group cursor-pointer"
              >
                <span>Get an Accurate Solar Assessment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPropertyType={
          propertyType === "residential"
            ? "Residential"
            : propertyType === "commercial"
            ? "Commercial"
            : "Industrial"
        }
        defaultMonthlyBill={formatCurrency(bill)}
        title={`Solar Quote for ${results.systemSizeKw} kW System (${city})`}
      />
    </div>
  );
}
