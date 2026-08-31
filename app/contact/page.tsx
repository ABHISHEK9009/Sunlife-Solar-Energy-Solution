"use client";

import React, { useState } from "react";
import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Navigation,
  CheckCircle2,
  Send,
  Loader2,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "Narmadapuram",
    monthlyBill: "₹2,500 - ₹5,000",
    requirement: "Residential Rooftop",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const encodedMsg = encodeURIComponent(siteConfig.contact.whatsappText);
  const whatsappUrl = `https://wa.me/91${siteConfig.contact.whatsapp}?text=${encodedMsg}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to send message. Please call us directly.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Direct Contact & Consultation
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              Let&apos;s Talk About Your Solar Project
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
              Visit our office in Malakhedi, Narmadapuram, or request a free on-site solar survey with Rahul Kumar Bamne.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Contact Info & Action Buttons (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-heading text-slate-900">
                  {siteConfig.name}
                </h2>
                <p className="text-xs text-solar-emerald font-semibold mt-0.5">
                  Solar EPC & Rooftop Solutions • Est. 2021
                </p>
              </div>

              {/* Office Address Card */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-solar-deep text-white flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-sun-amber" />
                  </div>
                  <div>
                    <h3 className="font-bold font-heading text-sm text-slate-900">
                      Office Address
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {siteConfig.contact.address.street},
                      <br />
                      {siteConfig.contact.address.city}, {siteConfig.contact.address.state} – {siteConfig.contact.address.postalCode}, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-3 border-t border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-solar-deep text-white flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-sun-amber" />
                  </div>
                  <div>
                    <h3 className="font-bold font-heading text-sm text-slate-900">
                      Founder & Contact
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {siteConfig.owner.name} (Founder / Owner)
                    </p>
                    <a
                      href={`tel:${siteConfig.contact.phoneClean}`}
                      className="text-sm font-bold text-solar-deep hover:underline mt-1 block"
                    >
                      {siteConfig.contact.phoneDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-3 border-t border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-solar-deep text-white flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-sun-amber" />
                  </div>
                  <div>
                    <h3 className="font-bold font-heading text-sm text-slate-900">
                      Working Hours
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Monday to Saturday: 9:00 AM – 7:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`tel:${siteConfig.contact.phoneClean}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-solar-deep hover:bg-solar-dark text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Now
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
                </a>
              </div>

              {/* Google Map Embed / Directions Box */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 p-1">
                <iframe
                  title="Sunlife Solar Location Map"
                  src="https://maps.google.com/maps?q=Malakhedi%2C+Narmadapuram%2C+Madhya+Pradesh+461001&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="220"
                  style={{ border: 0, borderRadius: "12px" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Right: Contact Form (7 cols) */}
            <div className="lg:col-span-7">
              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 sm:p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-solar-deep flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading text-slate-900">
                    Thank You, {formData.fullName}!
                  </h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                    Your message has been received. Our team will contact you shortly to discuss your solar requirements and schedule your free rooftop assessment.
                  </p>
                  <div className="pt-4">
                    <a
                      href={`tel:${siteConfig.contact.phoneClean}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-solar-deep text-white font-semibold rounded-xl text-sm"
                    >
                      <Phone className="w-4 h-4" /> Call Direct: {siteConfig.contact.phone}
                    </a>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-premium space-y-5"
                >
                  <div>
                    <h3 className="text-2xl font-bold font-heading text-slate-900">
                      Request Free Solar Consultation
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Fill out the form below and we will contact you within 2–4 business hours.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-xs text-slate-500 font-medium">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="9876543210"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phone: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          className="w-full pl-12 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        City / Town
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar"
                      >
                        <option value="Narmadapuram">Narmadapuram</option>
                        <option value="Itarsi">Itarsi</option>
                        <option value="Seoni Malwa">Seoni Malwa</option>
                        <option value="Pipariya">Pipariya</option>
                        <option value="Sohagpur">Sohagpur</option>
                        <option value="Other MP">Other Central MP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Property Type
                      </label>
                      <select
                        value={formData.requirement}
                        onChange={(e) =>
                          setFormData({ ...formData, requirement: e.target.value })
                        }
                        className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar"
                      >
                        <option value="Residential Rooftop">Residential Rooftop</option>
                        <option value="Commercial Complex">Commercial Building</option>
                        <option value="Industrial Shed">Industrial / Factory</option>
                        <option value="Solar Water Pump">Agricultural Pump</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Monthly Power Bill
                      </label>
                      <select
                        value={formData.monthlyBill}
                        onChange={(e) =>
                          setFormData({ ...formData, monthlyBill: e.target.value })
                        }
                        className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar"
                      >
                        <option value="Under ₹2,500">Under ₹2.5k</option>
                        <option value="₹2,500 - ₹5,000">₹2.5k – ₹5k</option>
                        <option value="₹5,000 - ₹10,000">₹5k – ₹10k</option>
                        <option value="₹10,000+">₹10k+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Your Message / Requirement Details (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe your rooftop area, current load, or any questions you have..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-solar-deep to-solar-emerald hover:from-solar-dark hover:to-solar-deep text-white font-semibold rounded-xl shadow-lg transition-all text-sm group cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending Inquiry...
                      </>
                    ) : (
                      <>
                        Request Free Solar Consultation <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                    <ShieldCheck className="w-4 h-4 text-solar-emerald" />
                    <span>No spam. Honest technical advice from local Narmadapuram engineers.</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
