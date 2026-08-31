"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { siteFaqs } from "@/lib/faqs-data";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export { siteFaqs };

export function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [modalOpen, setModalOpen] = useState(false);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-solar-deep text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" /> Clear Answers
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-950 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Everything you need to know about rooftop solar installations in Narmadapuram and MP.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {siteFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-heading font-bold text-sm sm:text-base text-slate-900 leading-snug">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-solar-deep text-white" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 p-6 rounded-2xl bg-emerald-950 text-white text-center sm:flex sm:items-center sm:justify-between gap-4">
          <div className="text-left mb-4 sm:mb-0">
            <h4 className="font-bold font-heading text-base text-white">
              Have a specific question about your roof?
            </h4>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Talk directly with Rahul Kumar Bamne & our local engineering team.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sun-amber hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shrink-0 cursor-pointer"
          >
            <span>Request Free Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
