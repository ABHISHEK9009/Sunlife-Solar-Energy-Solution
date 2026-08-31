import React from "react";
import { Metadata } from "next";
import { ProjectsShowcase } from "@/components/home/ProjectsShowcase";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";
import { Award, ShieldCheck, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Projects & Installations Showcase | Sunlife Solar Energy Solution",
  description:
    "Explore rooftop solar installation projects completed by Sunlife Solar Energy Solution across Narmadapuram, Itarsi, and Madhya Pradesh.",
};

export default function ProjectsPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="fluid-container">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Installation Portfolio
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              Solar Installations That Make a Difference
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
              Showcase of on-grid and hybrid rooftop solar systems engineered for homes, commercial complexes, and industrial warehouses in Narmadapuram and across Central MP.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Showcase with filters */}
      <ProjectsShowcase />

      {/* Project Inquiry Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LeadQuoteForm />
        </div>
      </section>
    </div>
  );
}
