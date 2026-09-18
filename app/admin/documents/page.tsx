"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useEffect, useState } from "react";
import { FolderLock, Search, RefreshCw, CheckCircle2, XCircle, FileText, Download } from "lucide-react";

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadRequest = useRef(0);
  const fetchDocuments = async (background = false) => {
    const request = ++loadRequest.current;
    if (!background) setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/documents");
      const data = await res.json();
      if (request !== loadRequest.current) return;
      if (data.success) setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useLiveRefresh(() => fetchDocuments(true), !loading);

  const handleVerify = async (id: string, status: "VERIFIED" | "REJECTED") => {
    try {
      const res = await fetch("/api/v1/admin/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, verificationStatus: status }),
      });
      const data = await res.json();
      if (data.success) fetchDocuments();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const filteredDocs = documents.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.documentName.toLowerCase().includes(q) ||
      d.documentCategory.toLowerCase().includes(q) ||
      d.customer?.fullName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Central Document Repository
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer KYC, electricity bills, DISCOM approvals, net metering agreements, and warranties
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDocuments()}
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
            placeholder="Search by doc name, category, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredDocs.length} Documents
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Document ID & Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Customer & Project</th>
                <th className="px-5 py-3.5">Uploaded By</th>
                <th className="px-5 py-3.5">Verification</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Loading documents repository...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.documentName}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{d.documentId}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {d.documentCategory.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{d.customer?.fullName}</div>
                      <div className="text-[10px] text-slate-500">{d.project?.projectId || "Customer Level"}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{d.uploadedBy}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          d.verificationStatus === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800"
                            : d.verificationStatus === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {d.verificationStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 flex items-center gap-2">
                      {d.verificationStatus !== "VERIFIED" && (
                        <button
                          onClick={() => handleVerify(d.id, "VERIFIED")}
                          className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 cursor-pointer"
                          title="Verify Document"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {d.verificationStatus !== "REJECTED" && (
                        <button
                          onClick={() => handleVerify(d.id, "REJECTED")}
                          className="p-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 cursor-pointer"
                          title="Reject Document"
                        >
                          <XCircle className="w-4 h-4" />
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
