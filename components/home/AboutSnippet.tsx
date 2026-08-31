import React from "react";
import Link from "next/link";
import { Phone, CheckCircle2, ShieldCheck, MapPin, Calendar, ArrowRight, UserCheck } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function AboutSnippet() {
  const pillars = [
    { title: "Direct Local Presence", desc: "Located at Vinayak Complex, Malakhedi, Narmadapuram for immediate on-ground support." },
    { title: "Customer-First Approach", desc: "Clear, transparent advice tailored to your actual power consumption without overselling." },
    { title: "Rigorous Engineering", desc: "Tier-1 solar modules, high-efficiency grid-tied inverters, and hot-dip GI mounting structures." },
    { title: "Full Lifecycle Support", desc: "From shadow analysis and DISCOM net metering approvals to continuous maintenance advice." },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column (7 Cols): Company Story & Values */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-solar-light text-solar-deep text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-solar-emerald" />
              <span>Founded {siteConfig.foundedDateFormatted}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-950 tracking-tight leading-tight">
              Building a Cleaner Energy Future Since 2021
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              <strong>{siteConfig.name}</strong> was founded on <strong>{siteConfig.foundedDateFormatted}</strong> with a clear focus: helping homes, businesses, and commercial facilities across Narmadapuram and Madhya Pradesh transition to reliable, cost-effective solar energy.
            </p>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              We handle the entire solar journey locally — comprehensive rooftop site assessment, precision system sizing, equipment supply, quality structural installation, DISCOM net metering liaison, and system commissioning.
            </p>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {pillars.map((p, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-solar-emerald shrink-0" />
                    <span>{p.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-bold text-solar-deep hover:text-solar-dark group"
              >
                <span>Read Full Company Story & Standards</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column (5 Cols): Founder Spotlight Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-gradient-to-br from-solar-dark via-solar-deep to-emerald-900 text-white p-8 sm:p-9 shadow-2xl border border-emerald-700/50 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-sun-amber/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-6 relative">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-sun-amber flex items-center justify-center font-heading font-extrabold text-xl">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading text-white">
                      {siteConfig.owner.name}
                    </h3>
                    <div className="text-xs text-emerald-200 font-medium mt-0.5">
                      {siteConfig.owner.role} • Sunlife Solar Energy Solution
                    </div>
                  </div>
                </div>

                {/* Quote Message */}
                <div className="p-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                  <blockquote className="text-sm sm:text-base text-emerald-50 italic leading-relaxed">
                    “{siteConfig.owner.message}”
                  </blockquote>
                </div>

                <div className="space-y-3 pt-2 text-xs text-emerald-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sun-amber shrink-0" />
                    <span>Vinayak Complex, Malakhedi, Narmadapuram (MP)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct engineering consultation with founder</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={`tel:${siteConfig.owner.phone}`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-sun-amber hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Rahul: {siteConfig.owner.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
