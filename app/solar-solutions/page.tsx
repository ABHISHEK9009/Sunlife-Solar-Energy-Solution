import React from "react";
import { Metadata } from "next";
import { SolarSolutionsGrid } from "@/components/home/SolarSolutionsGrid";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";
import { Zap, ShieldCheck, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Solar Solutions | Residential, Commercial & Industrial Rooftop Solar",
  description:
    "Explore comprehensive solar solutions from Sunlife Solar Energy Solution in Narmadapuram: Residential rooftop solar, commercial solar systems, industrial plants, and custom rooftop engineering.",
};

export default function SolarSolutionsPage() {
  return (
    <div className="bg-white">
      {/* Page Hero */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="fluid-container">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Comprehensive Solar Solutions
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              Solar Systems Engineered for Every Energy Requirement
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
              From independent home rooftops in Narmadapuram to commercial buildings in Itarsi and high-demand manufacturing sheds across MP.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <SolarSolutionsGrid />

      {/* Process Section */}
      <HowItWorks />

      {/* Consultation Section */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LeadQuoteForm />
        </div>
      </section>
    </div>
  );
}
