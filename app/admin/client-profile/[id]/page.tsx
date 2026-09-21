"use client";

import { adminFetch as fetch } from "@/lib/admin-live";
import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import WhatsAppChatDrawer from "@/components/admin/WhatsAppChatDrawer";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Building,
  Zap,
  FileText,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Save,
  X,
  FileCheck,
  UploadCloud,
  Calendar,
  AlertCircle,
  Eye,
  MessageSquare,
  Lock,
  ChevronRight,
  Download,
  Trash2,
  Check,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Layers,
  PhoneCall,
  CalendarCheck,
  MoreVertical,
  ExternalLink,
  ChevronDown,
  Wrench,
  Compass,
  Truck,
  Shield,
  Sun,
  Paperclip,
} from "lucide-react";

// 7 Real Solar Installation Stages
const PIPELINE_STAGES = [
  { id: "ENQUIRY", label: "1. Enquiry", short: "Enquiry", desc: "Requirement captured" },
  { id: "SURVEY_SCHEDULED", label: "2. Site Survey", short: "Survey", desc: "Shadow & roof analysis" },
  { id: "QUOTATION_PENDING", label: "3. Quotation", short: "Quotation", desc: "Proposal & pricing sent" },
  { id: "DOCUMENTS_PENDING", label: "4. DISCOM Sanction", short: "DISCOM", desc: "Net metering application" },
  { id: "MATERIAL_PENDING", label: "5. Material Dispatch", short: "Dispatch", desc: "Panels & inverter sent" },
  { id: "INSTALLATION_SCHEDULED", label: "6. Installation", short: "Installation", desc: "Structure & module wiring" },
  { id: "NET_METERING_PENDING", label: "7. Net Meter & Subsidy", short: "Net Meter", desc: "Meter sync & PM Surya Ghar" },
];

export default function CustomerWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [showWhatsAppDrawer, setShowWhatsAppDrawer] = useState(false);

  // Active Workspace Tab: 'operations' | 'documents' | 'survey' | 'activity'
  const [activeTab, setActiveTab] = useState<"operations" | "documents" | "survey" | "activity">("operations");

  // Technical Specs Form
  const [specs, setSpecs] = useState({
    plantCapacityKw: "3.0",
    solarType: "ON_GRID",
    discom: "MPMKVVCL",
    consumerNumber: "",
    sanctionedLoad: "3.0",
    roofType: "RCC Flat Roof",
    availableRoofAreaSqFt: "350",
    shadowInfo: "Shadow-free south orientation",
    panelBrandModel: "Waaree 540W Mono PERC",
    panelQuantity: "6",
    inverterBrandModel: "Growatt 3.3kW On-Grid",
    inverterSerialNumber: "",
  });
  const [savingSpecs, setSavingSpecs] = useState(false);

  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Document Upload State
  const [docCategory, setDocCategory] = useState("ELECTRICITY_BILL");
  const [docTitle, setDocTitle] = useState("");
  const [docFileLocation, setDocFileLocation] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [topSelectedFile, setTopSelectedFile] = useState<File | null>(null);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);

  const checklistFileInputRef = useRef<HTMLInputElement>(null);
  const topFileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadDocRef = useRef<{ category: string; name: string } | null>(null);

  // Log Activity State
  const [activityType, setActivityType] = useState("PHONE_CALL");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Stage change modal/dropdown
  const [updatingStage, setUpdatingStage] = useState(false);

  const loadRequest = useRef(0);
  const fetchProfile = async (background = false) => {
    const request = ++loadRequest.current;
    if (!id) return;
    if (!background && !client) setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${id}`);
      const data = await res.json();
      if (request !== loadRequest.current) return;
      if (data.success) {
        setClient(data.client);
        setTimeline(data.timeline || []);
        setActiveProject(data.activeProject || null);
        setTeamMembers(data.teamMembers || []);

        if (data.activeProject) {
          setSpecs({
            plantCapacityKw: String(data.activeProject.plantCapacityKw || 3.0),
            solarType: data.activeProject.solarType || "ON_GRID",
            discom: data.activeProject.discom || "MPMKVVCL",
            consumerNumber: data.activeProject.consumerNumber || "",
            sanctionedLoad: "3.0",
            roofType: data.client.surveys?.[0]?.roofType || "RCC Flat Roof",
            availableRoofAreaSqFt: String(data.client.surveys?.[0]?.availableRoofAreaSqFt || "350"),
            shadowInfo: data.client.surveys?.[0]?.shadowInfo || "Shadow-free south orientation",
            panelBrandModel: data.activeProject.panelBrandModel || "Waaree 540W Mono PERC",
            panelQuantity: String(data.activeProject.panelQuantity || 6),
            inverterBrandModel: data.activeProject.inverterBrandModel || "Growatt 3.3kW On-Grid",
            inverterSerialNumber: data.activeProject.inverterSerialNumber || "",
          });
        }
      } else {
        showToast(data.error || "Failed to load customer workspace.");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error loading customer workspace.");
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Determine current stage
  const rawStatus = activeProject?.projectStatus || client?.customerStatus || "ENQUIRY";

  const getStageIndex = () => {
    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      if (PIPELINE_STAGES[i].id === rawStatus) return i;
    }
    if (rawStatus.includes("SURVEY")) return 1;
    if (rawStatus.includes("QUOTATION")) return 2;
    if (rawStatus.includes("DOCUMENTS")) return 3;
    if (rawStatus.includes("MATERIAL")) return 4;
    if (rawStatus.includes("INSTALLATION")) return 5;
    if (rawStatus.includes("NET_METER") || rawStatus.includes("SUBSIDY") || rawStatus === "ACTIVE") return 6;
    return 0;
  };

  const currentStageIndex = getStageIndex();

  // 1-Click Stage Updater
  const handleUpdateStage = async (newStageId: string) => {
    setUpdatingStage(true);
    if (activeProject) {
      setActiveProject({ ...activeProject, projectStatus: newStageId });
    }
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STAGE",
          stage: newStageId,
          notes: `Operational stage moved to ${newStageId.replace(/_/g, " ")}`,
          visibleToCustomer: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Stage updated to ${newStageId.replace(/_/g, " ")}!`);
        fetchProfile(true);
      } else {
        showToast(data.error || "Failed to update stage.");
      }
    } catch (err) {
      showToast("Network error updating stage.");
    } finally {
      setUpdatingStage(false);
    }
  };

  // Save Technical Specs
  const handleSaveSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSpecs(true);
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SPECS",
          ...specs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Technical & DISCOM specifications saved successfully!");
        fetchProfile(true);
      } else {
        showToast(data.error || "Failed to save specs.");
      }
    } catch (err) {
      showToast("Network error saving specs.");
    } finally {
      setSavingSpecs(false);
    }
  };

  // Reassign Staff
  const handleAssignStaff = async (salesId?: string, engId?: string) => {
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_OFFICER",
          salesExecutiveId: salesId,
          engineerId: engId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Assigned staff updated!");
        fetchProfile(true);
      }
    } catch (err) {
      showToast("Network error updating staff.");
    }
  };

  // Trigger Attach for a checklist item (opens native file picker directly)
  const triggerAttach = (category: string, name: string) => {
    pendingUploadDocRef.current = { category, name };
    checklistFileInputRef.current?.click();
  };

  // Handle Checklist File Selection & Direct Upload
  const handleChecklistFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadDocRef.current) return;
    const targetDoc = pendingUploadDocRef.current;
    setUploadingCategory(targetDoc.category);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("customerId", client?.id || id);
      formData.append("documentCategory", targetDoc.category);
      formData.append("documentName", targetDoc.name);
      if (activeProject?.id) formData.append("projectId", activeProject.id);
      formData.append("uploadedBy", "Admin");
      formData.append("verificationStatus", "VERIFIED");

      const res = await fetch("/api/v1/admin/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${targetDoc.name} uploaded & verified!`);
        fetchProfile(true);
      } else {
        showToast(data.error || "Failed to upload document.");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error uploading document.");
    } finally {
      setUploadingCategory(null);
      if (checklistFileInputRef.current) checklistFileInputRef.current.value = "";
    }
  };

  // Handle Top File Selection
  const handleTopFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTopSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  // Save / Upload Document (Top Card)
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() && !topSelectedFile) {
      showToast("Please select a file or enter a document title.");
      return;
    }
    setUploadingDoc(true);
    try {
      if (topSelectedFile) {
        const formData = new FormData();
        formData.append("file", topSelectedFile);
        formData.append("customerId", client?.id || id);
        formData.append("documentCategory", docCategory);
        formData.append("documentName", docTitle.trim() || topSelectedFile.name);
        if (activeProject?.id) formData.append("projectId", activeProject.id);
        formData.append("uploadedBy", "Admin");
        formData.append("verificationStatus", "VERIFIED");

        const res = await fetch("/api/v1/admin/documents/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          showToast(`${docTitle.trim() || topSelectedFile.name} uploaded to vault!`);
          setDocTitle("");
          setTopSelectedFile(null);
          setDocFileLocation("");
          fetchProfile(true);
        } else {
          showToast(data.error || "Failed to upload document.");
        }
      } else {
        const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ADD_DOCUMENT",
            documentCategory: docCategory,
            documentName: docTitle.trim(),
            fileLocation: docFileLocation.trim() || `/uploads/docs/${Date.now()}.pdf`,
            projectId: activeProject?.id,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Document recorded successfully!");
          setDocTitle("");
          setDocFileLocation("");
          fetchProfile(true);
        } else {
          showToast(data.error || "Failed to record document.");
        }
      }
    } catch (err) {
      showToast("Network error uploading document.");
    } finally {
      setUploadingDoc(false);
      if (topFileInputRef.current) topFileInputRef.current.value = "";
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/documents?id=${docId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Document "${docName}" deleted.`);
        fetchProfile(true);
      } else {
        showToast(data.error || "Failed to delete document.");
      }
    } catch (err) {
      showToast("Network error deleting document.");
    }
  };

  // Log Activity
  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim() || !activityDesc.trim()) {
      showToast("Title and details are required.");
      return;
    }
    setSubmittingActivity(true);
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_ACTIVITY",
          activityType,
          title: activityTitle.trim(),
          description: activityDesc.trim(),
          visibleToCustomer: false,
          projectId: activeProject?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Activity logged successfully!");
        setActivityTitle("");
        setActivityDesc("");
        fetchProfile(true);
      } else {
        showToast(data.error || "Failed to log activity.");
      }
    } catch (err) {
      showToast("Network error logging activity.");
    } finally {
      setSubmittingActivity(false);
    }
  };

  // Save Follow-up
  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) return;
    setSavingFollowUp(true);
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_ACTIVITY",
          activityType: "FOLLOW_UP",
          title: `Follow-up: ${new Date(followUpDate).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          description: followUpNote.trim() || "Scheduled follow-up call with customer",
          visibleToCustomer: false,
          projectId: activeProject?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Follow-up successfully scheduled!");
        setFollowUpNote("");
        fetchProfile(true);
      }
    } catch (err) {
      showToast("Error scheduling follow-up.");
    } finally {
      setSavingFollowUp(false);
    }
  };

  // Standard Solar Document Types Checklist
  const STANDARD_DOCS = [
    { category: "ELECTRICITY_BILL", name: "Latest Electricity Bill", req: "Required for DISCOM Sanction" },
    { category: "CUSTOMER_KYC", name: "Customer Aadhaar / KYC", req: "Required for Portal & Subsidy" },
    { category: "AADHAAR_PAN", name: "Customer PAN Card", req: "Required for Solar Loan / Commercial" },
    { category: "PURCHASE_AGREEMENT", name: "Roof Ownership / Property Tax", req: "Required for DISCOM Feasibility" },
    { category: "SITE_SURVEY_REPORT", name: "Site Survey Photos & Shadow Sketch", req: "Required for Engineering Design" },
    { category: "CANCELLED_CHEQUE", name: "Cancelled Cheque", req: "Required for PM Surya Ghar DBT Subsidy" },
    { category: "QUOTATION", name: "Solar Proposal / Quotation", req: "Signed Customer Proposal" },
    { category: "NET_METERING_DOCUMENT", name: "DISCOM Net Metering Application", req: "Discom Submission Proof" },
  ];

  const getUploadedDoc = (category: string) => {
    return client?.documents?.find((d: any) => d.documentCategory === category || d.documentCategory.includes(category));
  };

  if (loading && !client) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto p-4 animate-pulse">
        <div className="h-12 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 h-96 bg-slate-100 rounded-xl" />
          <div className="col-span-4 h-96 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-slate-700 border border-slate-200 space-y-3 max-w-lg mx-auto mt-12">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <div className="text-base font-bold text-slate-900">Customer Workspace Not Found</div>
        <p className="text-xs text-slate-500">Record &quot;{id}&quot; was not found in the database.</p>
        <Link
          href="/admin/customers"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
        >
          ← Return to Customer Registry
        </Link>
      </div>
    );
  }

  const nextStageObj = PIPELINE_STAGES[currentStageIndex + 1];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-800 text-xs">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT OPERATIONAL HEADER
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Back to Customers"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-heading text-slate-900 leading-tight">
                {client.fullName}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                {client.customerId}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                {client.propertyType === "COMMERCIAL" ? "Commercial Solar" : "Residential Rooftop"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{client.installationAddress}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                {activeProject?.plantCapacityKw || 3.0} kW Solar System
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Stage Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Stage:</span>
            <select
              value={rawStatus}
              onChange={(e) => handleUpdateStage(e.target.value)}
              className="bg-transparent font-bold text-emerald-900 text-xs cursor-pointer focus:outline-none"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {nextStageObj && (
            <button
              onClick={() => handleUpdateStage(nextStageObj.id)}
              disabled={updatingStage}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>Advance to {nextStageObj.short}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => fetchProfile(true)}
            className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <Link
            href={`/admin/profile/${id}`}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <span>Full 360° Profile</span>
            <ExternalLink className="w-3 h-3 text-amber-300" />
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. HORIZONTAL 7-STAGE PIPELINE PROGRESSION
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-center">
          {PIPELINE_STAGES.map((st, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isPending = idx > currentStageIndex;

            return (
              <button
                key={st.id}
                onClick={() => handleUpdateStage(st.id)}
                className={`p-2 rounded-lg text-left transition-all border cursor-pointer ${
                  isCurrent
                    ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs"
                    : isCompleted
                    ? "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold px-1 rounded ${
                      isCurrent
                        ? "bg-emerald-600 text-white"
                        : isCompleted
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    Step {idx + 1}
                  </span>
                  {isCompleted && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                <div
                  className={`font-bold text-[11px] truncate mt-1 ${
                    isCurrent ? "text-emerald-950" : isCompleted ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {st.short}
                </div>
                <div className="text-[9px] text-slate-400 truncate">{st.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN 2-COLUMN OPERATIONAL WORKSPACE
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ═════════════════════════════════════════════════════════════
            LEFT/MIDDLE: PRIMARY OPERATIONAL WORK AREA (8 cols)
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-4">
          {/* Operational Tabs Navigation */}
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto text-xs font-bold">
            {[
              { id: "operations", label: "Operations & Specs", icon: Wrench },
              { id: "documents", label: "Document Manager", icon: FileText, count: client.documents?.length },
              { id: "survey", label: "Site Survey", icon: Compass },
              { id: "activity", label: "Timeline & Activity", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────
              TAB 1: OPERATIONS & TECHNICAL SPECS (DEFAULT)
          ───────────────────────────────────────────────────────── */}
          {activeTab === "operations" && (
            <div className="space-y-4">
              {/* Technical Solar & DISCOM Parameters Form */}
              <form onSubmit={handleSaveSpecs} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Solar Plant & Grid Specifications</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Engineering parameters, rooftop dimensions, and DISCOM consumer data
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={savingSpecs}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {savingSpecs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-sun-amber" />}
                    <span>Save Specifications</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">System Capacity (kW) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={specs.plantCapacityKw}
                      onChange={(e) => setSpecs({ ...specs, plantCapacityKw: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Solar System Type</label>
                    <select
                      value={specs.solarType}
                      onChange={(e) => setSpecs({ ...specs, solarType: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="ON_GRID">Rooftop On-Grid (Net Metered)</option>
                      <option value="HYBRID">Hybrid (Battery Backup)</option>
                      <option value="OFF_GRID">Off-Grid Solar</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">DISCOM Name</label>
                    <input
                      type="text"
                      value={specs.discom}
                      onChange={(e) => setSpecs({ ...specs, discom: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Consumer Number (DISCOM)</label>
                    <input
                      type="text"
                      placeholder="e.g. 100293847"
                      value={specs.consumerNumber}
                      onChange={(e) => setSpecs({ ...specs, consumerNumber: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Sanctioned Load (kW)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={specs.sanctionedLoad}
                      onChange={(e) => setSpecs({ ...specs, sanctionedLoad: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Roof Type</label>
                    <select
                      value={specs.roofType}
                      onChange={(e) => setSpecs({ ...specs, roofType: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="RCC Flat Roof">RCC Flat Roof</option>
                      <option value="Tin Shed">Tin / Metal Shed</option>
                      <option value="Elevated Structure">Elevated Structure</option>
                      <option value="Tile Roof">Tiled Roof</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Available Roof Area (sq ft)</label>
                    <input
                      type="number"
                      value={specs.availableRoofAreaSqFt}
                      onChange={(e) => setSpecs({ ...specs, availableRoofAreaSqFt: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">PV Panel Brand & Model</label>
                    <input
                      type="text"
                      value={specs.panelBrandModel}
                      onChange={(e) => setSpecs({ ...specs, panelBrandModel: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Panel Quantity</label>
                    <input
                      type="number"
                      value={specs.panelQuantity}
                      onChange={(e) => setSpecs({ ...specs, panelQuantity: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-600 block mb-1">Inverter Brand & Model</label>
                    <input
                      type="text"
                      value={specs.inverterBrandModel}
                      onChange={(e) => setSpecs({ ...specs, inverterBrandModel: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Inverter Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. GRW-2026-981"
                      value={specs.inverterSerialNumber}
                      onChange={(e) => setSpecs({ ...specs, inverterSerialNumber: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium"
                    />
                  </div>
                </div>
              </form>

              {/* Commercial & Subsidy Financial Summary */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>Commercial & Subsidy Financial Overview</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">3.0 kW Standard Residential</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-slate-400 text-[10px]">Gross System Price</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">₹1,80,000</div>
                    <div className="text-[9px] text-slate-400">₹60,000 / kW turnkey</div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                    <div className="text-emerald-800 text-[10px] font-semibold">PM Surya Ghar Subsidy</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">₹78,000</div>
                    <div className="text-[9px] text-emerald-700">Direct DBT to client</div>
                  </div>

                  <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100">
                    <div className="text-purple-800 text-[10px] font-semibold">Net Customer Cost</div>
                    <div className="text-sm font-bold text-purple-900 mt-0.5">₹1,02,000</div>
                    <div className="text-[9px] text-purple-700">Effective investment</div>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                    <div className="text-blue-800 text-[10px] font-semibold">Advance Payment</div>
                    <div className="text-sm font-bold text-blue-900 mt-0.5">₹40,000</div>
                    <div className="text-[9px] text-blue-700">Booking advance</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB 2: REAL DOCUMENT MANAGER
          ───────────────────────────────────────────────────────── */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              {/* Hidden File Inputs for Direct Native File Browsing */}
              <input
                type="file"
                ref={checklistFileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.doc,.docx"
                onChange={handleChecklistFileSelected}
              />
              <input
                type="file"
                ref={topFileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.doc,.docx"
                onChange={handleTopFileSelected}
              />

              {/* Document Upload Bar */}
              <form onSubmit={handleUploadDoc} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span>Attach Customer Document</span>
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, JPG, PNG, Excel, Word</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Category *</label>
                    <select
                      value={docCategory}
                      onChange={(e) => {
                        setDocCategory(e.target.value);
                        const match = STANDARD_DOCS.find((d) => d.category === e.target.value);
                        if (match && !docTitle) setDocTitle(match.name);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="ELECTRICITY_BILL">Electricity Bill</option>
                      <option value="CUSTOMER_KYC">Customer KYC (Aadhaar / PAN)</option>
                      <option value="PURCHASE_AGREEMENT">Property / Roof Ownership Proof</option>
                      <option value="SITE_SURVEY_REPORT">Site Survey Photos & Shadow Sketch</option>
                      <option value="CANCELLED_CHEQUE">Cancelled Cheque (Subsidy DBT)</option>
                      <option value="QUOTATION">Solar Quotation / Proposal</option>
                      <option value="NET_METERING_DOCUMENT">DISCOM Net Metering Application</option>
                      <option value="INVOICE">Solar Equipment Invoice</option>
                      <option value="OTHER">Other Official Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Document Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Latest Electricity Bill"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Select File & Upload</label>
                    <div className="flex gap-1.5">
                      {topSelectedFile ? (
                        <div className="flex-1 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center justify-between overflow-hidden">
                          <span className="font-semibold text-emerald-800 truncate text-[11px] flex items-center gap-1">
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{topSelectedFile.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setTopSelectedFile(null)}
                            className="text-emerald-700 hover:text-red-600 p-0.5 ml-1 shrink-0 cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => topFileInputRef.current?.click()}
                          className="flex-1 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                          <span>Choose File...</span>
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={uploadingDoc || (!topSelectedFile && !docTitle)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-xs transition-colors"
                      >
                        {uploadingDoc ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Mandatory Checklist Grid */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Mandatory Solar Compliance Checklist</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {STANDARD_DOCS.filter((d) => getUploadedDoc(d.category)).length} of {STANDARD_DOCS.length} verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {STANDARD_DOCS.map((req, idx) => {
                    const uploaded = getUploadedDoc(req.category);
                    const isUploading = uploadingCategory === req.category;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                          uploaded
                            ? "bg-emerald-50/50 border-emerald-200"
                            : isUploading
                            ? "bg-amber-50/60 border-amber-300"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            {uploaded && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                            <span className="truncate">{req.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {uploaded
                              ? `Uploaded ${new Date(uploaded.uploadedDate).toLocaleDateString()}`
                              : req.req}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUploading ? (
                            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Uploading...</span>
                            </span>
                          ) : uploaded ? (
                            <>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                Verified
                              </span>
                              <a
                                href={uploaded.fileLocation}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                                title="View Document"
                              >
                                <Eye className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => triggerAttach(req.category, req.name)}
                                className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 cursor-pointer"
                                title="Replace / Re-upload"
                              >
                                <UploadCloud className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDoc(uploaded.id, req.name)}
                                className="p-1 rounded bg-white border border-slate-200 text-slate-400 hover:text-red-600 cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => triggerAttach(req.category, req.name)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Attach</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Uploaded Documents List */}
              {client.documents && client.documents.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>All Attached Files ({client.documents.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Vault Records</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {client.documents.map((doc: any) => (
                      <div key={doc.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{doc.documentName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {doc.documentCategory.replace(/_/g, " ")} • {new Date(doc.uploadedDate).toLocaleDateString()}
                            {doc.fileSizeBytes ? ` • ${Math.round(doc.fileSizeBytes / 1024)} KB` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                            {doc.verificationStatus || "VERIFIED"}
                          </span>
                          <a
                            href={doc.fileLocation}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="View Document"
                          >
                            <Eye className="w-3 h-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id, doc.documentName)}
                            className="p-1 rounded border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB 3: SITE SURVEY & ENGINEERING
          ───────────────────────────────────────────────────────── */}
          {activeTab === "survey" && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-600" />
                    <span>Site Survey & Shadow Analysis</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Rooftop measurements, electrical meter location, and shadow study
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateStage("SURVEY_SCHEDULED")}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Site Survey</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-900">Survey & Structural Data</div>
                  <div className="space-y-1.5 divide-y divide-slate-200/60">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Roof Construction:</span>
                      <span className="font-bold text-slate-900">{specs.roofType}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Available Area:</span>
                      <span className="font-bold text-slate-900">{specs.availableRoofAreaSqFt} sq ft</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Shadow Condition:</span>
                      <span className="font-bold text-emerald-800">{specs.shadowInfo}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Orientation:</span>
                      <span className="font-bold text-slate-900">True South (Ideal)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-900">Electrical & Grid Connection</div>
                  <div className="space-y-1.5 divide-y divide-slate-200/60">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">DISCOM:</span>
                      <span className="font-bold text-slate-900">{specs.discom}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Consumer Number:</span>
                      <span className="font-mono font-bold text-purple-700">
                        {specs.consumerNumber || "Pending Entry"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Sanctioned Load:</span>
                      <span className="font-bold text-slate-900">{specs.sanctionedLoad} kW</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Phase:</span>
                      <span className="font-bold text-slate-900">Single Phase (230V)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB 4: TIMELINE & ACTIVITY LOG
          ───────────────────────────────────────────────────────── */}
          {activeTab === "activity" && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="font-bold text-slate-900 text-sm">Operational Activity & Audit Trail</h3>
                <p className="text-[11px] text-slate-400">
                  Staff phone calls, site inspections, and automated system milestones
                </p>
              </div>

              {/* Quick Activity Composer */}
              <form onSubmit={handleLogActivity} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  {["PHONE_CALL", "SITE_VISIT", "NOTE"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActivityType(t)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                        activityType === t ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"
                      }`}
                    >
                      {t.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Title: e.g. Discussed DISCOM load sanction with client"
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Details: e.g. Client agreed to pay balance on material dispatch"
                    value={activityDesc}
                    onChange={(e) => setActivityDesc(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingActivity}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                  >
                    {submittingActivity ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    <span>Log Activity</span>
                  </button>
                </div>
              </form>

              {/* Scrollable Timeline List */}
              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                {timeline.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                          {item.type?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span>
                        {new Date(item.timestamp).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {item.description && <p className="text-slate-700 text-xs">{item.description}</p>}
                    <div className="text-[10px] text-slate-400">Actor: {item.actor || "Staff"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════
            RIGHT: OPERATIONAL CONTROL PANEL (STICKY, 4 cols)
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
          {/* Client Snapshot Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                CLIENT SNAPSHOT
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                ● Active
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-sun-amber flex items-center justify-center font-bold text-base shrink-0">
                {client.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="font-bold text-slate-900 truncate">{client.fullName}</div>
                <div className="font-mono text-emerald-800 font-bold text-[11px]">{client.customerId}</div>
              </div>
            </div>

            <div className="space-y-1.5 divide-y divide-slate-100 pt-1 text-xs">
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Phone:</span>
                <a href={`tel:${client.primaryMobile}`} className="font-mono font-bold text-slate-800 hover:text-emerald-700">
                  +91 {client.primaryMobile}
                </a>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">{client.email || "—"}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Requirement:</span>
                <span className="font-bold text-slate-900">
                  {client.propertyType === "COMMERCIAL" ? "Commercial" : "Residential"} • {activeProject?.plantCapacityKw || 3} kW
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">DISCOM:</span>
                <span className="font-semibold text-slate-800">{specs.discom}</span>
              </div>
            </div>

            {/* Quick Actions Strip */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${client.primaryMobile}`}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-center font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call Client</span>
              </a>
              <button
                type="button"
                onClick={() => setShowWhatsAppDrawer(true)}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-center font-bold text-xs text-emerald-800 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Assigned Officers Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              ASSIGNED FIELD OFFICERS
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Sales Executive</label>
                <select
                  value={client.assignedSalesExecutiveId || activeProject?.assignedSalesExecutiveId || ""}
                  onChange={(e) => handleAssignStaff(e.target.value, activeProject?.assignedEngineerId)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                >
                  <option value="">-- Assign Sales Agent --</option>
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} ({tm.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Project / Survey Engineer</label>
                <select
                  value={activeProject?.assignedEngineerId || ""}
                  onChange={(e) => handleAssignStaff(client.assignedSalesExecutiveId, e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                >
                  <option value="">-- Assign Project Engineer --</option>
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} ({tm.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Next Follow-Up Schedule Card */}
          <form onSubmit={handleSaveFollowUp} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>SCHEDULE NEXT FOLLOW-UP</span>
              </span>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">Follow-Up Note</label>
              <input
                type="text"
                placeholder="e.g. Call client regarding quotation approval"
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingFollowUp || !followUpDate}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {savingFollowUp ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CalendarCheck className="w-3.5 h-3.5" />}
              <span>Save Follow-Up</span>
            </button>
          </form>
        </div>
      </div>

      {client && (
        <WhatsAppChatDrawer
          isOpen={showWhatsAppDrawer}
          onClose={() => setShowWhatsAppDrawer(false)}
          phone={client.primaryMobile}
          customerName={client.fullName}
          customerId={client.id}
          plantCapacityKw={activeProject?.plantCapacityKw}
        />
      )}
    </div>
  );
}
