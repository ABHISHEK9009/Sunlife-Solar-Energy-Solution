"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  FileText,
  Download,
  Plus,
  Trash2,
  UploadCloud,
  X,
  User,
  Cloud,
  Check,
  Copy,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle,
  Key,
  Settings,
  Unlink,
  HardDrive,
  FolderOpen,
} from "lucide-react";

interface CustomerOption {
  id: string;
  customerId: string;
  fullName: string;
  primaryMobile: string;
  installationAddress?: string;
}

const CATEGORIES = [
  { value: "CUSTOMER_KYC", label: "Customer KYC & ID" },
  { value: "ELECTRICITY_BILL", label: "Electricity Bill" },
  { value: "AADHAAR_PAN", label: "Aadhaar / PAN Card" },
  { value: "CANCELLED_CHEQUE", label: "Cancelled Cheque" },
  { value: "SITE_SURVEY_REPORT", label: "Site Survey Report" },
  { value: "DISCOM_APPROVAL", label: "DISCOM Approval" },
  { value: "NET_METERING_DOCUMENT", label: "Net Metering Agreement" },
  { value: "SUBSIDY_DOCUMENT", label: "Subsidy Application" },
  { value: "PANEL_WARRANTY", label: "Solar Panel Warranty" },
  { value: "INVERTER_WARRANTY", label: "Inverter Warranty" },
  { value: "PURCHASE_AGREEMENT", label: "Purchase Agreement" },
  { value: "OTHER", label: "Other Document" },
];

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDriveSetupModal, setShowDriveSetupModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Status banner from OAuth redirect
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Drive Status
  const [driveStatus, setDriveStatus] = useState({
    connected: false,
    authMethod: "NONE" as string,
    folderId: null as string | null,
    folderName: "Sunlife Solar CRM Documents",
    folderLink: null as string | null,
    accountEmail: null as string | null,
    clientId: null as string | null,
  });

  // Setup Modal State
  const [activeDriveTab, setActiveDriveTab] = useState<"SERVICE_ACCOUNT" | "OAUTH2" | "MANUAL">("SERVICE_ACCOUNT");
  const [saJsonText, setSaJsonText] = useState("");
  const [driveFolderInput, setDriveFolderInput] = useState("");
  const [manualSaEmail, setManualSaEmail] = useState("");
  const [manualSaKey, setManualSaKey] = useState("");
  const [manualRefreshToken, setManualRefreshToken] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [savingDrive, setSavingDrive] = useState(false);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    customerId: "",
    documentCategory: "CUSTOMER_KYC",
    documentName: "",
    uploadedBy: "Rahul Kumar (Admin)",
    verificationStatus: "VERIFIED",
  });

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

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/v1/admin/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error("[Fetch Customers Error]:", err);
    }
  };

  const fetchDriveStatus = async () => {
    try {
      const res = await fetch("/api/v1/admin/documents/drive-config");
      const data = await res.json();
      if (data.success) {
        setDriveStatus({
          connected: Boolean(data.connected),
          authMethod: data.authMethod || "NONE",
          folderId: data.folderId || null,
          folderName: data.folderName || "Sunlife Solar CRM Documents",
          folderLink: data.folderLink || null,
          accountEmail: data.accountEmail || null,
          clientId: data.clientId || null,
        });
        if (data.folderId) {
          setDriveFolderInput(data.folderId);
        }
      }
    } catch (err) {
      console.error("[Fetch Drive Status Error]:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCustomers();
    fetchDriveStatus();

    // Check URL query parameters for OAuth callback results
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("drive_connected") === "1") {
        setAlertMessage({
          type: "success",
          text: "🎉 Google Drive successfully connected! Documents will now sync directly to your Google Drive.",
        });
        window.history.replaceState({}, "", "/admin/documents");
      } else if (params.get("drive_error")) {
        setAlertMessage({
          type: "error",
          text: `Google Drive connection error: ${decodeURIComponent(params.get("drive_error") || "")}`,
        });
        window.history.replaceState({}, "", "/admin/documents");
      }
    }
  }, []);

  useLiveRefresh(async () => {
    await fetchDocuments(true);
    await fetchDriveStatus();
  }, !loading);

  const handleVerify = async (id: string, status: "VERIFIED" | "REJECTED" | "PENDING") => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, verificationStatus: status } : d))
    );
    try {
      const res = await fetch("/api/v1/admin/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, verificationStatus: status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDocuments(true);
      } else {
        alert("Failed to update status.");
        fetchDocuments(true);
      }
    } catch (err) {
      alert("Failed to update status.");
      fetchDocuments(true);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      const res = await fetch(`/api/v1/admin/documents?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete document.");
        fetchDocuments(true);
      }
    } catch (err) {
      console.error("[Delete Document Error]:", err);
      alert("Failed to delete document.");
      fetchDocuments(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    if (!uploadForm.documentName) {
      setUploadForm((prev) => ({
        ...prev,
        documentName: cleanName,
      }));
    }
  };

  const handleSaJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setSaJsonText(text);
      try {
        const parsed = JSON.parse(text);
        if (parsed.client_email) {
          setManualSaEmail(parsed.client_email);
        }
      } catch {
        // Ignore JSON parse err
      }
    };
    reader.readAsText(file);
  };

  const handleTestDriveConnection = async () => {
    setTestingConnection(true);
    setTestFeedback(null);
    try {
      const payload: any = {
        testOnly: true,
        folderId: driveFolderInput.trim() || undefined,
      };

      if (activeDriveTab === "SERVICE_ACCOUNT") {
        if (saJsonText.trim()) {
          payload.serviceAccountJson = saJsonText.trim();
        } else if (manualSaEmail && manualSaKey) {
          payload.authMethod = "SERVICE_ACCOUNT";
          payload.serviceAccountEmail = manualSaEmail.trim();
          payload.serviceAccountPrivateKey = manualSaKey.trim();
        }
      } else if (activeDriveTab === "MANUAL") {
        if (manualRefreshToken) {
          payload.authMethod = "OAUTH2";
          payload.refreshToken = manualRefreshToken.trim();
        } else if (manualSaEmail && manualSaKey) {
          payload.authMethod = "SERVICE_ACCOUNT";
          payload.serviceAccountEmail = manualSaEmail.trim();
          payload.serviceAccountPrivateKey = manualSaKey.trim();
        }
      }

      const res = await fetch("/api/v1/admin/documents/drive-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setTestFeedback({
          success: true,
          message: `Connected successfully! Folder: "${data.folderName}" (${data.folderId})`,
          details: data,
        });
      } else {
        setTestFeedback({
          success: false,
          message: data.error || "Connection test failed.",
        });
      }
    } catch (err: any) {
      setTestFeedback({
        success: false,
        message: err.message || "Failed to reach test endpoint.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveDriveConfig = async () => {
    setSavingDrive(true);
    setTestFeedback(null);
    try {
      const payload: any = {
        testOnly: false,
        folderId: driveFolderInput.trim() || undefined,
      };

      if (activeDriveTab === "SERVICE_ACCOUNT") {
        if (saJsonText.trim()) {
          payload.serviceAccountJson = saJsonText.trim();
        } else if (manualSaEmail && manualSaKey) {
          payload.authMethod = "SERVICE_ACCOUNT";
          payload.serviceAccountEmail = manualSaEmail.trim();
          payload.serviceAccountPrivateKey = manualSaKey.trim();
        } else {
          alert("Please upload or paste your Service Account JSON key.");
          setSavingDrive(false);
          return;
        }
      } else if (activeDriveTab === "MANUAL") {
        if (manualRefreshToken) {
          payload.authMethod = "OAUTH2";
          payload.refreshToken = manualRefreshToken.trim();
        } else if (manualSaEmail && manualSaKey) {
          payload.authMethod = "SERVICE_ACCOUNT";
          payload.serviceAccountEmail = manualSaEmail.trim();
          payload.serviceAccountPrivateKey = manualSaKey.trim();
        } else {
          alert("Please fill in the required credentials.");
          setSavingDrive(false);
          return;
        }
      }

      const res = await fetch("/api/v1/admin/documents/drive-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setTestFeedback({
          success: true,
          message: "Google Drive successfully connected and active!",
          details: data.config,
        });
        await fetchDriveStatus();
        setTimeout(() => {
          setShowDriveSetupModal(false);
        }, 1500);
      } else {
        setTestFeedback({
          success: false,
          message: data.error || "Failed to save Google Drive settings.",
        });
      }
    } catch (err: any) {
      setTestFeedback({
        success: false,
        message: err.message || "Failed to save configuration.",
      });
    } finally {
      setSavingDrive(false);
    }
  };

  const handleDisconnectDrive = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive? Files will be saved to local CRM storage.")) {
      return;
    }
    try {
      const res = await fetch("/api/v1/admin/documents/drive-config", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchDriveStatus();
        setShowDriveSetupModal(false);
      } else {
        alert("Failed to disconnect Google Drive.");
      }
    } catch (err) {
      console.error(err);
      alert("Error disconnecting Google Drive.");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.customerId) {
      alert("Please select a registered customer.");
      return;
    }
    if (!uploadForm.documentName.trim()) {
      alert("Please enter a document title.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      formData.append("customerId", uploadForm.customerId);
      formData.append("documentCategory", uploadForm.documentCategory);
      formData.append("documentName", uploadForm.documentName.trim());
      formData.append("uploadedBy", uploadForm.uploadedBy);
      formData.append("verificationStatus", uploadForm.verificationStatus);

      const res = await window.fetch("/api/v1/admin/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadForm({
          customerId: "",
          documentCategory: "CUSTOMER_KYC",
          documentName: "",
          uploadedBy: "Rahul Kumar (Admin)",
          verificationStatus: "VERIFIED",
        });
        fetchDocuments();
      } else {
        alert(data.error || "Failed to upload document.");
      }
    } catch (err) {
      console.error("[Upload Document Error]:", err);
      alert("Failed to upload document. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredDocs = documents.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (d.documentName || "").toLowerCase().includes(q) ||
      (d.documentCategory || "").toLowerCase().includes(q) ||
      (d.documentId || "").toLowerCase().includes(q) ||
      (d.customer?.fullName || "").toLowerCase().includes(q) ||
      (d.customer?.primaryMobile || "").includes(q);

    const matchesCategory =
      selectedCategory === "ALL" || d.documentCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Alert banner from redirect */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            alertMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {alertMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
              Central Document Repository
            </h2>

            {/* Google Drive Status Pill */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setTestFeedback(null);
                  setShowDriveSetupModal(true);
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  driveStatus.connected
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse"
                }`}
                title="Configure Google Drive Storage"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>
                  {driveStatus.connected
                    ? "Google Drive Connected ☁️"
                    : "⚡ Set Up Google Drive"}
                </span>
                <Settings className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {driveStatus.connected && driveStatus.folderLink && (
                <a
                  href={driveStatus.folderLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                  title="Open root Drive folder"
                >
                  <FolderOpen className="w-3 h-3" />
                  <span className="hidden md:inline">Open Drive Folder</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Customer KYC, electricity bills, DISCOM approvals, net metering agreements, and warranties
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-solar-deep hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={() => {
              fetchDocuments();
              fetchDriveStatus();
            }}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            title="Refresh documents list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by doc name, category, customer, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              {filteredDocs.length} Total Records
            </span>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-[11px] font-semibold">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat.value
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="px-5 py-3.5">Document Details</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Customer & Project</th>
                <th className="px-5 py-3.5">Storage</th>
                <th className="px-5 py-3.5">Uploaded By</th>
                <th className="px-5 py-3.5">Verification</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading documents...</span>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-700">No documents found</div>
                      <p className="text-xs text-slate-500">
                        {search || selectedCategory !== "ALL"
                          ? "Try clearing your search query or category filter."
                          : "Upload customer KYC, electricity bills, site surveys, or warranty files."}
                      </p>
                      {!search && selectedCategory === "ALL" && (
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="px-4 py-2 bg-solar-deep text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Upload First Document</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((d) => {
                  const isDrive = (d.fileLocation || "").includes("drive.google.com");
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div>{d.documentName}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {d.documentId}
                              {d.fileSizeBytes
                                ? ` · ${(d.fileSizeBytes / 1024).toFixed(0)} KB`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200/60">
                          {d.documentCategory.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{d.customer?.fullName || "Unlinked Customer"}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {d.customer?.primaryMobile ? `${d.customer.primaryMobile} · ` : ""}
                          {d.project?.projectId || "Customer Level"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isDrive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Cloud className="w-3 h-3" />
                            <span>Google Drive</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <HardDrive className="w-3 h-3" />
                            <span>Local CRM</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-700 font-medium">{d.uploadedBy}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {d.uploadedDate ? new Date(d.uploadedDate).toLocaleDateString("en-IN") : ""}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={d.verificationStatus || "PENDING"}
                          onChange={(e) => handleVerify(d.id, e.target.value as any)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-colors ${
                            d.verificationStatus === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : d.verificationStatus === "REJECTED"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          <option value="VERIFIED">VERIFIED</option>
                          <option value="PENDING">PENDING</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={d.fileLocation || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={isDrive ? "Open in Google Drive" : "View / Download Document"}
                          >
                            {isDrive ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                          </a>
                          <button
                            onClick={() => handleDelete(d.id, d.documentName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
                  <span>Upload to Central Repository</span>
                  {driveStatus.connected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      <span>Google Drive Enabled</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {driveStatus.connected
                    ? "File will be saved directly into Google Drive organized by customer."
                    : "File will be stored securely in local CRM storage."}
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Customer *
                </label>
                <select
                  required
                  value={uploadForm.customerId}
                  onChange={(e) => setUploadForm({ ...uploadForm, customerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Choose Registered Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.customerId}) · {c.primaryMobile}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={uploadForm.documentCategory}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, documentCategory: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aadhaar Card Front"
                    value={uploadForm.documentName}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, documentName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select File (PDF, Image, DOC)
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-2xl p-5 text-center bg-slate-50/50 transition-colors">
                  <input
                    type="file"
                    id="doc-file-input"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  />
                  <label
                    htmlFor="doc-file-input"
                    className="cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    <UploadCloud className="w-7 h-7 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">
                      {selectedFile ? selectedFile.name : "Click to select file from device"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(0)} KB · Ready for upload`
                        : "PDF, JPG, PNG, DOC up to 25MB"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Uploaded By
                  </label>
                  <input
                    type="text"
                    value={uploadForm.uploadedBy}
                    onChange={(e) => setUploadForm({ ...uploadForm, uploadedBy: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Verification
                  </label>
                  <select
                    value={uploadForm.verificationStatus}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, verificationStatus: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING">Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-solar-deep hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to {driveStatus.connected ? "Google Drive" : "Repository"}...</span>
                    </>
                  ) : (
                    <span>Upload Document</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Drive Setup & Settings Modal */}
      {showDriveSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-slate-900">
                    Google Drive Document Storage
                  </h3>
                  <p className="text-xs text-slate-500">
                    Store all CRM customer documents, bills & KYC directly in Google Drive
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveSetupModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Current Status Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  driveStatus.connected
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-amber-50/60 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        driveStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-800">
                      {driveStatus.connected
                        ? "Google Drive Connected & Active"
                        : "Google Drive Not Connected"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      driveStatus.connected
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {driveStatus.authMethod}
                  </span>
                </div>

                {driveStatus.connected ? (
                  <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Connected Account:</span>
                      <span className="font-semibold text-slate-800">
                        {driveStatus.accountEmail || "Authorized"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Folder:</span>
                      <span className="font-mono text-[11px] text-slate-800">
                        {driveStatus.folderName}
                      </span>
                    </div>
                    {driveStatus.folderLink && (
                      <div className="pt-2 flex items-center justify-between border-t border-emerald-100 mt-2">
                        <a
                          href={driveStatus.folderLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>View Folder in Google Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={handleDisconnectDrive}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <Unlink className="w-3 h-3" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 mt-1.5">
                    Files are currently stored in local secure CRM storage. Connect Google Drive below
                    so KYC and project documents automatically sync to the cloud.
                  </p>
                )}
              </div>

              {/* Tabs for Configuration Methods */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDriveTab("SERVICE_ACCOUNT");
                    setTestFeedback(null);
                  }}
                  className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                    activeDriveTab === "SERVICE_ACCOUNT"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  1. Service Account JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDriveTab("OAUTH2");
                    setTestFeedback(null);
                  }}
                  className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                    activeDriveTab === "OAUTH2"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  2. Sign-In (OAuth)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDriveTab("MANUAL");
                    setTestFeedback(null);
                  }}
                  className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                    activeDriveTab === "MANUAL"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  3. Manual Keys
                </button>
              </div>

              {/* Tab 1: Service Account JSON */}
              {activeDriveTab === "SERVICE_ACCOUNT" && (
                <div className="space-y-4 pt-1">
                  <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>Recommended for automated 24/7 background sync</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Download the JSON key file from <strong>Google Cloud Console</strong> &rarr; <strong>IAM & Admin</strong> &rarr; <strong>Service Accounts</strong> &rarr; <strong>Keys</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Upload Service Account JSON File
                    </label>
                    <input
                      type="file"
                      id="sa-json-input"
                      accept=".json"
                      onChange={handleSaJsonFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="sa-json-input"
                      className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center gap-1 bg-slate-50/60 transition-colors"
                    >
                      <UploadCloud className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">
                        {saJsonText ? "JSON Key Loaded (Click to change)" : "Click to select service-account.json"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {manualSaEmail ? `Account: ${manualSaEmail}` : "JSON key file from Google Cloud"}
                      </span>
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Or Paste JSON Content Directly
                      </label>
                      {saJsonText && (
                        <button
                          type="button"
                          onClick={() => {
                            setSaJsonText("");
                            setManualSaEmail("");
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={saJsonText}
                      onChange={(e) => {
                        setSaJsonText(e.target.value);
                        try {
                          const parsed = JSON.parse(e.target.value);
                          if (parsed.client_email) setManualSaEmail(parsed.client_email);
                        } catch {}
                      }}
                      placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..."}'
                      className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Google Drive Folder ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={driveFolderInput}
                      onChange={(e) => setDriveFolderInput(e.target.value)}
                      placeholder="e.g. 1a2b3c4d5e... (Leave blank to auto-create 'Sunlife Solar CRM Documents')"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      If using a custom folder, share it with the Service Account email as <strong>Editor</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: 1-Click Connect with Google Account (OAuth2) */}
              {activeDriveTab === "OAUTH2" && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-blue-600" />
                      <span>One-Click Authorization</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Sign in with your Google Account (e.g. <code>infosses24@gmail.com</code>). The CRM will create a
                      dedicated <strong>"Sunlife Solar CRM Documents"</strong> folder directly in your personal or company Google Drive.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Folder ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={driveFolderInput}
                      onChange={(e) => setDriveFolderInput(e.target.value)}
                      placeholder="Leave blank to auto-create folder in your Drive"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <a
                    href="/api/v1/admin/documents/drive-auth"
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span>Sign In with Google & Authorize Drive Access</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </a>
                </div>
              )}

              {/* Tab 3: Manual Keys */}
              {activeDriveTab === "MANUAL" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Folder ID *
                    </label>
                    <input
                      type="text"
                      value={driveFolderInput}
                      onChange={(e) => setDriveFolderInput(e.target.value)}
                      placeholder="Google Drive Folder ID"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Service Account Email
                    </label>
                    <input
                      type="email"
                      value={manualSaEmail}
                      onChange={(e) => setManualSaEmail(e.target.value)}
                      placeholder="your-storage-sa@project.iam.gserviceaccount.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Service Account Private Key
                    </label>
                    <textarea
                      rows={2}
                      value={manualSaKey}
                      onChange={(e) => setManualSaKey(e.target.value)}
                      placeholder="-----BEGIN PRIVATE KEY-----\n..."
                      className="w-full p-2.5 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="grow border-t border-slate-200"></div>
                    <span className="shrink mx-2 text-[10px] text-slate-400 font-bold uppercase">OR OAUTH</span>
                    <div className="grow border-t border-slate-200"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      OAuth2 Refresh Token
                    </label>
                    <input
                      type="text"
                      value={manualRefreshToken}
                      onChange={(e) => setManualRefreshToken(e.target.value)}
                      placeholder="1//04..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Test Feedback Message */}
              {testFeedback && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-medium ${
                    testFeedback.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-bold">{testFeedback.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                {activeDriveTab !== "OAUTH2" && (
                  <button
                    type="button"
                    disabled={testingConnection}
                    onClick={handleTestDriveConnection}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {testingConnection ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5 text-slate-500" />
                        <span>Test Connection</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriveSetupModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                {activeDriveTab !== "OAUTH2" && (
                  <button
                    type="button"
                    disabled={savingDrive}
                    onClick={handleSaveDriveConfig}
                    className="px-5 py-2.5 bg-solar-deep hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    {savingDrive ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <span>Save & Activate</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
