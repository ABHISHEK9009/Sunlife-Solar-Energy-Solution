import React from "react";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ProblemOpportunity } from "@/components/home/ProblemOpportunity";
import { SolarSolutionsGrid } from "@/components/home/SolarSolutionsGrid";
import { WhySolar } from "@/components/home/WhySolar";
import { SolarCalculator } from "@/components/calculator/SolarCalculator";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ProjectsShowcase } from "@/components/home/ProjectsShowcase";
import { AboutSnippet } from "@/components/home/AboutSnippet";
import { LocalSEOSnippet } from "@/components/home/LocalSEOSnippet";
import { SubsidyOverview } from "@/components/home/SubsidyOverview";
import { FAQAccordion } from "@/components/home/FAQAccordion";
import { siteFaqs } from "@/lib/faqs-data";
import { FinalCTA } from "@/components/home/FinalCTA";
import { FAQJsonLd } from "@/components/seo/JsonLd";

export default function HomePage() {
  return (
    <>
      <FAQJsonLd faqs={siteFaqs} />

      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Trust Strip */}
      <TrustStrip />

      {/* 3. Problem / Opportunity Section */}
      <ProblemOpportunity />

      {/* 4. Solar Solutions Grid */}
      <SolarSolutionsGrid />

      {/* 5. Why Solar Benefits */}
      <WhySolar />

      {/* 6. Solar Savings & Sizing Calculator Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-emerald-50/40 border-b border-emerald-950/10" id="calculator">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-solar-light px-3.5 py-1.5 rounded-full inline-block mb-3">
              Instant Estimation
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-950 tracking-tight">
              Calculate Your Solar Potential & Payback
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Adjust your monthly electricity bill to see your required system capacity and indicative 25-year financial savings.
            </p>
          </div>

          <SolarCalculator />
        </div>
      </section>

      {/* 7. Installation Process (How It Works) */}
      <HowItWorks />

      {/* 8. Projects Showcase */}
      <ProjectsShowcase />

      {/* 9. About Sunlife & Founder Spotlight */}
      <AboutSnippet />

      {/* 10. Local SEO & Madhya Pradesh Service Network */}
      <LocalSEOSnippet />

      {/* 11. Subsidy & Government Schemes Information */}
      <SubsidyOverview />

      {/* 12. SEO-Friendly FAQs Accordion */}
      <FAQAccordion />

      {/* 13. Final High-Conversion CTA Banner */}
      <FinalCTA />
    </>
  );
}
