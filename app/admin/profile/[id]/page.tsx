"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
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
  Award,
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
  ShieldCheck,
  AlertCircle,
  Eye,
  MessageSquare,
  Lock,
  ChevronRight,
  Download,
  Trash2,
  Smartphone,
  Check,
  Compass,
  Truck,
  Wrench,
  Shield,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Layers,
  Settings,
  DollarSign,
  ChevronDown,
  Cpu,
} from "lucide-react";

// 7-Stage Unified Solar Operations Lifecycle
const OPERATIONAL_STAGES = [
  {
    id: "ENQUIRY",
    aliases: ["NEW", "CONTACTED", "LEAD"],
    stageNumber: 1,
    title: "1. Lead / Inquiry",
    shortLabel: "Inquiry",
    desc: "Customer requirement captured & load evaluated",
    color: "amber",
  },
  {
    id: "SURVEY_SCHEDULED",
    aliases: ["SURVEY_COMPLETED", "DESIGN_PREPARED"],
    stageNumber: 2,
    title: "2. Site Survey",
    shortLabel: "Survey",
    desc: "Rooftop shadow analysis & structure feasibility",
    color: "blue",
  },
  {
    id: "QUOTATION_PENDING",
    aliases: ["QUOTATION_APPROVED", "ORDER_CONFIRMED"],
    stageNumber: 3,
    title: "3. Quotation & Deal",
    shortLabel: "Quotation",
    desc: "Solar proposal approved & advance payment booked",
    color: "indigo",
  },
  {
    id: "DOCUMENTS_PENDING",
    aliases: ["DOCUMENTS_SUBMITTED"],
    stageNumber: 4,
    title: "4. DISCOM & Sanction",
    shortLabel: "DISCOM Sanction",
    desc: "Net metering application & consumer load sanction",
    color: "purple",
  },
  {
    id: "MATERIAL_PENDING",
    aliases: ["MATERIAL_DISPATCHED"],
    stageNumber: 5,
    title: "5. Material Dispatch",
    shortLabel: "Dispatch",
    desc: "Panels, inverter & mounting structures dispatched",
    color: "cyan",
  },
  {
    id: "INSTALLATION_SCHEDULED",
    aliases: ["INSTALLATION_IN_PROGRESS", "INSTALLATION_COMPLETED"],
    stageNumber: 6,
    title: "6. Installation & Testing",
    shortLabel: "Installation",
    desc: "Structure erection, module wiring & safety testing",
    color: "emerald",
  },
  {
    id: "NET_METERING_PENDING",
    aliases: ["NET_METER_INSTALLED", "SUBSIDY_PROCESSING", "ACTIVE", "COMPLETED"],
    stageNumber: 7,
    title: "7. Net Meter & Subsidy",
    shortLabel: "Net Meter & Subsidy",
    desc: "Bi-directional meter sync & PM Surya Ghar subsidy",
    color: "green",
  },
];

// All available detailed project statuses for the direct dropdown
const ALL_PROJECT_STATUSES = [
  { id: "ENQUIRY", label: "Enquiry / Lead Stage", stageGroup: 1 },
  { id: "SURVEY_SCHEDULED", label: "Site Survey Scheduled", stageGroup: 2 },
  { id: "SURVEY_COMPLETED", label: "Site Survey Completed", stageGroup: 2 },
  { id: "DESIGN_PREPARED", label: "Plant Design Prepared", stageGroup: 2 },
  { id: "QUOTATION_PENDING", label: "Quotation Pending / Sent", stageGroup: 3 },
  { id: "QUOTATION_APPROVED", label: "Quotation Approved by Client", stageGroup: 3 },
  { id: "ORDER_CONFIRMED", label: "Order Confirmed (Advance Received)", stageGroup: 3 },
  { id: "DOCUMENTS_PENDING", label: "DISCOM Documents Pending", stageGroup: 4 },
  { id: "DOCUMENTS_SUBMITTED", label: "DISCOM Application Submitted", stageGroup: 4 },
  { id: "MATERIAL_PENDING", label: "Material Procurement Pending", stageGroup: 5 },
  { id: "MATERIAL_DISPATCHED", label: "Material Dispatched to Site", stageGroup: 5 },
  { id: "INSTALLATION_SCHEDULED", label: "Installation Scheduled", stageGroup: 6 },
  { id: "INSTALLATION_IN_PROGRESS", label: "Installation in Progress", stageGroup: 6 },
  { id: "INSTALLATION_COMPLETED", label: "Installation Completed", stageGroup: 6 },
  { id: "NET_METERING_PENDING", label: "Net Metering Inspection Pending", stageGroup: 7 },
  { id: "NET_METER_INSTALLED", label: "Bi-directional Meter Installed", stageGroup: 7 },
  { id: "SUBSIDY_PROCESSING", label: "PM Surya Ghar Subsidy Processing", stageGroup: 7 },
  { id: "ACTIVE", label: "Active & Generating (Complete)", stageGroup: 7 },
];

export default function ClientProfilePage() {
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

  // Active Tab: 'operations' | 'specs' | 'documents' | 'financials' | 'profile'
  const [activeTab, setActiveTab] = useState<"operations" | "specs" | "documents" | "financials" | "profile">("operations");

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [statusRemarks, setStatusRemarks] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [savingSpecs, setSavingSpecs] = useState(false);

  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [schedulingSurvey, setSchedulingSurvey] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [showDocModal, setShowDocModal] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Activity Form state
  const [activityType, setActivityType] = useState("PHONE_CALL");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [activityVisibleToCust, setActivityVisibleToCust] = useState(true);

  // Technical Specs Form state
  const [specsForm, setSpecsForm] = useState({
    plantCapacityKw: "3.0",
    solarType: "ON_GRID",
    discom: "MPMKVVCL",
    consumerNumber: "",
    panelBrandModel: "Waaree 540W Mono PERC",
    panelQuantity: "6",
    inverterBrandModel: "Growatt 3.3kW On-Grid",
    inverterSerialNumber: "",
    warrantyStartDate: "",
    warrantyEndDate: "",
  });

  // Survey Schedule Form state
  const [surveyForm, setSurveyForm] = useState({
    scheduledDateTime: "",
    surveyEngineerId: "",
    roofType: "RCC Flat",
    availableRoofAreaSqFt: "350",
    notes: "",
  });

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

  // Upload Doc Form state
  const [docForm, setDocForm] = useState({
    documentCategory: "ELECTRICITY_BILL",
    documentName: "",
    fileLocation: "",
    customerCanView: true,
  });

  // Timeline filter
  const [timelineFilter, setTimelineFilter] = useState("ALL");

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

        if (!background) {
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

          if (data.activeProject) {
            setSpecsForm({
              plantCapacityKw: String(data.activeProject.plantCapacityKw || 3.0),
              solarType: data.activeProject.solarType || "ON_GRID",
              discom: data.activeProject.discom || "MPMKVVCL",
              consumerNumber: data.activeProject.consumerNumber || "",
              panelBrandModel: data.activeProject.panelBrandModel || "Waaree 540W Mono PERC",
              panelQuantity: String(data.activeProject.panelQuantity || 6),
              inverterBrandModel: data.activeProject.inverterBrandModel || "Growatt 3.3kW On-Grid",
              inverterSerialNumber: data.activeProject.inverterSerialNumber || "",
              warrantyStartDate: data.activeProject.warrantyStartDate ? data.activeProject.warrantyStartDate.split("T")[0] : "",
              warrantyEndDate: data.activeProject.warrantyEndDate ? data.activeProject.warrantyEndDate.split("T")[0] : "",
            });
          }
        }
      } else {
        showToast(data.error || "Failed to load client profile.");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error fetching client profile.");
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useLiveRefresh(() => fetchProfile(true), !loading);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Determine current active status & stage group
  const rawStatus = activeProject?.projectStatus || client?.customerStatus || "ENQUIRY";

  // Calculate current stage index (1 to 7)
  const getCurrentStageGroup = () => {
    for (const stage of OPERATIONAL_STAGES) {
      if (stage.id === rawStatus || stage.aliases?.includes(rawStatus)) {
        return stage.stageNumber;
      }
    }
    return 1;
  };

  const currentStageGroup = getCurrentStageGroup();

  // 1-Click Update Stage
  const handleUpdateStatus = async (statusToSet: string, remarks?: string) => {
    setUpdatingStatus(true);
    // Optimistic instant UI update
    if (activeProject) {
      setActiveProject({ ...activeProject, projectStatus: statusToSet });
    }
    setShowStatusModal(false);
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STAGE",
          stage: statusToSet,
          notes: remarks || statusRemarks,
          visibleToCustomer: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Operations stage updated to ${statusToSet.replace(/_/g, " ")}!`);
        setStatusRemarks("");
        fetchProfile(true);
      } else {
        showToast(data.error || "Failed to update stage.");
        fetchProfile(true);
      }
    } catch (err) {
      showToast("Network error updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Submit Technical Specs
  const handleSaveSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSpecs(true);
    setShowSpecsModal(false);
    // Optimistic UI update
    if (activeProject) {
      setActiveProject({
        ...activeProject,
        plantCapacityKw: parseFloat(specsForm.plantCapacityKw) || activeProject.plantCapacityKw,
        discom: specsForm.discom,
        consumerNumber: specsForm.consumerNumber,
        panelBrandModel: specsForm.panelBrandModel,
        panelQuantity: parseInt(specsForm.panelQuantity) || activeProject.panelQuantity,
        inverterBrandModel: specsForm.inverterBrandModel,
        inverterSerialNumber: specsForm.inverterSerialNumber,
      });
    }
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SPECS",
          ...specsForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Technical & DISCOM specifications saved!");
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

  // Submit Schedule Survey
  const handleScheduleSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedulingSurvey(true);
    try {
      const res = await fetch(`/api/v1/admin/client-profile/${client?.id || id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SCHEDULE_SURVEY",
          ...surveyForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Site Survey booked and operational stage updated!");
        setShowSurveyModal(false);
        fetchProfile(true);
      } else {
        showToast(data.error || "Failed to schedule survey.");
      }
    } catch (err) {
      showToast("Network error scheduling survey.");
    } finally {
      setSchedulingSurvey(false);
    }
  };

  // Submit Reassign Officer
  const handleAssignOfficer = async (salesId?: string, engId?: string) => {
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
        showToast("Operational officer successfully assigned!");
        fetchProfile(true);
      } else {
        showToast(data.error || "Failed to assign officer.");
      }
    } catch (err) {
      showToast("Network error assigning officer.");
    }
  };

  // Submit Quick Activity Note
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
        setShowActivityModal(false);
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
        showToast("Document attached to vault!");
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

  // Filter timeline
  const filteredTimeline = timeline
    .filter((item) => {
      // Filter out duplicate raw audit logs if clean stage change exists
      if (item.source === "AUDIT_LOG" && (item.title === "projectStatus" || item.title === "project Status")) {
        return false;
      }
      return true;
    })
    .filter((item) => {
      if (timelineFilter === "ALL") return true;
      if (timelineFilter === "STAGES") return item.type === "STAGE_CHANGE" || item.type === "MILESTONE" || item.source === "PROJECT_TIMELINE";
      if (timelineFilter === "CALLS") return item.type === "PHONE_CALL" || item.title.toLowerCase().includes("call");
      if (timelineFilter === "VISITS") return item.type === "SITE_VISIT" || item.title.toLowerCase().includes("visit");
      if (timelineFilter === "NOTES") return item.type === "NOTE" || item.type === "INTERNAL_NOTE";
      return true;
    });

  const isLead = client?.customerStatus === "LEAD" || (!client?.projects?.length && client?.leads?.length > 0);

  // Mandatory documents checklist
  const MANDATORY_DOCS = [
    { category: "ELECTRICITY_BILL", label: "Electricity Bill (Latest)", requiredFor: "DISCOM Sanction" },
    { category: "CUSTOMER_KYC", label: "Customer KYC (Aadhaar / PAN)", requiredFor: "Subsidy & DISCOM" },
    { category: "PURCHASE_AGREEMENT", label: "Property Tax / Roof Ownership Proof", requiredFor: "DISCOM Feasibility" },
    { category: "CANCELLED_CHEQUE", label: "Cancelled Cheque (Bank Account)", requiredFor: "PM Surya Ghar DBT Subsidy" },
    { category: "SITE_SURVEY_REPORT", label: "Site Survey Photos & Shadow Sketch", requiredFor: "Engineering & Design" },
    { category: "NET_METERING_DOCUMENT", label: "DISCOM Net Metering Application", requiredFor: "Meter Installation" },
  ];

  const getDocForCategory = (cat: string) => {
    return client?.documents?.find((d: any) => d.documentCategory === cat || d.documentCategory.includes(cat));
  };

  const verifiedDocsCount = MANDATORY_DOCS.filter((m) => getDocForCategory(m.category)).length;

  if (loading && !client) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-14 bg-white rounded-3xl border border-slate-200" />
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-50 rounded-2xl border border-slate-100" />
            ))}
          </div>
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

  // Next logical stage finder
  const nextStageObj = OPERATIONAL_STAGES.find((s) => s.stageNumber === currentStageGroup + 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOP BREADCRUMB & QUICK ACTION TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Link
            href={`/admin/client-profile/${id}`}
            className="inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-solar-deep transition-colors bg-emerald-50 text-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
            <span>← Customer Workspace</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 truncate max-w-[200px]">{client.fullName}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
            Full 360° Record
          </span>
        </div>

        {/* Direct Stage Changer & Action Hub */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Status Selector Dropdown */}
          <div className="relative flex items-center">
            <select
              value={rawStatus}
              onChange={(e) => {
                setTargetStatus(e.target.value);
                setShowStatusModal(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer appearance-none pr-8 shadow-xs"
              title="Change Current Operational Status"
            >
              {ALL_PROJECT_STATUSES.map((st) => (
                <option key={st.id} value={st.id}>
                  Stage {st.stageGroup}: {st.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-emerald-700 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Quick "Advance to Next Stage" Button */}
          {nextStageObj && (
            <button
              onClick={() => {
                setTargetStatus(nextStageObj.id);
                setShowStatusModal(true);
              }}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl text-xs font-bold hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span>Advance Stage</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}

          <button
            onClick={() => fetchProfile()}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh profile"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CLIENT HERO & FAST COMMUNICATION BAR
      ───────────────────────────────────────────────────────────── */}
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
                <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{rawStatus.replace(/_/g, " ")}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  Stage {currentStageGroup} of 7
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {client.customerId}
                </span>
                {activeProject?.projectId && (
                  <span className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                    Project: {activeProject.projectId}
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

            <button
              type="button"
              onClick={() => setShowWhatsAppDrawer(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Open WhatsApp Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setShowActivityModal(true)}
              className="px-3.5 py-2 bg-solar-deep text-white rounded-xl text-xs font-bold hover:bg-solar-deep/90 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-sun-amber" />
              <span>Log Note</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. INTERACTIVE 7-STAGE SOLAR OPERATIONS STEPPER
        ───────────────────────────────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Operational Stage Progression (Click any stage to change status)</span>
            </div>
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              Current: Stage {currentStageGroup} — {OPERATIONAL_STAGES[currentStageGroup - 1]?.shortLabel}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {OPERATIONAL_STAGES.map((stage) => {
              const isPast = stage.stageNumber < currentStageGroup;
              const isCurrent = stage.stageNumber === currentStageGroup;
              const isFuture = stage.stageNumber > currentStageGroup;

              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    setTargetStatus(stage.id);
                    setShowStatusModal(true);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden group cursor-pointer ${
                    isCurrent
                      ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                      : isPast
                      ? "bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-slate-100/80"
                      : "bg-white border-slate-150 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isCurrent
                          ? "bg-emerald-600 text-white"
                          : isPast
                          ? "bg-slate-200 text-slate-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      Step {stage.stageNumber}
                    </span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>

                  <div
                    className={`font-bold text-xs truncate ${
                      isCurrent ? "text-emerald-950 font-extrabold" : isPast ? "text-slate-800" : "text-slate-500"
                    }`}
                  >
                    {stage.shortLabel}
                  </div>

                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {stage.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. OPERATIONS KPI STRIP
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
          {/* Current Stage & Action */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Operations Stage</span>
            </div>
            <div className="font-extrabold text-slate-900 text-sm truncate">
              {rawStatus.replace(/_/g, " ")}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium">
              {nextStageObj ? `Next: ${nextStageObj.shortLabel}` : "Completed"}
            </div>
          </div>

          {/* Technical Specs Summary */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Solar System Capacity</span>
            </div>
            <div className="font-extrabold text-solar-deep text-sm">
              {activeProject ? `${activeProject.plantCapacityKw} kW Rooftop` : "3.0 kW Inquiry"}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {activeProject?.discom || "MPMKVVCL"} • {activeProject?.consumerNumber ? `ID: ${activeProject.consumerNumber}` : "No Consumer #"}
            </div>
          </div>

          {/* Document & Compliance Readiness */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Compliance & KYC</span>
            </div>
            <div className="font-extrabold text-slate-900 text-sm">
              {verifiedDocsCount} of {MANDATORY_DOCS.length} Documents
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${(verifiedDocsCount / MANDATORY_DOCS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Financial & Subsidy Snapshot */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-purple-600" />
              <span>PM Surya Ghar Subsidy</span>
            </div>
            <div className="font-extrabold text-slate-900 text-sm">
              ₹78,000 Eligible
            </div>
            <div className="text-[10px] text-purple-700 font-medium">
              National Portal Subsidy
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. OPERATIONS WORKSPACE TABS NAVIGATION
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "operations", label: "Operations & Milestones", icon: Layers },
          { id: "specs", label: "Technical & DISCOM Specs", icon: Zap },
          { id: "documents", label: "Document & KYC Checklist", icon: FileText, count: client.documents?.length },
          { id: "financials", label: "Quotations & Financials", icon: CreditCard },
          { id: "profile", label: "Client Information & App Access", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-solar-deep text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] ${
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

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: OPERATIONS & MILESTONES (DEFAULT VIEW)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "operations" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Contextual Stage Action Center & Field Crew (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Active Stage Action Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Active Stage Action Center</h3>
                    <p className="text-[11px] text-slate-400">Current Task: {rawStatus.replace(/_/g, " ")}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                  Action Required
                </span>
              </div>

              {/* Contextual Action Buttons depending on Stage */}
              <div className="space-y-2.5">
                {currentStageGroup === 1 && (
                  <>
                    <button
                      onClick={() => setShowSurveyModal(true)}
                      className="w-full p-3 bg-solar-deep text-white rounded-2xl text-xs font-bold hover:bg-solar-deep/90 flex items-center justify-between shadow-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sun-amber" />
                        <span>Schedule Site Survey</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setTargetStatus("QUOTATION_PENDING");
                        setShowStatusModal(true);
                      }}
                      className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Prepare Solar Quotation</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {currentStageGroup === 2 && (
                  <>
                    <button
                      onClick={() => setShowSurveyModal(true)}
                      className="w-full p-3 bg-solar-deep text-white rounded-2xl text-xs font-bold hover:bg-solar-deep/90 flex items-center justify-between shadow-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sun-amber" />
                        <span>Update Survey Schedule / Reassign</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setTargetStatus("SURVEY_COMPLETED");
                        setShowStatusModal(true);
                      }}
                      className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Mark Survey as Completed</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {currentStageGroup === 3 && (
                  <>
                    <button
                      onClick={() => {
                        setTargetStatus("ORDER_CONFIRMED");
                        setShowStatusModal(true);
                      }}
                      className="w-full p-3 bg-solar-deep text-white rounded-2xl text-xs font-bold hover:bg-solar-deep/90 flex items-center justify-between shadow-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-sun-amber" />
                        <span>Confirm Order & Advance Payment</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setShowDocModal(true)}
                      className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-blue-600" />
                        <span>Upload Signed Proposal / Agreement</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {currentStageGroup >= 4 && (
                  <>
                    <button
                      onClick={() => setShowSpecsModal(true)}
                      className="w-full p-3 bg-solar-deep text-white rounded-2xl text-xs font-bold hover:bg-solar-deep/90 flex items-center justify-between shadow-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-sun-amber" />
                        <span>Edit DISCOM & Hardware Specs</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setTargetStatus(nextStageObj ? nextStageObj.id : "ACTIVE");
                        setShowStatusModal(true);
                      }}
                      className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-emerald-600" />
                        <span>Progress to Next Stage</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Assigned Officers & Field Crew */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Assigned Field Crew</h3>
                    <p className="text-[11px] text-slate-400">Responsible personnel for execution</p>
                  </div>
                </div>
              </div>

              {/* Sales Executive Assignment */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Sales Executive / Lead Owner</span>
                  <span className="text-[10px] text-slate-400">Primary Contact</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={client.assignedSalesExecutiveId || activeProject?.assignedSalesExecutiveId || ""}
                    onChange={(e) => handleAssignOfficer(e.target.value, activeProject?.assignedEngineerId)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="">-- Assign Sales Executive --</option>
                    {teamMembers.map((tm) => (
                      <option key={tm.id} value={tm.id}>
                        {tm.name} ({tm.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Project Engineer / Field Crew Assignment */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Project / Site Engineer</span>
                  <span className="text-[10px] text-slate-400">Technical Lead</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={activeProject?.assignedEngineerId || ""}
                    onChange={(e) => handleAssignOfficer(client.assignedSalesExecutiveId, e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
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
          </div>

          {/* RIGHT: Operational Timeline & Activity Audit (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Operations & Milestone History</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {filteredTimeline.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Audit log of stage transitions, site inspections, and staff notes.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "STAGES", label: "Stages" },
                    { id: "CALLS", label: "Calls" },
                    { id: "VISITS", label: "Visits" },
                    { id: "NOTES", label: "Notes" },
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
                <div className="max-h-[520px] overflow-y-auto pr-3 -mr-1 space-y-4">
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {filteredTimeline.map((item, idx) => {
                      const isStage = item.type === "STAGE_CHANGE" || item.type === "MILESTONE" || item.source === "PROJECT_TIMELINE";
                      const isCall = item.type === "PHONE_CALL" || item.title.toLowerCase().includes("call");
                      const isVisit = item.type === "SITE_VISIT" || item.title.toLowerCase().includes("visit");

                      let IconComponent = FileText;
                      let iconBg = "bg-slate-100 text-slate-700";
                      if (isStage) {
                        IconComponent = Zap;
                        iconBg = "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300";
                      } else if (isCall) {
                        IconComponent = Phone;
                        iconBg = "bg-blue-100 text-blue-700";
                      } else if (isVisit) {
                        IconComponent = MapPin;
                        iconBg = "bg-purple-100 text-purple-700";
                      }

                      return (
                        <div key={item.id || idx} className="relative group">
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
                              <span className="font-medium">Actor: {item.actor || "Operations"}</span>
                              {item.visibleToCustomer ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" />
                                  <span>Visible in App</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  <span>Internal CRM</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: TECHNICAL & DISCOM SPECS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "specs" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Technical & DISCOM Grid Parameters</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Solar plant engineering parameters, DISCOM consumer ID, and equipment serial numbers.
                </p>
              </div>

              <button
                onClick={() => setShowSpecsModal(true)}
                className="px-4 py-2 bg-solar-deep text-white text-xs font-bold rounded-xl hover:bg-solar-deep/90 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-sun-amber" />
                <span>Edit Specs</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              {/* Card 1: Electrical & DISCOM */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span>DISCOM & Grid Connection</span>
                </div>
                <div className="space-y-2 divide-y divide-slate-200/60 pt-1">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">DISCOM Name:</span>
                    <span className="font-bold text-slate-900">{activeProject?.discom || "MPMKVVCL"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Consumer Number:</span>
                    <span className="font-mono font-bold text-purple-700">
                      {activeProject?.consumerNumber || "Pending Entry"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">System Capacity:</span>
                    <span className="font-bold text-solar-deep">
                      {activeProject?.plantCapacityKw || 3.0} kW
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Connection Type:</span>
                    <span className="font-semibold text-slate-800">
                      {activeProject?.solarType || "ON_GRID"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Solar PV Modules */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Solar PV Modules (Panels)</span>
                </div>
                <div className="space-y-2 divide-y divide-slate-200/60 pt-1">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Brand & Model:</span>
                    <span className="font-bold text-slate-900">
                      {activeProject?.panelBrandModel || "Waaree 540W Mono PERC"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Module Quantity:</span>
                    <span className="font-bold text-slate-900">
                      {activeProject?.panelQuantity || 6} Panels
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Warranty Term:</span>
                    <span className="font-semibold text-emerald-700">25 Years Performance</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Solar Inverter */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Solar Inverter (PCU)</span>
                </div>
                <div className="space-y-2 divide-y divide-slate-200/60 pt-1">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Brand & Rating:</span>
                    <span className="font-bold text-slate-900">
                      {activeProject?.inverterBrandModel || "Growatt 3.3kW On-Grid"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Serial Number:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {activeProject?.inverterSerialNumber || "Not yet recorded"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Inverter Warranty:</span>
                    <span className="font-semibold text-emerald-700">5-10 Years Manufacturer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: DOCUMENT & COMPLIANCE CHECKLIST
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <span>Mandatory Compliance & Document Checklist</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Required documents for DISCOM Net Metering sanction and PM Surya Ghar subsidy disbursement.
                </p>
              </div>

              <button
                onClick={() => setShowDocModal(true)}
                className="px-4 py-2 bg-solar-deep text-white text-xs font-bold rounded-xl hover:bg-solar-deep/90 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-sun-amber" />
                <span>Upload Document</span>
              </button>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MANDATORY_DOCS.map((reqDoc, idx) => {
                const uploadedDoc = getDocForCategory(reqDoc.category);
                const isVerified = Boolean(uploadedDoc);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                      isVerified
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isVerified ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {isVerified ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>

                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{reqDoc.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Purpose: {reqDoc.requiredFor}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isVerified ? (
                        <>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                          <a
                            href={uploadedDoc.fileLocation}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-solar-deep transition-colors"
                            title="View Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setDocForm({
                              ...docForm,
                              documentCategory: reqDoc.category,
                              documentName: reqDoc.label,
                            });
                            setShowDocModal(true);
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          + Upload
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: QUOTATIONS & FINANCIALS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "financials" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span>Commercial & Subsidy Financial Overview</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Project cost breakdown, PM Surya Ghar subsidy calculation, and payment milestone tracking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[11px]">Gross Project Cost</span>
                <div className="text-xl font-extrabold text-slate-900">₹1,80,000</div>
                <div className="text-[10px] text-slate-500">Based on 3.0 kW installation</div>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-emerald-800 text-[11px]">PM Surya Ghar Subsidy</span>
                <div className="text-xl font-extrabold text-emerald-700">₹78,000</div>
                <div className="text-[10px] text-emerald-800">Direct DBT to client account</div>
              </div>

              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-1">
                <span className="text-purple-800 text-[11px]">Net Client Payable</span>
                <div className="text-xl font-extrabold text-purple-900">₹1,02,000</div>
                <div className="text-[10px] text-purple-800">Effective solar investment</div>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-1">
                <span className="text-blue-800 text-[11px]">Payment Received</span>
                <div className="text-xl font-extrabold text-blue-900">₹40,000</div>
                <div className="text-[10px] text-blue-800">Advance booking cleared</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: CLIENT PROFILE & APP ACCESS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Customer Credentials & Contact Information</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Registered customer contact details, address records, and mobile app OTP login access.
                </p>
              </div>

              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-solar-deep text-white text-xs font-bold rounded-xl hover:bg-solar-deep/90 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-sun-amber" />
                <span>Edit Client</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="space-y-3">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Full Legal Name:</span>
                  <span className="font-bold text-slate-900">{client.fullName}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Primary Mobile (App):</span>
                  <span className="font-mono font-bold text-slate-900">+91 {client.primaryMobile}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Alternate Phone:</span>
                  <span className="font-mono text-slate-700">{client.alternateMobile || "—"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="font-medium text-slate-800">{client.email || "—"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Preferred Language:</span>
                  <span className="font-semibold text-slate-900 uppercase">
                    {client.preferredLanguage === "hi" ? "Hindi (हिंदी)" : "English"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 md:pl-6 pt-3 md:pt-0">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Installation Address:</span>
                  <span className="font-medium text-slate-900 text-right max-w-xs">{client.installationAddress}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Property Category:</span>
                  <span className="font-semibold text-slate-900">
                    {client.propertyType === "COMMERCIAL" ? "Commercial / Industrial" : "Residential Rooftop"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 items-center">
                  <span className="text-slate-400">App Login / OTP:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      client.appAccessEnabled ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {client.appAccessEnabled ? "Authorized (Active)" : "Suspended"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: STAGE TRANSITION CONFIRMATION
      ───────────────────────────────────────────────────────────── */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Confirm Operational Stage Update</span>
                </h3>
                <p className="text-xs text-slate-500">Updates live timeline & customer mobile app</p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-slate-400 text-[10px]">New Stage:</div>
                <div className="font-extrabold text-emerald-900 text-sm mt-0.5">
                  {targetStatus.replace(/_/g, " ")}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Milestone Remarks / Notes (Customer & CRM Visible)
                </label>
                <textarea
                  rows={3}
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="e.g. Conducted rooftop survey; 3.0 kW system recommended. Consumer load verified."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(targetStatus)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-800 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {updatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: EDIT TECHNICAL & DISCOM SPECS
      ───────────────────────────────────────────────────────────── */}
      {showSpecsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Technical & DISCOM Specs</h3>
                <p className="text-xs text-slate-500">System capacity, DISCOM consumer ID & hardware</p>
              </div>
              <button
                onClick={() => setShowSpecsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSpecs} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plant Capacity (kW) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={specsForm.plantCapacityKw}
                    onChange={(e) => setSpecsForm({ ...specsForm, plantCapacityKw: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">System Type</label>
                  <select
                    value={specsForm.solarType}
                    onChange={(e) => setSpecsForm({ ...specsForm, solarType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="ON_GRID">On-Grid (Net Metered)</option>
                    <option value="HYBRID">Hybrid (Battery Backup)</option>
                    <option value="OFF_GRID">Off-Grid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">DISCOM Name</label>
                  <input
                    type="text"
                    value={specsForm.discom}
                    onChange={(e) => setSpecsForm({ ...specsForm, discom: e.target.value })}
                    placeholder="MPMKVVCL"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Consumer Number</label>
                  <input
                    type="text"
                    value={specsForm.consumerNumber}
                    onChange={(e) => setSpecsForm({ ...specsForm, consumerNumber: e.target.value })}
                    placeholder="e.g. 100293847"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Panel Brand / Model</label>
                  <input
                    type="text"
                    value={specsForm.panelBrandModel}
                    onChange={(e) => setSpecsForm({ ...specsForm, panelBrandModel: e.target.value })}
                    placeholder="Waaree 540W Mono PERC"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Panel Quantity</label>
                  <input
                    type="number"
                    value={specsForm.panelQuantity}
                    onChange={(e) => setSpecsForm({ ...specsForm, panelQuantity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Inverter Brand / Model</label>
                  <input
                    type="text"
                    value={specsForm.inverterBrandModel}
                    onChange={(e) => setSpecsForm({ ...specsForm, inverterBrandModel: e.target.value })}
                    placeholder="Growatt 3.3kW On-Grid"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Inverter Serial Number</label>
                  <input
                    type="text"
                    value={specsForm.inverterSerialNumber}
                    onChange={(e) => setSpecsForm({ ...specsForm, inverterSerialNumber: e.target.value })}
                    placeholder="GRW2026-98234"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSpecsModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSpecs}
                  className="px-5 py-2 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 shadow-xs flex items-center gap-1.5"
                >
                  {savingSpecs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Specifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: SCHEDULE SITE SURVEY
      ───────────────────────────────────────────────────────────── */}
      {showSurveyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Book Site Survey Visit</span>
                </h3>
                <p className="text-xs text-slate-500">Assigns engineer and sets target date</p>
              </div>
              <button
                onClick={() => setShowSurveyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSurvey} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={surveyForm.scheduledDateTime}
                  onChange={(e) => setSurveyForm({ ...surveyForm, scheduledDateTime: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assign Survey Engineer</label>
                <select
                  value={surveyForm.surveyEngineerId}
                  onChange={(e) => setSurveyForm({ ...surveyForm, surveyEngineerId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- Select Engineer --</option>
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} ({tm.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Roof Type</label>
                  <select
                    value={surveyForm.roofType}
                    onChange={(e) => setSurveyForm({ ...surveyForm, roofType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="RCC Flat">RCC Flat Roof</option>
                    <option value="Tin Shed">Tin / Metal Shed</option>
                    <option value="Elevated">Elevated Structure</option>
                    <option value="Tile">Tiled Roof</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Est. Area (sq ft)</label>
                  <input
                    type="number"
                    value={surveyForm.availableRoofAreaSqFt}
                    onChange={(e) => setSurveyForm({ ...surveyForm, availableRoofAreaSqFt: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Special Instructions</label>
                <textarea
                  rows={2}
                  value={surveyForm.notes}
                  onChange={(e) => setSurveyForm({ ...surveyForm, notes: e.target.value })}
                  placeholder="e.g. Call 30 mins before arrival. Client requested shadow measurement near water tank."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSurveyModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingSurvey}
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {schedulingSurvey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                  <span>Book Survey</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: LOG CLIENT NOTE / ACTIVITY
      ───────────────────────────────────────────────────────────── */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Log Field Activity or Note</h3>
                <p className="text-xs text-slate-500">Record calls, site visits, or internal notes</p>
              </div>
              <button
                onClick={() => setShowActivityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { type: "PHONE_CALL", label: "📞 Phone Call" },
                  { type: "SITE_VISIT", label: "📍 Site Visit" },
                  { type: "MEETING", label: "🤝 Meeting" },
                  { type: "NOTE", label: "📝 Note" },
                ].map((pill) => (
                  <button
                    key={pill.type}
                    type="button"
                    onClick={() => setActivityType(pill.type)}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
                      activityType === pill.type
                        ? "bg-solar-deep text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder="e.g. Discussed DISCOM load sanction timeline"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Details / Commitments *</label>
                <textarea
                  required
                  rows={3}
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  placeholder="Enter specific client requests, next actions, or commitments..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={activityVisibleToCust}
                    onChange={(e) => setActivityVisibleToCust(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-[11px]">Visible to client in app</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowActivityModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingActivity}
                    className="px-5 py-2 bg-solar-deep text-white font-bold rounded-xl hover:bg-solar-deep/90 shadow-xs flex items-center gap-1.5"
                  >
                    {submittingActivity ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Save Note</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: ATTACH DOCUMENT
      ───────────────────────────────────────────────────────────── */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Attach Document to Vault</h3>
                <p className="text-xs text-slate-500">Uploads are permanently linked to client & project</p>
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ELECTRICITY_BILL">Electricity Bill</option>
                  <option value="CUSTOMER_KYC">Customer KYC (Aadhaar / PAN)</option>
                  <option value="QUOTATION">Solar Quotation / Proposal</option>
                  <option value="PURCHASE_AGREEMENT">Solar Purchase Agreement</option>
                  <option value="SITE_SURVEY_REPORT">Site Survey & Shadow Analysis</option>
                  <option value="CANCELLED_CHEQUE">Cancelled Cheque (Subsidy DBT)</option>
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL 6: EDIT CLIENT INFORMATION
      ───────────────────────────────────────────────────────────── */}
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Primary Mobile (OTP) *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.primaryMobile}
                    onChange={(e) => setEditForm({ ...editForm, primaryMobile: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    value={editForm.alternateMobile}
                    onChange={(e) => setEditForm({ ...editForm, alternateMobile: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Installation Address *</label>
                <textarea
                  required
                  rows={2}
                  value={editForm.installationAddress}
                  onChange={(e) => setEditForm({ ...editForm, installationAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer Status</label>
                  <select
                    value={editForm.customerStatus}
                    onChange={(e) => setEditForm({ ...editForm, customerStatus: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="LEAD">LEAD (Inquiry Stage)</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer App Access</label>
                  <select
                    value={editForm.appAccessEnabled ? "true" : "false"}
                    onChange={(e) => setEditForm({ ...editForm, appAccessEnabled: e.target.value === "true" })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
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
