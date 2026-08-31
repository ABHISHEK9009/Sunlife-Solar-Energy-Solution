"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="bg-solar-dark text-slate-300 pt-12 sm:pt-16 pb-10 border-t border-emerald-950">
      <div className="site-container">
        {/* Responsive Grid: 1 col on mobile, 2 cols on sm/tablet, 4 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 sm:pb-12 border-b border-emerald-900/60">
          {/* Column 1: About */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo/logo.svg"
                alt="Sunlife Solar Energy Solution Logo"
                width={360}
                height={150}
                className="h-12 sm:h-16 w-auto object-contain drop-shadow-xl hover:opacity-95 transition-opacity"
              />
            </Link>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Professional solar EPC & rooftop installation company based in Narmadapuram, Madhya Pradesh. Founded on {siteConfig.foundedDateFormatted}.
            </p>

            <div className="pt-1">
              <div className="text-xs font-semibold text-sun-amber">
                Founder: {siteConfig.owner.name}
              </div>
              <div className="text-xs text-slate-400">
                Authorized Solar Energy Specialist
              </div>
            </div>
          </div>

          {/* Column 2: Solar Solutions */}
          <div>
            <h4 className="text-white font-heading font-semibold text-sm sm:text-base mb-3 sm:mb-4 tracking-wide">
              Solar Solutions
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/residential-solar" className="hover:text-sun-amber transition-colors">
                  Residential Rooftop Solar
                </Link>
              </li>
              <li>
                <Link href="/commercial-solar" className="hover:text-sun-amber transition-colors">
                  Commercial Solar Systems
                </Link>
              </li>
              <li>
                <Link href="/industrial-solar" className="hover:text-sun-amber transition-colors">
                  Industrial Solar Plants
                </Link>
              </li>
              <li>
                <Link href="/rooftop-solar" className="hover:text-sun-amber transition-colors">
                  Rooftop Solar & Gazebo Frames
                </Link>
              </li>
              <li>
                <Link href="/solar-panel-installation" className="hover:text-sun-amber transition-colors">
                  Installation Quality & Standards
                </Link>
              </li>
              <li>
                <Link href="/solar-solutions" className="text-sun-amber font-semibold hover:underline inline-flex items-center gap-1 pt-1">
                  <span>View All Services</span>
                  <span>→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="text-white font-heading font-semibold text-sm sm:text-base mb-3 sm:mb-4 tracking-wide">
              Company & Tools
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/about" className="hover:text-sun-amber transition-colors">
                  About Sunlife Solar
                </Link>
              </li>
              <li>
                <Link href="/solar-calculator" className="hover:text-sun-amber transition-colors flex items-center gap-1.5 text-sun-amber font-medium">
                  <span>★</span> Solar Savings Calculator
                </Link>
              </li>
              <li>
                <Link href="/solar-subsidy" className="hover:text-sun-amber transition-colors">
                  Solar Subsidy & PM Schemes
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-sun-amber transition-colors">
                  Installation Showcase
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-sun-amber transition-colors">
                  Solar Knowledge & Guides
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-sun-amber transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-sun-amber transition-colors">
                  Contact & Location
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Office */}
          <div className="space-y-3 text-xs sm:text-sm">
            <h4 className="text-white font-heading font-semibold text-sm sm:text-base mb-3 sm:mb-4 tracking-wide">
              Office Location
            </h4>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-sun-amber shrink-0 mt-0.5" />
              <div className="leading-relaxed text-slate-300">
                {siteConfig.contact.address.street},
                <br />
                {siteConfig.contact.address.city}, {siteConfig.contact.address.state} – {siteConfig.contact.address.postalCode}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-sun-amber shrink-0" />
              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="text-white font-bold hover:text-sun-amber transition-colors"
              >
                {siteConfig.contact.phoneDisplay}
              </a>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/40 text-xs text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Serving Narmadapuram & Central MP
              </span>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span>Clean Energy • Engineering Excellence • Local Trust</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
