"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useEffect, useState } from "react";
import { CreditCard, Search, RefreshCw, CheckCircle2, Clock, Plus, X } from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadRequest = useRef(0);
  const fetchPayments = async (background = false) => {
    const request = ++loadRequest.current;
    if (!background) setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/payments");
      const data = await res.json();
      if (request !== loadRequest.current) return;
      if (data.success) setPayments(data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useLiveRefresh(() => fetchPayments(true), !loading);

  const handleMarkPaid = async (id: string, dueAmount: number) => {
    try {
      const res = await fetch("/api/v1/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, amountPaid: dueAmount, paymentStatus: "PAID", paymentMethod: "Bank Transfer" }),
      });
      const data = await res.json();
      if (data.success) fetchPayments();
    } catch (err) {
      alert("Failed to update payment.");
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.paymentId.toLowerCase().includes(q) ||
      p.paymentStage.toLowerCase().includes(q) ||
      p.customer?.fullName.toLowerCase().includes(q) ||
      p.project?.projectName.toLowerCase().includes(q)
    );
  });

  const totalCollected = payments
    .filter((p) => p.paymentStatus === "PAID" || p.paymentStatus === "PARTIALLY_PAID")
    .reduce((acc, curr) => acc + curr.amountPaid, 0);

  const totalOutstanding = payments.reduce((acc, curr) => acc + curr.balanceRemaining, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card with Aggregate KPI Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Payments & Accounts Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage milestone billing, balance calculations, transaction reconciliation, and receipts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPayments()}
            disabled={loading}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Capital Collected</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-heading">
            ₹{totalCollected.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified milestone payments</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Outstanding Balance</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1 font-heading">
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pending stage collections</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs sm:col-span-2 lg:col-span-1">
          <div className="text-xs font-semibold text-slate-500">Active Invoices</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-heading">
            {payments.length} Milestones
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all client projects</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by payment ID, stage, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredPayments.length} Milestone Records
        </span>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Payment ID</th>
                <th className="px-5 py-3.5">Customer & Project</th>
                <th className="px-5 py-3.5">Stage</th>
                <th className="px-5 py-3.5">Amount Due</th>
                <th className="px-5 py-3.5">Amount Paid</th>
                <th className="px-5 py-3.5">Remaining Balance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    Loading payments ledger...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{p.paymentId}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{p.customer?.fullName}</div>
                      <div className="text-[10px] text-slate-500">{p.project?.projectName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {p.paymentStage}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      ₹{p.amountDue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 font-semibold text-emerald-600">
                      ₹{p.amountPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      ₹{p.balanceRemaining.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.paymentStatus === "PARTIALLY_PAID"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {p.paymentStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {p.paymentStatus !== "PAID" && (
                        <button
                          onClick={() => handleMarkPaid(p.id, p.amountDue)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold cursor-pointer text-[11px]"
                        >
                          Mark Paid
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
