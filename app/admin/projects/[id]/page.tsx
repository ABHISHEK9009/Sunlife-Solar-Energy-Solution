"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Zap,
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Award,
  Plus,
  X,
  Lock,
  Eye,
  Shield,
  Activity,
  Cpu,
} from "lucide-react";

const STAGES = [
  "ENQUIRY",
  "SURVEY_SCHEDULED",
  "SURVEY_COMPLETED",
  "DESIGN_PREPARED",
  "QUOTATION_PENDING",
  "QUOTATION_APPROVED",
  "ORDER_CONFIRMED",
  "DOCUMENTS_PENDING",
  "DOCUMENTS_SUBMITTED",
  "MATERIAL_PENDING",
  "MATERIAL_DISPATCHED",
  "INSTALLATION_SCHEDULED",
  "INSTALLATION_IN_PROGRESS",
  "INSTALLATION_COMPLETED",
  "NET_METERING_PENDING",
  "NET_METER_INSTALLED",
  "SUBSIDY_PROCESSING",
  "ACTIVE",
];

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline");

  // Modal states
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showHardwareModal, setShowHardwareModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Timeline Event State
  const [eventForm, setEventForm] = useState({
    eventType: "MILESTONE_UPDATE",
    eventTitle: "",
    customerDescription: "",
    internalDescription: "",
    visibleToCustomer: true,
  });

  // Hardware Specs State
  const [hardwareForm, setHardwareForm] = useState({
    panelBrandModel: "",
    panelQuantity: "",
    inverterBrandModel: "",
    inverterSerialNumber: "",
    warrantyStartDate: "",
    warrantyEndDate: "",
    discom: "MPMKVVCL",
    consumerNumber: "",
  });

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/projects/${id}`);
      const data = await res.json();
      if (data.success) {
        setProject(data.project);
        setHardwareForm({
          panelBrandModel: data.project.panelBrandModel || "",
          panelQuantity: data.project.panelQuantity ? String(data.project.panelQuantity) : "",
          inverterBrandModel: data.project.inverterBrandModel || "",
          inverterSerialNumber: data.project.inverterSerialNumber || "",
          warrantyStartDate: data.project.warrantyStartDate ? data.project.warrantyStartDate.split("T")[0] : "",
          warrantyEndDate: data.project.warrantyEndDate ? data.project.warrantyEndDate.split("T")[0] : "",
          discom: data.project.discom || "MPMKVVCL",
          consumerNumber: data.project.consumerNumber || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/projects/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowTimelineModal(false);
        setEventForm({
          eventType: "MILESTONE_UPDATE",
          eventTitle: "",
          customerDescription: "",
          internalDescription: "",
          visibleToCustomer: true,
        });
        fetchProject();
      } else {
        alert(data.error || "Failed to add timeline event.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hardwareForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowHardwareModal(false);
        fetchProject();
      } else {
        alert(data.error || "Failed to update equipment specs.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
        Loading Project Command Center...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-slate-700 border border-slate-200 space-y-3">
        <div className="text-lg font-bold">Solar Project Not Found</div>
        <Link href="/admin/projects" className="text-xs text-solar-deep font-bold hover:underline">
          ← Return to Solar Projects
        </Link>
      </div>
    );
  }

  const currentStageIndex = STAGES.indexOf(project.projectStatus);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-solar-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Projects</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimelineModal(true)}
            className="px-3.5 py-1.5 bg-solar-deep text-white text-xs font-bold rounded-xl hover:bg-solar-deep/90 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Timeline Event</span>
          </button>

          <button
            onClick={() => setShowHardwareModal(true)}
            className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Hardware Specs</span>
          </button>
        </div>
      </div>

      {/* Project Command Center Hero Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-slate-900">{project.projectName}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                {project.projectStatus.replace(/_/g, " ")}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-700">{project.projectId}</span>
              <span>•</span>
              <Link
                href={`/admin/customers/${project.customerId}`}
                className="text-solar-deep font-semibold hover:underline"
              >
                Client: {project.customer?.fullName} ({project.customer?.primaryMobile})
              </Link>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-extrabold font-heading text-solar-deep">
              {project.plantCapacityKw} kW
            </div>
            <div className="text-xs text-slate-500 font-medium">{project.solarType} Solar System</div>
          </div>
        </div>

        {/* 20-Stage Interactive Visual Stepper */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Milestone Workflow Progression</span>
            <span>Stage {currentStageIndex !== -1 ? currentStageIndex + 1 : 1} of {STAGES.length}</span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
            <div
              className="bg-solar-deep transition-all duration-500 h-full rounded-full"
              style={{
                width: `${Math.max(5, ((currentStageIndex + 1) / STAGES.length) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 text-[10px] text-slate-400">
            {STAGES.slice(0, 8).map((st, idx) => (
              <span
                key={st}
                className={`whitespace-nowrap px-2 py-0.5 rounded-md ${
                  idx <= currentStageIndex
                    ? "bg-emerald-50 text-solar-deep font-bold border border-emerald-200"
                    : "bg-slate-50 text-slate-400"
                }`}
              >
                {st.replace(/_/g, " ")}
              </span>
            ))}
            <span>+ 10 more milestones</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "timeline", label: `Timeline Feed (${project.timeline?.length || 0})` },
          { id: "hardware", label: "Equipment & Hardware" },
          { id: "quotations", label: `Quotations (${project.quotations?.length || 0})` },
          { id: "payments", label: `Payments & Ledger (${project.payments?.length || 0})` },
          { id: "subsidy", label: "PM Surya Ghar Subsidy" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "bg-solar-deep text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Timeline Feed */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-900 text-sm">Audited Timeline Events</h3>
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
            {project.timeline?.map((evt: any) => (
              <div key={evt.id} className="relative pl-6">
                <span className="absolute -left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-solar-deep border-2 border-white shadow-xs" />
                <div className="flex items-center gap-2">
                  <div className="font-bold text-slate-900 text-xs">{evt.eventTitle}</div>
                  {evt.visibleToCustomer ? (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5" />
                      <span>Visible in App</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Confidential Internal</span>
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {new Date(evt.eventDateTime).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 mt-1">{evt.customerDescription}</p>
                {evt.internalDescription && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 font-mono">
                    <span className="font-bold text-slate-700">Internal Log: </span>
                    {evt.internalDescription}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Hardware Specs */}
      {activeTab === "hardware" && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Installed Equipment & Warranties</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 text-[11px]">Solar Panel Model</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {project.panelBrandModel || "Mono PERC Half-Cut 550W"}
              </div>
              <div className="text-slate-500 mt-1">Quantity: {project.panelQuantity || 10} modules</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 text-[11px]">Inverter Model & Serial</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {project.inverterBrandModel || "Growatt On-Grid 5kW"}
              </div>
              <div className="text-slate-500 font-mono mt-1">
                SN: {project.inverterSerialNumber || "GROW-2026-99214"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 text-[11px]">DISCOM Details</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {project.discom || "MPMKVVCL"}
              </div>
              <div className="text-slate-500 mt-1">Consumer #: {project.consumerNumber || "MP-NMD-84920"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Quotations */}
      {activeTab === "quotations" && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Quotation ID</th>
                <th className="px-5 py-3.5">Gross Cost</th>
                <th className="px-5 py-3.5">Expected Subsidy</th>
                <th className="px-5 py-3.5">Customer Net Cost</th>
                <th className="px-5 py-3.5">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {project.quotations?.map((q: any) => (
                <tr key={q.id}>
                  <td className="px-5 py-4 font-mono font-bold">{q.quotationId} (V{q.versionNumber})</td>
                  <td className="px-5 py-4">₹{q.grossProjectCost.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 text-emerald-600 font-medium">₹{q.expectedSubsidy.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 font-bold text-solar-deep text-sm">₹{q.customerNetCost.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {q.approvalStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Payments */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Payment ID</th>
                <th className="px-5 py-3.5">Stage</th>
                <th className="px-5 py-3.5">Amount Due</th>
                <th className="px-5 py-3.5">Amount Paid</th>
                <th className="px-5 py-3.5">Remaining Balance</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {project.payments?.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-5 py-4 font-mono font-bold">{p.paymentId}</td>
                  <td className="px-5 py-4 font-semibold">{p.paymentStage}</td>
                  <td className="px-5 py-4">₹{p.amountDue.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 text-emerald-600 font-semibold">₹{p.amountPaid.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 font-bold">₹{p.balanceRemaining.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {p.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Subsidy */}
      {activeTab === "subsidy" && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">PM Surya Ghar Subsidy Tracker</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400">Current Progress Stage</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {project.subsidy?.currentStatus?.replace(/_/g, " ") || "NOT STARTED"}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400">National Portal Reg #</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {project.subsidy?.portalRegistrationNumber || "Pending"}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400">Expected Direct Benefit Transfer</div>
              <div className="font-bold text-emerald-600 text-sm mt-0.5">
                ₹{(project.subsidy?.expectedSubsidy || 78000).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Add Timeline Event */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Add Project Timeline Milestone</h3>
              <button
                onClick={() => setShowTimelineModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTimeline} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.eventTitle}
                  onChange={(e) => setEventForm({ ...eventForm, eventTitle: e.target.value })}
                  placeholder="e.g. Net Metering Inspection Scheduled"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Customer Description (Visible in Mobile App) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={eventForm.customerDescription}
                  onChange={(e) => setEventForm({ ...eventForm, customerDescription: e.target.value })}
                  placeholder="e.g. DISCOM inspectors will visit site on Thursday morning for final bi-directional meter testing."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Internal Description (Operations Notes Only)
                </label>
                <input
                  type="text"
                  value={eventForm.internalDescription}
                  onChange={(e) => setEventForm({ ...eventForm, internalDescription: e.target.value })}
                  placeholder="e.g. Test fee receipt #8829 cleared with divisional engineer"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="visCust"
                  checked={eventForm.visibleToCustomer}
                  onChange={(e) => setEventForm({ ...eventForm, visibleToCustomer: e.target.checked })}
                  className="rounded text-solar-deep"
                />
                <label htmlFor="visCust" className="font-semibold text-slate-700 cursor-pointer">
                  Make event visible in Customer Mobile App & dispatch notification
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTimelineModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 shadow-xs"
                >
                  {submitting ? "Saving..." : "Publish Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Hardware Specs */}
      {showHardwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Update Equipment Hardware Specs</h3>
              <button
                onClick={() => setShowHardwareModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHardware} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Panel Brand/Model</label>
                  <input
                    type="text"
                    value={hardwareForm.panelBrandModel}
                    onChange={(e) => setHardwareForm({ ...hardwareForm, panelBrandModel: e.target.value })}
                    placeholder="e.g. Waaree 550W Mono PERC"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Panel Quantity</label>
                  <input
                    type="number"
                    value={hardwareForm.panelQuantity}
                    onChange={(e) => setHardwareForm({ ...hardwareForm, panelQuantity: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Inverter Brand/Model</label>
                  <input
                    type="text"
                    value={hardwareForm.inverterBrandModel}
                    onChange={(e) => setHardwareForm({ ...hardwareForm, inverterBrandModel: e.target.value })}
                    placeholder="e.g. Growatt MIC 5000TL-X"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Inverter Serial Number</label>
                  <input
                    type="text"
                    value={hardwareForm.inverterSerialNumber}
                    onChange={(e) => setHardwareForm({ ...hardwareForm, inverterSerialNumber: e.target.value })}
                    placeholder="e.g. GRW-99214-X"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Warranty Start Date</label>
                  <input
                    type="date"
                    value={hardwareForm.warrantyStartDate}
                    onChange={(e) => setHardwareForm({ ...hardwareForm, warrantyStartDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Warranty End Date</label>
                  <input
                    type="date"
                    value={hardwareForm.warrantyEndDate}
                    onChange={(e) => setHardwareForm({ ...hardwareForm, warrantyEndDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHardwareModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 shadow-xs"
                >
                  {submitting ? "Saving..." : "Save Equipment Specs"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
