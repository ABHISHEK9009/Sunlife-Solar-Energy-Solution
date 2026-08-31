"use client";

import React, { useState } from "react";
import { Phone, MessageCircle, FileText } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LeadQuoteModal } from "@/components/forms/LeadQuoteModal";

export function StickyMobileBar() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const encodedMsg = encodeURIComponent(siteConfig.contact.whatsappText);
  const whatsappUrl = `https://wa.me/91${siteConfig.contact.whatsapp}?text=${encodedMsg}`;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 sm:hidden shadow-lg">
        <div className="grid grid-cols-3 gap-2">
          {/* Call Now */}
          <a
            href={`tel:${siteConfig.contact.phoneClean}`}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-slate-100 text-slate-800 font-semibold text-[11px] active:bg-slate-200 transition-colors"
          >
            <Phone className="w-4 h-4 text-solar-deep mb-0.5" />
            <span>Call Now</span>
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-[#25D366]/15 text-[#1b8e46] font-semibold text-[11px] active:bg-[#25D366]/25 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] fill-current mb-0.5" />
            <span>WhatsApp</span>
          </a>

          {/* Get Quote */}
          <button
            onClick={() => setQuoteModalOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-solar-deep text-white font-semibold text-[11px] shadow-sm active:bg-solar-dark transition-colors"
          >
            <FileText className="w-4 h-4 text-sun-amber mb-0.5" />
            <span>Get Quote</span>
          </button>
        </div>
      </div>

      <LeadQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
      />
    </>
  );
}
