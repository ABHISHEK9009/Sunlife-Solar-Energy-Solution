import React from "react";
import Image from "next/image";
import { Metadata } from "next";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";
import {
  Wrench,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Cpu,
  FileCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Solar Panel Installation Process & Engineering Standards | Sunlife Solar",
  description:
    "Discover the rigorous 6-step solar panel installation process, earthing protocols, and DISCOM commissioning standards followed by Sunlife Solar Energy Solution in Narmadapuram.",
};

export default function SolarInstallationPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block">
                Precision Engineering
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
                Professional Solar Panel Installation & Standards
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                A solar power plant is an active electrical generation station designed to operate continuously for 25 years. We ensure uncompromised structural integrity, electrical safety, and flawless net metering synchronization.
              </p>
            </div>
            <div className="lg:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl border border-white/15">
              <Image
                src="/images/installation-solar.jpg"
                alt="Solar Technicians installing solar array in Narmadapuram"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6 Step Visual Process */}
      <HowItWorks />

      {/* Technical Standards Section */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
              Our 4-Point Installation Quality Protocol
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Every system commissioned by Sunlife Solar undergoes rigorous testing before client handover.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-solar-light text-solar-deep flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                1. Multi-Point Chemical Earthing & Surge Protection
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We install dedicated, low-resistance chemical earthing pits for AC, DC, and Lightning Arresters (LA) to protect your home and solar electronics against lightning strikes and power surges.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-solar-light text-solar-deep flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                2. UV-Resistant Dual-Insulated DC Cabling
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                TUV-certified 4 sq. mm / 6 sq. mm pure copper solar DC cables routed inside heavy-duty PVC conduits with MC4 waterproof IP68 connectors to eliminate line losses and fire risks.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-solar-light text-solar-deep flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                3. IP65 Array Junction Boxes (AJB / ACDB / DCDB)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Industrial distribution boxes equipped with high-rupture DC fuses, SPDs (Surge Protective Devices), and miniature circuit breakers (MCBs) for isolation during maintenance.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-solar-light text-solar-deep flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                4. DISCOM Net Meter Testing & Synchronisation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Complete technical coordination with DISCOM assistant engineers for physical inspection, meter sealing, bidirectional programming, and formal commissioning certificate issuance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Form */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LeadQuoteForm />
        </div>
      </section>
    </div>
  );
}
