"use client";

import React, { useEffect, useState } from "react";
import { Gift, Search, RefreshCw, CheckCircle2, Clock, Award, Phone } from "lucide-react";

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/referrals");
      const data = await res.json();
      if (data.success) setReferrals(data.referrals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleMarkRewardPaid = async (id: string) => {
    try {
      const res = await fetch("/api/v1/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, rewardStatus: "PAID", rewardPaymentReference: `UPI-${Date.now()}` }),
      });
      const data = await res.json();
      if (data.success) fetchReferrals();
    } catch (err) {
      alert("Failed to update referral reward.");
    }
  };

  const filtered = referrals.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.referralCode.toLowerCase().includes(q) ||
      r.referredPersonName.toLowerCase().includes(q) ||
      r.referringCustomer?.fullName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Referral Rewards & Advocate Program
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer advocate links, friend signups, automated lead progression, and ₹1,500 incentive payouts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReferrals}
            disabled={loading}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by referral code, advocate, friend name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filtered.length} Referrals
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Referral ID & Code</th>
                <th className="px-5 py-3.5">Advocate Customer</th>
                <th className="px-5 py-3.5">Referred Friend</th>
                <th className="px-5 py-3.5">Lead Status</th>
                <th className="px-5 py-3.5">Reward Amount</th>
                <th className="px-5 py-3.5">Reward Status</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading referrals...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No customer referrals submitted yet.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      <div>{r.referralId}</div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                        {r.referralCode}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{r.referringCustomer?.fullName}</div>
                      <div className="text-[10px] text-slate-500">{r.referringCustomer?.primaryMobile}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{r.referredPersonName}</div>
                      <div className="text-[10px] text-slate-500">{r.referredMobileNumber}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {r.referralStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-600 text-sm">
                      ₹{r.eligibleRewardAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          r.rewardStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.rewardStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {r.rewardStatus !== "PAID" && (
                        <button
                          onClick={() => handleMarkRewardPaid(r.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold cursor-pointer text-[11px]"
                        >
                          Disburse Reward
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
