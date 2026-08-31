import React from "react";
import {
  PhoneCall,
  Compass,
  FileCode,
  Wrench,
  CheckCircle2,
  Zap,
} from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Consultation",
      icon: PhoneCall,
      description:
        "Understand your monthly electricity usage, connected load, property type, and long-term energy requirements.",
    },
    {
      step: "02",
      title: "Site Assessment",
      icon: Compass,
      description:
        "Evaluate available terrace area, roof orientation, solar shadow profile, and structural integrity in detail.",
    },
    {
      step: "03",
      title: "System Design",
      icon: FileCode,
      description:
        "Engineer the ideal PV capacity (kW), panel arrangement, inverter sizing, and electrical safety scheme.",
    },
    {
      step: "04",
      title: "Installation",
      icon: Wrench,
      description:
        "Professional erection of GI structures, mounting Tier-1 modules, precision AC/DC cabling, and earthing pits.",
    },
    {
      step: "05",
      title: "Commissioning",
      icon: CheckCircle2,
      description:
        "DISCOM net meter coordination, rigorous safety checks, voltage synchronization, and client handover.",
    },
    {
      step: "06",
      title: "Start Generating",
      icon: Zap,
      description:
        "Your system starts harvesting clean solar power, reducing meter units, and generating continuous savings.",
    },
  ];

  return (
    <section className="fluid-py bg-white">
      <div className="fluid-container">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-solar-emerald uppercase tracking-wider bg-solar-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Systematic Execution
          </span>
          <h2 className="fluid-h2 font-extrabold font-heading text-slate-950">
            How It Works: Our 6-Step Installation Process
          </h2>
          <p className="fluid-p text-slate-600 mt-3 leading-relaxed">
            From your first inquiry in Narmadapuram to final grid synchronization, we handle every technical and liaison step with total transparency.
          </p>
        </div>

        {/* Intrinsic Fluid 6-Step Grid */}
        <div className="fluid-grid-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-sm hover:shadow-premium hover:border-emerald-300 transition-all duration-300 group"
              >
                {/* Step Number Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold text-solar-deep font-heading tracking-widest px-2.5 py-1 rounded-lg bg-emerald-100/70">
                    STEP {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 group-hover:bg-solar-deep group-hover:text-sun-amber flex items-center justify-center transition-colors shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-lg font-bold font-heading text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
