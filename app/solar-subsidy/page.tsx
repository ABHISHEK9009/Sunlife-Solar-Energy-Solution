import React from "react";
import { Metadata } from "next";
import { SubsidyOverview } from "@/components/home/SubsidyOverview";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";
import {
  FileCheck,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Solar Subsidy in Madhya Pradesh | PM Surya Ghar Guide & Eligibility",
  description:
    "Complete educational guide to rooftop solar subsidies in Madhya Pradesh under PM Surya Ghar Muft Bijli Yojana. Learn eligibility criteria, required documents, and application steps in Narmadapuram.",
};

export default function SolarSubsidyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Government Schemes & Policy
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              Understanding Solar Subsidies in Madhya Pradesh
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
              Everything residential homeowners need to know about central government rooftop solar financial incentives, DISCOM net metering guidelines, and National Portal procedures.
            </p>
          </div>
        </div>
      </section>

      {/* Subsidy Overview Component */}
      <SubsidyOverview />

      {/* Detailed Document & Process Breakdown */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
              PM Surya Ghar: Step-by-Step Subsidy Application Process
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Sunlife Solar guides you through every step of the National Portal registration and DISCOM approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-solar-deep font-bold text-sm flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold font-heading text-base text-slate-900">
                National Portal Registration
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register on the PM Surya Ghar National Portal using your MP electricity consumer number and mobile number.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-solar-deep font-bold text-sm flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold font-heading text-base text-slate-900">
                Technical Feasibility Approval
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Local DISCOM engineers assess transformer capacity and issue technical feasibility clearance.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-solar-deep font-bold text-sm flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold font-heading text-base text-slate-900">
                Installation by Sunlife Solar
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We install certified DCR (Domestic Content Requirement) solar modules and grid-tied inverters as per MNRE standards.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-solar-deep font-bold text-sm flex items-center justify-center">
                4
              </span>
              <h3 className="font-bold font-heading text-base text-slate-900">
                Net Metering & Subsidy Credit
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                DISCOM inspects the setup, installs the net meter, and the direct benefit transfer (DBT) subsidy is credited to your bank account.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Mandatory Compliance Notice:</strong> Government subsidy is strictly available for residential grid-connected systems using approved Domestic Content Requirement (DCR) solar modules. Commercial and industrial installations are not eligible for direct capital subsidies, but benefit from accelerated tax depreciation and significant operational cost savings.
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LeadQuoteForm />
        </div>
      </section>
    </div>
  );
}
