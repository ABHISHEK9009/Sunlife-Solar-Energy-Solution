import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import {
  Calendar,
  UserCheck,
  ShieldCheck,
  MapPin,
  Phone,
  CheckCircle2,
  Award,
  Zap,
  ArrowRight,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";

export const metadata: Metadata = {
  title: "About Us | Sunlife Solar Energy Solution Narmadapuram",
  description:
    "Learn about Sunlife Solar Energy Solution, founded on 11 December 2021 by Rahul Kumar Bamne. Professional rooftop solar installation company based in Narmadapuram, Madhya Pradesh.",
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              About Sunlife Solar
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              Building a Cleaner Energy Future Since 2021
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
              Founded on <strong>11 December 2021</strong> in Narmadapuram, Madhya Pradesh, we are dedicated to making clean solar energy reliable, practical, and accessible for homes and businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Story & Standards (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
                Our Story & Mission
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                <strong>Sunlife Solar Energy Solution</strong> was established on <strong>{siteConfig.foundedDateFormatted}</strong> by founder <strong>{siteConfig.owner.name}</strong>. Operating from our central office at Vinayak Complex near Azad Chowk in Malakhedi, Narmadapuram, our mission is to eliminate confusion around solar adoption and deliver precision-engineered solar power plants.
              </p>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Rather than treating solar as a one-size-fits-all commodity, we conduct detailed mathematical load assessments, on-site shadow analyses, and structural evaluations to ensure that every system delivers maximum kWh generation over its entire 25-year lifespan.
              </p>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-lg font-bold font-heading text-slate-900 mb-4">
                  What Sets Sunlife Solar Apart:
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-solar-emerald" />
                      <span>Local Engineering Presence</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      We are permanently based in Narmadapuram, providing fast response times and dependable local maintenance.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <Zap className="w-4 h-4 text-sun-amber" />
                      <span>Tier-1 Component Selection</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      We only deploy ALMM-approved Mono-PERC modules, high-efficiency inverters, and hot-dip galvanized mounting structures.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <CheckCircle2 className="w-4 h-4 text-solar-emerald" />
                      <span>End-to-End Liaison</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      From DISCOM net metering approvals to national subsidy registration, our team handles all administrative steps.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <UserCheck className="w-4 h-4 text-solar-emerald" />
                      <span>Transparent Pricing</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Itemized quotes with clear technical specifications, no hidden charges, and realistic generation estimates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Founder Section */}
              <div className="p-6 sm:p-8 rounded-2xl bg-solar-light/60 border border-emerald-200/70 mt-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-200/60">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-solar-deep text-white flex items-center justify-center font-bold">
                      <UserCheck className="w-6 h-6 text-sun-amber" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold font-heading text-slate-900">
                        {siteConfig.owner.name}
                      </h4>
                      <div className="text-xs text-solar-emerald font-semibold">
                        Founder & Owner • Sunlife Solar Energy Solution
                      </div>
                    </div>
                  </div>
                  <Image
                    src="/logo/logo.png"
                    alt="Sunlife Solar Energy Solution"
                    width={180}
                    height={55}
                    className="h-9 w-auto object-contain"
                  />
                </div>

                <blockquote className="text-sm text-slate-700 italic leading-relaxed border-l-2 border-solar-deep pl-4">
                  “{siteConfig.owner.message}”
                </blockquote>

                <div className="pt-2 flex items-center gap-4 text-xs">
                  <a
                    href={`tel:${siteConfig.owner.phone}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-solar-deep text-white font-semibold hover:bg-solar-dark transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Directly: {siteConfig.owner.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Right Lead Form (5 cols) */}
            <div className="lg:col-span-5">
              <LeadQuoteForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
