"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, CheckCircle2, Phone, Sun, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

interface LeadQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPropertyType?: string;
  defaultMonthlyBill?: string;
  title?: string;
}

export function LeadQuoteModal({
  isOpen,
  onClose,
  defaultPropertyType = "Residential",
  defaultMonthlyBill = "₹2,500 - ₹5,000",
  title = "Get Your Free Solar Quote",
}: LeadQuoteModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Narmadapuram",
    propertyType: defaultPropertyType,
    monthlyBill: defaultMonthlyBill,
    interestedSolution: "Rooftop Solar",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const validatePhone = (num: string) => {
    const clean = num.replace(/\D/g, "");
    return /^[6-9]\d{9}$/.test(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to submit quote request. Please try again.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please call us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 max-h-[90vh] flex flex-col">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-solar-dark to-solar-deep text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/logo.svg"
              alt="Sunlife Solar Energy Solution Logo"
              width={160}
              height={45}
              className="h-8 w-auto object-contain drop-shadow"
            />
            <div className="hidden sm:block border-l border-white/20 pl-3">
              <h3 className="font-heading font-bold text-sm leading-tight">{title}</h3>
              <p className="text-[11px] text-emerald-200/90">
                Narmadapuram & MP • Free Site Assessment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-solar-deep rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold font-heading text-slate-800">
                Thank You, {formData.name}!
              </h4>
              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                Your solar quote request has been received. Our founder & technical solar expert,{" "}
                <strong className="text-solar-deep">{siteConfig.owner.name}</strong>, will review your details and reach out within 2–4 hours.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`tel:${siteConfig.contact.phoneClean}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-solar-deep hover:bg-solar-dark text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Directly: {siteConfig.contact.phone}
                </a>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-medium">
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
                      className="w-full pl-11 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Location
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar transition-all"
                  >
                    <option value="Narmadapuram">Narmadapuram (Hoshangabad)</option>
                    <option value="Itarsi">Itarsi</option>
                    <option value="Seoni Malwa">Seoni Malwa</option>
                    <option value="Pipariya">Pipariya</option>
                    <option value="Sohagpur">Sohagpur</option>
                    <option value="Babai">Babai</option>
                    <option value="Bhopal / Other MP">Other Location in MP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Property Type
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyType: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar transition-all"
                  >
                    <option value="Residential">Residential (Home / Villa)</option>
                    <option value="Commercial">Commercial (Office / Shop / School)</option>
                    <option value="Industrial">Industrial (Factory / Plant)</option>
                    <option value="Agricultural">Agricultural / Solar Pump</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Average Monthly Electricity Bill
                  </label>
                  <select
                    value={formData.monthlyBill}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyBill: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar transition-all"
                  >
                    <option value="Under ₹2,500">Under ₹2,500 / month</option>
                    <option value="₹2,500 - ₹5,000">₹2,500 – ₹5,000 / month</option>
                    <option value="₹5,000 - ₹10,000">₹5,000 – ₹10,000 / month</option>
                    <option value="₹10,000 - ₹25,000">₹10,000 – ₹25,000 / month</option>
                    <option value="Above ₹25,000">Above ₹25,000 / month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Requirements or Message (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 3 kW system for rooftop, looking for subsidy assistance..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-solar-deep to-solar-emerald hover:from-solar-dark hover:to-solar-deep text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/15 hover:shadow-emerald-900/25 transition-all text-sm group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                    </>
                  ) : (
                    <>
                      Get Free Solar Quote <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Privacy Protected. No spam, guaranteed.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
