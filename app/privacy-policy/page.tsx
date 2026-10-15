import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  MapPin,
  Smartphone,
  Server,
  UserCheck,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy | Sunlife Solar Energy Solution",
  description:
    "Official Privacy Policy for Sunlife Solar Energy Solution website and mobile applications. Learn how we collect, use, and protect your personal data in compliance with Google Play Developer Policies and applicable laws.",
  alternates: {
    canonical: "https://sunlifesolar.in/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 15, 2026";

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="fluid-container max-w-4xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Legal & Privacy Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
            This Privacy Policy applies to the <strong>Sunlife Solar Energy Solution</strong> website (
            <Link href="/" className="underline text-sun-amber hover:text-white">
              sunlifesolar.in
            </Link>
            ) and the <strong>Sunlife Solar Energy Solution</strong> Android mobile application (Package:{" "}
            <code className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">
              in.sunlifesolar.customer
            </code>
            ).
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <span>Effective Date: 11 December 2021</span>
            <span>•</span>
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="fluid-container max-w-4xl py-12 sm:py-16">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-10 text-sm sm:text-base leading-relaxed text-slate-700">
          
          {/* Summary Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 text-emerald-900">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-emerald-950 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              Quick Summary for Our Users
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
              We collect only the information strictly necessary to provide rooftop solar installation services,
              process government subsidy benefits under the PM Surya Ghar Muft Bijli Yojana, coordinate net-metering with
              your local DISCOM (MPMKVVCL), and support field operations. We <strong>never</strong> sell, rent, or trade your
              personal information to third parties or advertising networks.
            </p>
          </div>

          {/* 1. Introduction & Developer Identity */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-solar-deep/10 text-solar-deep flex items-center justify-center text-xs font-bold">1</span>
              About Us & Scope
            </h2>
            <p>
              <strong>Sunlife Solar Energy Solution</strong> ("we", "us", or "our"), founded on 11 December 2021 by
              Rahul Kumar Bamne and headquartered in Narmadapuram, Madhya Pradesh, India, operates as an authorized rooftop
              solar EPC (Engineering, Procurement, and Construction) enterprise.
            </p>
            <p>
              This Privacy Policy explains how we collect, process, store, and safeguard personal information when you use
              our website, request solar quotes, submit inquiries, or install and interact with our mobile application available
              on Google Play.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-solar-deep/10 text-solar-deep flex items-center justify-center text-xs font-bold">2</span>
              Information We Collect
            </h2>
            <p>
              Depending on how you interact with our services, we collect the following categories of information:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1.5">
                  <UserCheck className="w-4 h-4 text-solar-deep" />
                  Personal Contact Details
                </h3>
                <p className="text-xs text-slate-600">
                  Full name, primary mobile number, alternate mobile number, email address, installation site address,
                  and billing address.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1.5">
                  <FileText className="w-4 h-4 text-solar-deep" />
                  Solar Plant & Feasibility Data
                </h3>
                <p className="text-xs text-slate-600">
                  Average monthly electricity bills, rooftop area, roof orientation, requested solar plant capacity (kW),
                  property type (Residential/Commercial), and DISCOM consumer number.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1.5">
                  <Smartphone className="w-4 h-4 text-solar-deep" />
                  Document Uploads & Media
                </h3>
                <p className="text-xs text-slate-600">
                  Recent electricity bills, identity documentation (Aadhaar/PAN required strictly for PM Surya Ghar subsidy
                  applications and DISCOM net-meter approvals), and site survey photographs.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1.5">
                  <MapPin className="w-4 h-4 text-solar-deep" />
                  Location Data (Field Agents Only)
                </h3>
                <p className="text-xs text-slate-600">
                  Precise GPS coordinates (latitude & longitude) are collected <strong>strictly for field agents and installation technicians</strong> during
                  work attendance punch-in/out and site survey milestones to verify on-site presence. We do <strong>not</strong> track client locations.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Device Permissions */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-solar-deep/10 text-solar-deep flex items-center justify-center text-xs font-bold">3</span>
              Device Permissions Requested by Mobile App
            </h2>
            <p>
              The Sunlife Solar Android application requests runtime permissions only when directly needed for user-initiated actions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Camera Permission:</strong> Used to capture live photos of the rooftop, electricity meter, or panel mounting structure during site surveys.
              </li>
              <li>
                <strong>Photos / Storage Permission:</strong> Used to select and upload electricity bill PDFs or site photographs from your device.
              </li>
              <li>
                <strong>Location Permission (ACCESS_FINE_LOCATION):</strong> Used solely by registered field agents to record authenticated attendance and verify geographic proximity to solar project installation sites.
              </li>
              <li>
                <strong>Internet & Network State:</strong> Used to communicate securely via HTTPS with the Sunlife CRM backend API.
              </li>
            </ul>
          </section>

          {/* 4. How We Use Information */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-solar-deep/10 text-solar-deep flex items-center justify-center text-xs font-bold">4</span>
              How We Use Your Information
            </h2>
            <p>We process your data for legitimate business purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Secure Authentication:</strong> Generating and verifying cryptographically signed One-Time Passwords (OTPs) sent via SMS or WhatsApp.
              </li>
              <li>
                <strong>Solar Engineering & Installation:</strong> Estimating required solar panel wattage, selecting inverters, creating project blueprints, and tracking milestone stages.
              </li>
              <li>
                <strong>PM Surya Ghar Subsidy Processing:</strong> Submitting verified consumer numbers, project completion reports, and inspection certificates to the National Solar Portal and DISCOM.
              </li>
              <li>
                <strong>Customer Service & Notifications:</strong> Sending status updates, warranty certificates, generation reports, and responding to maintenance tickets.
              </li>
              <li>
                <strong>Operational Audit & Security:</strong> Maintaining immutable server-side audit logs of project updates and preventing unauthorized access.
              </li>
            </ul>
          </section>

          {/* 5. Sharing & Third-Party Services */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-solar-deep/10 text-solar-deep flex items-center justify-center text-xs font-bold">5</span>
              Data Sharing & Disclosures
            </h2>
            <p>
              We do <strong>not</strong> sell or monetize your data. Information is shared only with authorized partners necessary to execute our service:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Government & Utility Bodies:</strong> Ministry of New and Renewable Energy (MNRE) and Madhya Pradesh Madhya Kshetra Vidyut Vitaran Company Limited (MPMKVVCL) for net-metering sanctions and subsidy disbursement.
              </li>
              <li>
                <strong>Secure Cloud Infrastructure:</strong> Neon PostgreSQL (encrypted relational database storage) and Google Drive Workspace (encrypted file storage for customer installation documents).
              </li>
              <li>
                <strong>Transactional Notification Providers:</strong> Secure SMS and WhatsApp gateways used strictly for delivery of authentication OTPs and milestone notifications.
              </li>
            </ul>
          </section>

          {/* 6. Security & Data Retention */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-solar-deep/10 text-solar-deep flex items-center justify-center text-xs font-bold">6</span>
              Data Security & Retention
            </h2>
            <p>
              We implement industry-standard technical measures:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>All web and API traffic is encrypted in transit using <strong>Transport Layer Security (TLS 1.3 / HTTPS)</strong>.</li>
              <li>Authentication tokens are cryptographically signed using HMAC-SHA256 with strict expiration windows.</li>
              <li>Document storage uses access-controlled cloud repositories with strict role-based separation.</li>
            </ul>
            <p className="text-xs sm:text-sm mt-2">
              <strong>Retention:</strong> Project specifications, warranty details, and commissioning records are retained for the duration of the 25-year panel warranty to service ongoing maintenance claims. Non-essential temporary data (such as transient OTP challenge records) is purged automatically within minutes.
            </p>
          </section>

          {/* 7. Data Deletion & User Rights */}
          <section className="space-y-3 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-solar-deep" />
              Your Rights & Account Deletion Policy
            </h2>
            <p className="text-xs sm:text-sm">
              In accordance with Google Play Developer Policy and data protection regulations, you have full control over your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>You may request a copy of all personal information stored about you.</li>
              <li>You may request corrections to any outdated or inaccurate records.</li>
              <li>You may request complete deletion of your customer profile and account access.</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs sm:text-sm">
              <strong>How to Request Data Deletion:</strong>
              <p className="mt-1 text-slate-600">
                To request deletion of your account and personal data, send an email to{" "}
                <a href="mailto:support@sunlifesolar.in?subject=Data%20Deletion%20Request" className="text-solar-deep font-semibold underline">
                  support@sunlifesolar.in
                </a>{" "}
                or call us at{" "}
                <a href="tel:+917722995100" className="text-solar-deep font-semibold">
                  +91 7722995100
                </a>{" "}
                with your registered mobile number and "Data Deletion Request". We will verify your identity and permanently delete your profile within 30 days, subject to statutory tax and warranty record-keeping obligations.
              </p>
            </div>
          </section>

          {/* 8. Children's Privacy */}
          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-solar-deep/10 text-solar-deep flex items-center justify-center text-xs font-bold">8</span>
              Children&apos;s Privacy
            </h2>
            <p className="text-xs sm:text-sm">
              Our website and mobile application are intended exclusively for property owners, businesses, and adults aged 18 and older.
              We do not knowingly solicit or collect personal information from individuals under the age of 18.
            </p>
          </section>

          {/* 9. Contact & Grievance Officer */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-solar-deep/10 text-solar-deep flex items-center justify-center text-xs font-bold">9</span>
              Contact & Grievance Redressal
            </h2>
            <p className="text-xs sm:text-sm">
              If you have any questions, concerns, or grievances regarding this Privacy Policy or data processing practices, please contact our designated Grievance Officer:
            </p>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2 text-xs sm:text-sm">
              <p className="font-bold text-slate-900">{siteConfig.name}</p>
              <p className="text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-solar-deep shrink-0" />
                {siteConfig.contact.address.fullAddress}
              </p>
              <p className="text-slate-600 flex items-center gap-2">
                <Mail className="w-4 h-4 text-solar-deep shrink-0" />
                Email:{" "}
                <a href={`mailto:${siteConfig.contact.email}`} className="text-solar-deep font-semibold underline">
                  {siteConfig.contact.email}
                </a>
              </p>
              <p className="text-slate-600 flex items-center gap-2">
                <Phone className="w-4 h-4 text-solar-deep shrink-0" />
                Phone:{" "}
                <a href={`tel:+91${siteConfig.contact.phone}`} className="text-solar-deep font-semibold">
                  +91 {siteConfig.contact.phone}
                </a>
              </p>
              <p className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-200">
                Operating Hours: Monday – Saturday, 9:00 AM – 7:00 PM IST
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
