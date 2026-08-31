import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sun, Phone, MapPin, Mail, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="bg-solar-dark text-slate-300 pt-14 pb-10 border-t border-emerald-950">
      <div className="fluid-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 border-b border-emerald-900/60">
          {/* Column 1: About */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo/logo.svg"
                alt="Sunlife Solar Energy Solution Logo"
                width={360}
                height={150}
                className="h-16 sm:h-20 w-auto object-contain drop-shadow-xl hover:opacity-95 transition-opacity"
              />
            </Link>

            <p className="text-slate-300/90 text-sm leading-relaxed">
              Trusted rooftop solar installation partner for homes, businesses, and industrial facilities in Narmadapuram and across Madhya Pradesh.
            </p>

            <div className="pt-2 text-xs text-emerald-300/80 space-y-1">
              <div>
                <strong className="text-white">Founded:</strong> {siteConfig.foundedDateFormatted}
              </div>
              <div>
                <strong className="text-white">Owner / Founder:</strong> {siteConfig.owner.name}
              </div>
            </div>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h4 className="text-white font-heading font-semibold text-base mb-4 tracking-wide">
              Solar Solutions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/residential-solar"
                  className="hover:text-sun-amber transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-500" />
                  Residential Rooftop Solar
                </Link>
              </li>
              <li>
                <Link
                  href="/commercial-solar"
                  className="hover:text-sun-amber transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-500" />
                  Commercial Solar Systems
                </Link>
              </li>
              <li>
                <Link
                  href="/industrial-solar"
                  className="hover:text-sun-amber transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-500" />
                  Industrial Solar Plants
                </Link>
              </li>
              <li>
                <Link
                  href="/rooftop-solar"
                  className="hover:text-sun-amber transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-500" />
                  Rooftop Solar Engineering
                </Link>
              </li>
              <li>
                <Link
                  href="/solar-panel-installation"
                  className="hover:text-sun-amber transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-500" />
                  Solar Installation Process
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="text-white font-heading font-semibold text-base mb-4 tracking-wide">
              Company & Tools
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-sun-amber transition-colors">
                  About Sunlife Solar
                </Link>
              </li>
              <li>
                <Link href="/solar-calculator" className="hover:text-sun-amber transition-colors flex items-center gap-1.5">
                  <span className="text-sun-amber">★</span> Solar Savings Calculator
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
          <div className="space-y-3.5 text-sm">
            <h4 className="text-white font-heading font-semibold text-base mb-4 tracking-wide">
              Office Location
            </h4>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-sun-amber shrink-0 mt-1" />
              <div className="leading-relaxed text-slate-300 text-xs sm:text-sm">
                {siteConfig.contact.address.street},
                <br />
                {siteConfig.contact.address.city}, {siteConfig.contact.address.state} – {siteConfig.contact.address.postalCode}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-sun-amber shrink-0" />
              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="text-white font-semibold hover:text-sun-amber transition-colors text-sm"
              >
                {siteConfig.contact.phoneDisplay}
              </a>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/40 text-xs text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Serving Narmadapuram & Central MP
              </span>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Clean Energy • Engineering Excellence • Local Trust</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
