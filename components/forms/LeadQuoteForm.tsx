"use client";

import React, { useState } from "react";
import { CheckCircle2, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function LeadQuoteForm({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Narmadapuram",
    propertyType: "Residential",
    monthlyBill: "₹2,500 - ₹5,000",
    interestedSolution: "Rooftop Solar",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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
        throw new Error("Failed to submit inquiry. Please try again.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please call us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`p-8 text-center bg-emerald-50/70 border border-emerald-200/80 rounded-2xl ${className}`}>
        <div className="w-14 h-14 bg-emerald-100 text-solar-deep rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h4 className="text-xl font-bold font-heading text-slate-800">
          Thank You, {formData.name}!
        </h4>
        <p className="text-slate-600 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
          Our solar engineering team will review your requirements and reach out within 2–4 hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl p-6 sm:p-8 shadow-premium border border-slate-100 ${className}`}
    >
      <div className="mb-5">
        <span className="text-xs font-semibold text-solar-emerald uppercase tracking-wider">
          Quick Consultation
        </span>
        <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-1">
          Request Your Free Solar Assessment
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          No obligation. Clear technical advice from Narmadapuram’s local solar experts.
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
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
                className="w-full pl-11 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              City
            </label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar transition-all"
            >
              <option value="Narmadapuram">Narmadapuram</option>
              <option value="Itarsi">Itarsi</option>
              <option value="Seoni Malwa">Seoni Malwa</option>
              <option value="Pipariya">Pipariya</option>
              <option value="Sohagpur">Sohagpur</option>
              <option value="Other MP">Other MP</option>
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
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar transition-all"
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Bill
            </label>
            <select
              value={formData.monthlyBill}
              onChange={(e) =>
                setFormData({ ...formData, monthlyBill: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar transition-all"
            >
              <option value="₹1,500 - ₹3,000">₹1.5k – ₹3k</option>
              <option value="₹3,000 - ₹6,000">₹3k – ₹6k</option>
              <option value="₹6,000 - ₹12,000">₹6k – ₹12k</option>
              <option value="₹12,000+">₹12k+</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Message / Requirements (Optional)
          </label>
          <textarea
            rows={compact ? 2 : 3}
            placeholder="Tell us about your rooftop, current connection or requirements..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-solar-deep hover:bg-solar-dark text-white font-semibold rounded-xl shadow-md transition-all text-sm group cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              Get Free Solar Quote <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local Narmadapuram Support • Direct Consultation</span>
        </div>
      </div>
    </form>
  );
}
