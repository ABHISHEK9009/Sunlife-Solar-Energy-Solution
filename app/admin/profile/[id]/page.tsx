"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Building,
  Zap,
  FileText,
  CreditCard,
  Award,
  Headphones,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  Plus,
  ExternalLink,
  Edit,
  Save,
  X,
  FileCheck,
  UploadCloud,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Eye,
  MessageSquare,
  Lock,
  Globe,
  Tag,
  ChevronRight,
  Download,
  Trash2,
  Share2,
  Smartphone,
  Check,
} from "lucide-react";

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Quick Activity state
  const [activityType, setActivityType] = useState("PHONE_CALL");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [activityVisibleToCust, setActivityVisibleToCust] = useState(false);
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Timeline filter
  const [timelineFilter, setTimelineFilter] = useState("ALL");

  // Edit Client Form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    primaryMobile: "",
    alternateMobile: "",
    email: "",
    installationAddress: "",
    billingAddress: "",
    propertyType: "RESIDENTIAL",
    preferredLanguage: "hi",
    customerStatus: "ACTIVE",
    appAccessEnabled: true,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Upload Doc Form state
  const [docForm, setDocForm] = useState({
    documentCategory: "ELECTRICITY_BILL",
    documentName: "",
    fileLocation: "",
    customerCanView: true,
  });
  const [savingDoc, setSavingDoc] = useState(false);

  // Convert Lead Form state
  const [convertForm, setConvertForm] = useState({
    plantCapacityKw: "3.0",
    solarType: "ROOFTOP_ON_GRID",
    notes: "",
  });
  const [convertingLead, setConvertingLead] = useState(false);

  const fetchProfile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${id}`);
      const data = await res.json();
      if (data.success) {
        setClient(data.client);
        setTimeline(data.timeline || []);
        setActiveProject(data.activeProject || null);
        setEditForm({
          fullName: data.client.fullName || "",
          primaryMobile: data.client.primaryMobile || "",
          alternateMobile: data.client.alternateMobile || "",
          email: data.client.email || "",
          installationAddress: data.client.installationAddress || "",
          billingAddress: data.client.billingAddress || "",
          propertyType: data.client.propertyType || "RESIDENTIAL",
          preferredLanguage: data.client.preferredLanguage || "hi",
          customerStatus: data.client.customerStatus || "ACTIVE",
          appAccessEnabled: data.client.appAccessEnabled ?? true,
        });
      } else {
        showToast(data.error || "Failed to load client profile.");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error fetching client profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Submit Activity Note
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim() || !activityDesc.trim()) {
      showToast("Please provide both an activity title and notes.");
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
          visibleToCustomer: activityVisibleToCust,
          projectId: activeProject?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Activity successfully logged to client timeline!");
        setActivityTitle("");
        setActivityDesc("");
        setActivityVisibleToCust(false);
        fetchProfile();
      } else {
        showToast(data.error || "Failed to log activity.");
      }
    } catch (err) {
      showToast("Network error logging activity.");
    } finally {
      setSubmittingActivity(false);
    }
  };

  // Submit Edit Details
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Client details successfully updated!");
        setShowEditModal(false);
        fetchProfile();
      } else {
        showToast(data.error || "Failed to update profile.");
      }
    } catch (err) {
      showToast("Network error updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Upload Document
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.documentName.trim()) {
      showToast("Please enter a document name.");
      return;
    }
    setSavingDoc(true);
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_DOCUMENT",
          documentCategory: docForm.documentCategory,
          documentName: docForm.documentName.trim(),
          fileLocation: docForm.fileLocation.trim() || `/uploads/docs/${Date.now()}.pdf`,
          projectId: activeProject?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Document successfully attached to client vault!");
        setShowDocModal(false);
        setDocForm({
          documentCategory: "ELECTRICITY_BILL",
          documentName: "",
          fileLocation: "",
          customerCanView: true,
        });
        fetchProfile();
      } else {
        showToast(data.error || "Failed to upload document.");
      }
    } catch (err) {
      showToast("Network error uploading document.");
    } finally {
      setSavingDoc(false);
    }
  };

  // Submit Convert Lead to Solar Project
  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const leadRecord = client?.leads && client.leads.length > 0 ? client.leads[0] : null;
    const targetLeadId = leadRecord?.id || (id.startsWith("cmt") || id.startsWith("SL-LEAD") ? id : null);

    if (!targetLeadId) {
      showToast("No unlinked inquiry lead found to convert.");
      return;
    }

    setConvertingLead(true);
    try {
      const res = await fetch("/api/v1/admin/leads/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: targetLeadId,
          plantCapacityKw: parseFloat(convertForm.plantCapacityKw) || 3.0,
          solarType: convertForm.solarType,
          notes: convertForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Lead successfully converted to Customer and Solar Project!");
        setShowConvertModal(false);
        fetchProfile();
      } else {
        showToast(data.error || "Failed to convert lead.");
      }
    } catch (err) {
      showToast("Network error converting lead.");
    } finally {
      setConvertingLead(false);
    }
  };

  // Filter timeline
  const filteredTimeline = timeline.filter((item) => {
    if (timelineFilter === "ALL") return true;
    if (timelineFilter === "CALLS") return item.type === "PHONE_CALL" || item.title.toLowerCase().includes("call");
    if (timelineFilter === "VISITS") return item.type === "SITE_VISIT" || item.title.toLowerCase().includes("visit");
    if (timelineFilter === "NOTES") return item.type === "NOTE" || item.type === "INTERNAL_NOTE";
    if (timelineFilter === "MILESTONES") return item.type === "MILESTONE" || item.source === "PROJECT_TIMELINE";
    return true;
  });

  const isLead = client?.customerStatus === "LEAD" || (!client?.projects?.length && client?.leads?.length > 0);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <div className="text-slate-600 font-semibold text-sm">
          Loading 360° Client Profile & Interactive Timeline...
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-slate-700 border border-slate-200 space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-lg font-bold text-slate-900">Client Record Not Found</div>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          We could not locate any active Customer or Lead record matching &quot;{id}&quot;.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/admin/customers"
            className="px-4 py-2 bg-solar-deep text-white rounded-xl text-xs font-bold hover:bg-solar-deep/90"
          >
            Customer Registry
          </Link>
          <Link
            href="/admin/leads"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
          >
            Leads Pipeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={isLead ? "/admin/leads" : "/admin/customers"}
            className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-solar-deep transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isLead ? "Back to All Leads" : "Back to All Customers"}</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 truncate max-w-[200px]">{client.fullName}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchProfile}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Refresh profile data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowDocModal(true)}
            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-solar-emerald" />
            <span>Attach Document</span>
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-1.5 bg-solar-deep text-white rounded-xl text-xs font-bold hover:bg-solar-deep/90 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-sun-amber" />
            <span>Edit Client Details</span>
          </button>

          {isLead && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl text-xs font-bold hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Convert to Solar Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Client Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-gradient-to-bl from-emerald-50 to-amber-50/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-solar-deep to-slate-900 text-sun-amber flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0 border border-emerald-900/40">
              {client.fullName.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold font-heading text-slate-900">
                  {client.fullName}
                </h1>
                {isLead ? (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Inquiry Lead</span>
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Customer</span>
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  {client.customerStatus}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {client.customerId}
                </span>
                {client.leads?.[0]?.leadId && (
                  <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Lead: {client.leads[0].leadId}
                  </span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{client.installationAddress}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Communication Hub */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <a
              href={`tel:${client.primaryMobile}`}
              className="px-3.5 py-2 bg-slate-50 hover:bg-solar-deep hover:text-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Call Primary Phone"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              <span>+91 {client.primaryMobile}</span>
            </a>

            <a
              href={`https://wa.me/91${client.primaryMobile.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                client.fullName
              )},%20greetings%20from%20Sunlife%20Solar%20Energy%20Solution.`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Open WhatsApp Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
                title="Send Email"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Email</span>
              </a>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>App Login / OTP</span>
            </div>
            <div className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              {client.appAccessEnabled ? (
                <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enabled (Active)</span>
                </span>
              ) : (
                <span className="text-red-500 font-semibold">Disabled</span>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Solar System Status</span>
            </div>
            <div className="font-bold text-slate-900 mt-1">
              {activeProject ? (
                <span className="text-solar-deep font-extrabold">
                  {activeProject.plantCapacityKw} kW Rooftop
                </span>
              ) : isLead ? (
                <span className="text-amber-700 font-semibold">
                  {client.leads?.[0]?.interestedSolution || "Inquiry Stage"}
                </span>
              ) : (
                <span className="text-slate-500">No project yet</span>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Document Vault</span>
            </div>
            <div className="font-bold text-slate-900 mt-1">
              {client.documents?.length || 0} Documents On File
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Activity History</span>
            </div>
            <div className="font-bold text-slate-900 mt-1">
              {timeline.length} Interactions Tracked
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive Timeline & Tracking Workspace (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick-Add Activity Tracking Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Log Client Activity & Future Tracking
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Record calls, site visits, quotations, or notes so future follow-up is effortless.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-3.5 text-xs">
              {/* Activity Type Selector Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { type: "PHONE_CALL", label: "📞 Phone Call" },
                  { type: "SITE_VISIT", label: "📍 Site Visit" },
                  { type: "MEETING", label: "🤝 In-Person Meeting" },
                  { type: "NOTE", label: "📝 Internal Note" },
                  { type: "MILESTONE", label: "🚀 Milestone" },
                ].map((pill) => (
                  <button
                    key={pill.type}
                    type="button"
                    onClick={() => setActivityType(pill.type)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activityType === pill.type
                        ? "bg-solar-deep text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder={
                    activityType === "PHONE_CALL"
                      ? "e.g. Discussed 3kW quote & 60% PM Surya Ghar subsidy eligibility"
                      : activityType === "SITE_VISIT"
                      ? "e.g. Conducted rooftop shadow analysis & electrical load measurement"
                      : "e.g. Client follow-up note"
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
                />
              </div>

              <div>
                <textarea
                  required
                  rows={3}
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  placeholder="Enter detailed outcome, next steps, commitments, or specific client requests..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={activityVisibleToCust}
                    onChange={(e) => setActivityVisibleToCust(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-[11px]">
                    Visible to client in their Customer Mobile App
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submittingActivity}
                  className="px-5 py-2.5 bg-solar-deep text-white font-bold rounded-xl hover:bg-solar-deep/90 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingActivity ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-sun-amber" />
                  )}
                  <span>Log Activity</span>
                </button>
              </div>
            </form>
          </div>

          {/* Chronological Activity Timeline Feed */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Chronological Activity Timeline</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {filteredTimeline.length}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Complete audit trail of all staff calls, site inspections, and automated milestones.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                {[
                  { id: "ALL", label: "All" },
                  { id: "CALLS", label: "Calls" },
                  { id: "VISITS", label: "Visits" },
                  { id: "NOTES", label: "Notes" },
                  { id: "MILESTONES", label: "Milestones" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTimelineFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      timelineFilter === tab.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTimeline.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No activity logs match the selected filter.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {filteredTimeline.map((item, idx) => {
                  const isCall =
                    item.type === "PHONE_CALL" || item.title.toLowerCase().includes("call");
                  const isVisit =
                    item.type === "SITE_VISIT" || item.title.toLowerCase().includes("visit");
                  const isMeeting =
                    item.type === "MEETING" || item.title.toLowerCase().includes("meeting");
                  const isInquiry = item.type === "INQUIRY";
                  const isMilestone =
                    item.type === "MILESTONE" || item.source === "PROJECT_TIMELINE";

                  let IconComponent = FileText;
                  let iconBg = "bg-slate-100 text-slate-700";
                  if (isCall) {
                    IconComponent = Phone;
                    iconBg = "bg-blue-100 text-blue-700";
                  } else if (isVisit) {
                    IconComponent = MapPin;
                    iconBg = "bg-purple-100 text-purple-700";
                  } else if (isMeeting) {
                    IconComponent = Users;
                    iconBg = "bg-amber-100 text-amber-800";
                  } else if (isInquiry) {
                    IconComponent = Mail;
                    iconBg = "bg-indigo-100 text-indigo-700";
                  } else if (isMilestone) {
                    IconComponent = Zap;
                    iconBg = "bg-emerald-100 text-emerald-800";
                  }

                  return (
                    <div key={item.id || idx} className="relative group">
                      {/* Timeline Node Pin */}
                      <div
                        className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-xs border-2 border-white ring-1 ring-slate-200 ${iconBg}`}
                      >
                        <IconComponent className="w-3 h-3" />
                      </div>

                      <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200/80 transition-all space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200/60 text-slate-700">
                              {item.type?.replace(/_/g, " ")}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(item.timestamp).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                          <span className="font-medium">
                            Actor: {item.actor || "ADMIN: Operations"}
                          </span>

                          {item.visibleToCustomer ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              <span>Visible to Client in App</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Internal CRM Note</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Client Details & Document Vault (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Client Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Client Information</h3>
                  <p className="text-[11px] text-slate-400">All registered credentials & contact details</p>
                </div>
              </div>

              <button
                onClick={() => setShowEditModal(true)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-solar-deep hover:bg-slate-100 transition-colors cursor-pointer"
                title="Edit Client Information"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between gap-2">
                <span className="text-slate-400 font-medium">Full Name</span>
                <span className="font-bold text-slate-900 text-right">{client.fullName}</span>
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <span className="text-slate-400 font-medium">Primary Mobile (App)</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  +91 {client.primaryMobile}
                </span>
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <span className="text-slate-400 font-medium">Alternate Phone</span>
                <span className="font-mono text-slate-700 text-right">
                  {client.alternateMobile ? `+91 ${client.alternateMobile}` : "—"}
                </span>
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <span className="text-slate-400 font-medium">Email Address</span>
                <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">
                  {client.email || "—"}
                </span>
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <span className="text-slate-400 font-medium">Property Category</span>
                <span className="font-semibold text-slate-900 text-right">
                  {client.propertyType === "COMMERCIAL"
                    ? "Commercial / Industrial"
                    : "Residential Rooftop"}
                </span>
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <span className="text-slate-400 font-medium">Preferred Language</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {client.preferredLanguage === "hi" ? "Hindi (हिंदी)" : "English"}
                </span>
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <span className="text-slate-400 font-medium">Installation Address</span>
                <span className="font-medium text-slate-900 text-right max-w-[230px]">
                  {client.installationAddress}
                </span>
              </div>

              {client.billingAddress && (
                <div className="pt-2 flex justify-between gap-2">
                  <span className="text-slate-400 font-medium">Billing Address</span>
                  <span className="font-medium text-slate-700 text-right max-w-[230px]">
                    {client.billingAddress}
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-between gap-2">
                <span className="text-slate-400 font-medium">Customer Status</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                  {client.customerStatus}
                </span>
              </div>

              <div className="pt-2 flex justify-between gap-2 items-center">
                <span className="text-slate-400 font-medium">Customer App Access</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    client.appAccessEnabled ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {client.appAccessEnabled ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authorized</span>
                    </>
                  ) : (
                    <span>Suspended</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Central Document Vault Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Document Vault</h3>
                  <p className="text-[11px] text-slate-400">
                    KYC, electricity bills, quotations & agreements
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDocModal(true)}
                className="px-3 py-1.5 bg-solar-deep text-white rounded-xl text-xs font-bold hover:bg-solar-deep/90 flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>

            {(!client.documents || client.documents.length === 0) ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-600">No Documents Uploaded</div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Attach KYC, Aadhaar, PAN card, electricity bills, or site survey sheets for this client.
                </p>
                <button
                  onClick={() => setShowDocModal(true)}
                  className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Upload First Document
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {client.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 shrink-0">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{doc.documentName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{doc.documentCategory.replace(/_/g, " ")}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {doc.verificationStatus}
                      </span>
                      <a
                        href={doc.fileLocation}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-solar-deep hover:bg-slate-100 transition-colors"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Solar Project or Lead Inquiry Card */}
          {activeProject ? (
            <div className="bg-gradient-to-br from-solar-deep to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sun-amber/20 text-sun-amber">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Solar Project Linked</h3>
                    <p className="text-[11px] text-white/70">{activeProject.projectId}</p>
                  </div>
                </div>

                <Link
                  href={`/admin/projects/${activeProject.id}`}
                  className="px-3 py-1.5 bg-sun-amber text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <span>Command Center</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-white/60 text-[10px]">Plant Capacity</div>
                  <div className="font-extrabold text-sun-amber text-base mt-0.5">
                    {activeProject.plantCapacityKw} kW
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-white/60 text-[10px]">Project Status</div>
                  <div className="font-bold text-emerald-300 text-xs mt-1 uppercase">
                    {activeProject.projectStatus?.replace(/_/g, " ")}
                  </div>
                </div>
              </div>
            </div>
          ) : isLead && client.leads?.[0] ? (
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-950 text-sm">Original Lead Inquiry</h3>
                    <p className="text-[11px] text-amber-800">
                      Captured via {client.leads[0].leadSource || "Website Quote Form"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowConvertModal(true)}
                  className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-xs cursor-pointer"
                >
                  Convert
                </button>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Electricity Bill:</span>
                  <span className="font-bold text-slate-900">
                    ₹{client.leads[0].monthlyBill || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Property Type:</span>
                  <span className="font-semibold text-slate-900">
                    {client.leads[0].propertyType || "Residential"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">City / Location:</span>
                  <span className="font-semibold text-slate-900">
                    {client.leads[0].city || "Narmadapuram"}
                  </span>
                </div>
                {client.leads[0].message && (
                  <div className="pt-2 border-t border-amber-200/60 text-slate-600 italic">
                    &ldquo;{client.leads[0].message}&rdquo;
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* MODAL 1: Edit Client Information */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Client Details</h3>
                <p className="text-xs text-slate-500">Updates sync instantly to database and app</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Primary Mobile (OTP) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.primaryMobile}
                    onChange={(e) => setEditForm({ ...editForm, primaryMobile: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    value={editForm.alternateMobile}
                    onChange={(e) => setEditForm({ ...editForm, alternateMobile: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Installation Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={editForm.installationAddress}
                  onChange={(e) => setEditForm({ ...editForm, installationAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Billing Address (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editForm.billingAddress}
                  onChange={(e) => setEditForm({ ...editForm, billingAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Property Type</label>
                  <select
                    value={editForm.propertyType}
                    onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="RESIDENTIAL">Residential Rooftop</option>
                    <option value="COMMERCIAL">Commercial / Industrial</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Language</label>
                  <select
                    value={editForm.preferredLanguage}
                    onChange={(e) => setEditForm({ ...editForm, preferredLanguage: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer Status</label>
                  <select
                    value={editForm.customerStatus}
                    onChange={(e) => setEditForm({ ...editForm, customerStatus: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="LEAD">LEAD (Inquiry Stage)</option>
                    <option value="REGISTERED">REGISTERED</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer App Access</label>
                  <select
                    value={editForm.appAccessEnabled ? "true" : "false"}
                    onChange={(e) =>
                      setEditForm({ ...editForm, appAccessEnabled: e.target.value === "true" })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="true">Enabled (Allow OTP Login)</option>
                    <option value="false">Disabled (Suspend Login)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 shadow-xs flex items-center gap-1.5"
                >
                  {savingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Attach Document */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Attach Document to Vault</h3>
                <p className="text-xs text-slate-500">Uploaded documents are linked permanently</p>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Document Category *</label>
                <select
                  value={docForm.documentCategory}
                  onChange={(e) => setDocForm({ ...docForm, documentCategory: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="ELECTRICITY_BILL">Electricity Bill</option>
                  <option value="CUSTOMER_KYC">Customer KYC (Aadhaar / PAN)</option>
                  <option value="QUOTATION">Solar Quotation / Proposal</option>
                  <option value="PURCHASE_AGREEMENT">Solar Purchase Agreement</option>
                  <option value="SITE_SURVEY_REPORT">Site Survey & Shadow Analysis</option>
                  <option value="CANCELLED_CHEQUE">Cancelled Cheque (Subsidy Bank Account)</option>
                  <option value="SUBSIDY_DOCUMENT">PM Surya Ghar Subsidy Document</option>
                  <option value="NET_METERING_DOCUMENT">DISCOM Net Metering Application</option>
                  <option value="OTHER">Other Official Document</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docForm.documentName}
                  onChange={(e) => setDocForm({ ...docForm, documentName: e.target.value })}
                  placeholder="e.g. Electricity Bill - May 2026 (Meter #MP04982)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  File Reference / Storage Path (Optional)
                </label>
                <input
                  type="text"
                  value={docForm.fileLocation}
                  onChange={(e) => setDocForm({ ...docForm, fileLocation: e.target.value })}
                  placeholder="/uploads/docs/customer-bill.pdf"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave blank for automatic secure internal cloud storage reference.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="px-5 py-2 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 shadow-xs flex items-center gap-1.5"
                >
                  {savingDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <span>Attach Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Convert Lead to Solar Project */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Convert Lead to Active Solar Project</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Instantly provisions customer ID & Solar Project workspace
                </p>
              </div>
              <button
                onClick={() => setShowConvertModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConvertLead} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Plant Capacity (kW) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={convertForm.plantCapacityKw}
                  onChange={(e) => setConvertForm({ ...convertForm, plantCapacityKw: e.target.value })}
                  placeholder="3.0"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-900 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Recommended: 3 kW qualifies for max PM Surya Ghar subsidy of ₹78,000.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">System Type</label>
                <select
                  value={convertForm.solarType}
                  onChange={(e) => setConvertForm({ ...convertForm, solarType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="ROOFTOP_ON_GRID">Rooftop On-Grid (Net Metered)</option>
                  <option value="HYBRID_BATTERY">Hybrid with Battery Backup</option>
                  <option value="COMMERCIAL_HT">Commercial / Industrial HT</option>
                  <option value="OFF_GRID">Off-Grid Solar</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Handover Notes / Site Constraints
                </label>
                <textarea
                  rows={2}
                  value={convertForm.notes}
                  onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
                  placeholder="e.g. RCC roof, shadow free south orientation, client requested advance survey"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertingLead}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-800 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {convertingLead ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>Confirm & Convert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
