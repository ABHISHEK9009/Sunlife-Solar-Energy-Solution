"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, TrendingUp, ArrowRight, Zap } from "lucide-react";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function ProblemOpportunity() {
  const [modalOpen, setModalOpen] = useState(false);

  const points = [
    {
      title: "Generate Your Own Clean Electricity",
      description: "Convert daily sunlight on your terrace into immediate power for your ACs, appliances, and machines.",
    },
    {
      title: "Reduce Dependence on Grid Power",
      description: "Protect your household or enterprise budget against escalating per-unit DISCOM tariffs over the next 25 years.",
    },
    {
      title: "Improve Long-Term Energy Economics",
      description: "A one-time capital investment that pays for itself in 3–5 years, providing practically free power thereafter.",
    },
    {
      title: "Make Better Use of Rooftop Space",
      description: "Transform inactive, sun-exposed terrace or factory shed space into an active revenue-saving asset.",
    },
    {
      title: "Transition Toward Sustainable Energy",
      description: "Offset metric tons of carbon emissions and actively participate in India’s green energy transition.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column (5 Cols): Real Installation Photograph */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/installation-solar.jpg"
                  alt="Sunlife Solar technicians working on rooftop solar structure in MP"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-solar-light text-solar-deep flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-solar-emerald">
                      Rising Grid Costs
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      Rooftop Solar Stabilizes Your Energy Bill
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): The Explanation */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-solar-deep text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> Energy Economics & Savings
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-slate-950 tracking-tight leading-tight">
              Your Electricity Bill Doesn’t Have to Keep Rising
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Electricity costs represent an ongoing, unavoidable recurring expense for homes, shops, and factories. As tariffs periodically increase, installing an on-grid rooftop solar system provides long-term cost predictability and immediate savings.
            </p>

            <div className="space-y-3.5 pt-2">
              {points.map((pt, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-solar-deep flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {pt.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                      {pt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/solar-calculator"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-solar-deep hover:bg-solar-dark text-white text-sm font-semibold rounded-xl shadow-md transition-all group"
              >
                <span>Calculate Your Savings</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-sm font-semibold rounded-xl transition-all"
              >
                Request Free Site Visit
              </button>
            </div>
          </div>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule a Free Rooftop Site Visit"
      />
    </section>
  );
}
