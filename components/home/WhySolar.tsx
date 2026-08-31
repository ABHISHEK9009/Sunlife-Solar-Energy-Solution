import React from "react";
import {
  TrendingDown,
  ShieldCheck,
  Leaf,
  Zap,
  Building,
  Sparkles,
} from "lucide-react";

export function WhySolar() {
  const benefits = [
    {
      icon: TrendingDown,
      title: "Lower Electricity Costs",
      description:
        "Generate electricity from your own rooftop and substantially reduce monthly grid electricity billing units over time.",
    },
    {
      icon: ShieldCheck,
      title: "Long-Term Energy Investment",
      description:
        "Solar photovoltaic systems provide dependable, clean power yield over 25+ years with minimal routine maintenance.",
    },
    {
      icon: Leaf,
      title: "Clean, Sustainable Energy",
      description:
        "Harness abundant Central Indian sunlight to power your daily life while reducing reliance on fossil-fuel power grids.",
    },
    {
      icon: Zap,
      title: "Better Energy Independence",
      description:
        "Produce your electricity right where it is consumed, insulating your home or commercial unit against grid tariff inflation.",
    },
    {
      icon: Building,
      title: "Make Your Rooftop Work",
      description:
        "Turn an unutilized, weather-beaten terrace into an active, productive, energy-generating infrastructure asset.",
    },
    {
      icon: Sparkles,
      title: "Future-Ready Property",
      description:
        "Increase property utility, prepare for EV charging requirements, and adopt modern environmental standards.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-emerald-100/80 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Core Advantages
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-950 tracking-tight">
            Why Switch to Solar Energy?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            A transition to solar provides financial stability, technical autonomy, and measurable environmental benefits for decades to come.
          </p>
        </div>

        {/* 6 Benefit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-premium hover:border-emerald-200 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-solar-light text-solar-deep group-hover:bg-solar-deep group-hover:text-sun-amber flex items-center justify-center mb-5 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-heading text-slate-900 mb-2">
                  {b.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
