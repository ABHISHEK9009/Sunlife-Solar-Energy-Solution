"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function WhatsAppFloating() {
  const encodedMsg = encodeURIComponent(siteConfig.contact.whatsappText);
  const whatsappUrl = `https://wa.me/91${siteConfig.contact.whatsapp}?text=${encodedMsg}`;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all group"
        aria-label="Chat with Sunlife Solar on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="hidden sm:inline font-semibold text-xs tracking-wide">
          Chat on WhatsApp
        </span>
      </a>
    </div>
  );
}
