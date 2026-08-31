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
    <div className="w-full mx-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Top Header */}
        {standalone ? (
          <div className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 px-5 sm:px-10 py-6 sm:py-8 text-white">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sun-amber text-xs font-semibold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" /> Interactive Calculator
            </div>
            <h3 className="text-xl sm:text-3xl font-extrabold font-heading tracking-tight">
              Solar Savings & System Sizing Calculator
            </h3>
            <p className="text-emerald-100/85 text-xs sm:text-sm mt-1">
              Estimate your system capacity (kW), annual generation, and electricity bill savings in Central MP.
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-900 px-4 sm:px-8 py-3.5 sm:py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold font-heading">
              <Zap className="w-4 h-4 text-sun-amber" />
              <span>Solar Sizing & Savings Calculator</span>
            </div>
            <span className="text-[10px] sm:text-xs text-emerald-200 bg-white/10 px-2.5 py-1 rounded-full font-medium hidden xs:inline-block">
              MP Solar Irradiance
            </span>
          </div>
        )}

        {/* Body Grid */}
        <div className="p-4 sm:p-7 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Inputs (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* Property Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Property Type
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setPropertyType("residential")}
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
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

            {/* Bill Range Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Average Monthly Power Bill
                </label>
                <span className="text-xs sm:text-sm font-extrabold text-solar-deep bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {formatCurrency(bill)}
                </span>
              </div>

              <input
                type="range"
                min={1000}
                max={propertyType === "industrial" ? 150000 : 35000}
                step={500}
                value={bill}
                onChange={(e) => setBill(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-solar-deep focus:outline-none"
              />

              <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 mt-1 font-medium">
                <span>₹1,000 / mo</span>
                <span>{propertyType === "industrial" ? "₹1,50,000 / mo" : "₹35,000 / mo"}</span>
              </div>
            </div>

            {/* Location Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Installation Location
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] sm:text-xs flex items-start gap-2 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Calibrated at <strong>4.1 units/day per kW</strong> for MP solar irradiance conditions.
              </span>
            </div>
          </div>

          {/* Right Estimated Outputs (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200/80 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 sm:pb-4">
              <div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Recommended Capacity
                </span>
                <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-heading">
                  {results.systemSizeKw} <span className="text-sm sm:text-base font-semibold text-solar-deep">kW System</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Est. Roof Space
                </span>
                <div className="text-base sm:text-xl font-bold text-slate-800">
                  ~{results.roofAreaNeededSqFt} <span className="text-xs font-normal text-slate-500">sq. ft.</span>
                </div>
              </div>
            </div>

            {/* Metrics 2x2 Grid on Mobile & Desktop */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Annual Savings */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-solar-emerald mb-0.5">
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Annual Savings</span>
                </div>
                <div className="text-base sm:text-xl font-bold text-slate-900">
                  {formatCurrency(results.annualSavingsInr)}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  Year-1 estimated
                </div>
              </div>

              {/* Monthly Units */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-sun-amber mb-0.5">
                  <Sun className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Monthly Output</span>
                </div>
                <div className="text-base sm:text-xl font-bold text-slate-900">
                  ~{results.monthlyUnitsKwh} <span className="text-xs font-normal text-slate-500">units</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  ~{results.annualGenerationKwh} units/yr
                </div>
              </div>

              {/* Estimated Subsidy */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-solar-deep mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Subsidy Status</span>
                </div>
                <div className="text-base sm:text-xl font-bold text-emerald-600">
                  {propertyType === "residential" ? "Up to ₹78,000" : "Tax Deprec."}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  {propertyType === "residential" ? "PM Surya Ghar" : "Accelerated 40%"}
                </div>
              </div>

              {/* Payback Period */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 mb-0.5">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">Est. Payback</span>
                </div>
                <div className="text-base sm:text-xl font-bold text-slate-900">
                  ~{results.approximatePaybackYears} <span className="text-xs font-normal text-slate-500">Years</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  25-Year warranty
                </div>
              </div>
            </div>

            {/* Lifetime Benefit Strip */}
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-solar-deep to-emerald-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-xs text-emerald-200 font-semibold block">
                  CO₂ Offset / Year
                </span>
                <span className="text-base sm:text-xl font-extrabold text-sun-amber">
                  ~{results.estimatedCo2OffsetTonsYear} Tonnes
                </span>
              </div>
              <div className="text-right text-[10px] sm:text-xs text-emerald-200">
                <span className="block font-semibold">Trees Equiv.</span>
                <span className="text-white font-bold">~{results.treesEquivalent} Trees/yr</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-sun-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm md:text-base rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Exact Quotation For This System</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPropertyType={propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}
        defaultMonthlyBill={`₹${bill.toLocaleString("en-IN")}`}
        title="Claim Your Calculated Solar Quotation"
      />
    </div>
  );
}
