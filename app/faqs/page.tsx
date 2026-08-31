import React from "react";
import { Metadata } from "next";
import { FAQAccordion } from "@/components/home/FAQAccordion";
import { siteFaqs } from "@/lib/faqs-data";
import { FAQJsonLd } from "@/components/seo/JsonLd";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQs) | Sunlife Solar Energy Solution",
  description:
    "Find clear answers regarding solar panel installation costs, net metering procedures, roof area requirements, government subsidies, and maintenance in Narmadapuram, MP.",
};

export default function FAQsPage() {
  return (
    <div className="bg-white">
      <FAQJsonLd faqs={siteFaqs} />

      {/* Header */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Knowledge Base
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              Frequently Asked Questions About Solar
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
              Clear, transparent answers to help you evaluate rooftop solar feasibility, costs, net metering, and maintenance in Madhya Pradesh.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs List */}
      <FAQAccordion />

      {/* Form */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LeadQuoteForm />
        </div>
      </section>
    </div>
  );
}
