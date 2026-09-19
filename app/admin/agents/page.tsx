"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCog,
  Search,
  RefreshCw,
  Plus,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  KeyRound,
  Copy,
  Check,
  Share2,
  Edit2,
  Trash2,
  X,
  Users,
  ShieldCheck,
  Building,
  Briefcase,
  Smartphone,
  Mail,
  MoreVertical,
  Eye,
} from "lucide-react";

interface Agent {
  id: string;
  employeeId: string | null;
  name: string;
  role: string;
  category: string;
  phone: string;
  territory: string;
  department: string | null;
  status: string;
  activeStatus: boolean;
  employeeAccessEnabled: boolean;
  email?: string | null;
  joinedYear?: string | null;
  pin?: string | null;
  _count?: {
    assignedCustomers: number;
    surveys: number;
  };
}

const BLANK_REGISTER_FORM = {
  name: "",
  phone: "",
  email: "",
  employeeId: "",
  role: "",
  category: "Field Team",
  territory: "",
  department: "Operations",
  initialPin: "",
};

function AgentActionMenu({
  agent,
  onViewProfile,
  onEdit,
  onCredentials,
  onToggleAccess,
  onToggleActive,
}: {
  agent: Agent;
  onViewProfile: () => void;
  onEdit: () => void;
  onCredentials: () => void;
  onToggleAccess: () => void;
  onToggleActive: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number; openUpward: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuEstimatedHeight = 240;
    const openUpward =
      rect.bottom + menuEstimatedHeight > window.innerHeight &&
      rect.top > menuEstimatedHeight;

    setCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
      openUpward,
    });
  };

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  const toggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      setIsOpen(false);
    };
    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative inline-flex items-center justify-end"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleClick}
        title="More options"
        aria-label={`Actions for ${agent.name}`}
        aria-expanded={isOpen}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
          isOpen
            ? "bg-slate-100 text-slate-900 border-slate-300 shadow-xs"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200 hover:border-slate-300 shadow-2xs"
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            onMouseEnter={() => {
              if (leaveTimerRef.current) {
                clearTimeout(leaveTimerRef.current);
                leaveTimerRef.current = null;
              }
            }}
            onMouseLeave={handleMouseLeave}
            style={{
              position: "fixed",
              top: coords.openUpward ? "auto" : `${coords.top}px`,
              bottom: coords.openUpward
                ? `${window.innerHeight - coords.top}px`
                : "auto",
              right: `${coords.right}px`,
              zIndex: 9999,
            }}
            className="w-52 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
              <div className="font-semibold text-[11px] text-slate-900 truncate">
                {agent.name}
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                {agent.employeeId || "Agent Actions"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onViewProfile();
              }}
              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer rounded-lg"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-medium">View Full Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer rounded-lg"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-medium">Edit Details</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onCredentials();
              }}
              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer rounded-lg"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-medium">Login PIN & Credentials</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onToggleAccess();
              }}
              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer rounded-lg"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-medium">
                {agent.employeeAccessEnabled
                  ? "Revoke Mobile Access"
                  : "Authorize Mobile Access"}
              </span>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onToggleActive();
              }}
              className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer rounded-lg ${
                agent.activeStatus
                  ? "text-red-600 hover:bg-red-50"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {agent.activeStatus ? (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="font-medium">Deactivate Agent</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium">Activate Agent</span>
                </>
              )}
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

export default function AdminAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [createdAgentCreds, setCreatedAgentCreds] = useState<{
    name: string;
    employeeId: string;
    phone: string;
    email?: string;
    pin: string;
  } | null>(null);

  // Form State - opens completely blank on New Agent click
  const [registerForm, setRegisterForm] = useState(BLANK_REGISTER_FORM);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    territory: "",
    department: "",
    status: "",
    newPin: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadRequest = useRef(0);
  const fetchAgents = async (background = false) => {
    const request = ++loadRequest.current;
    if (!background) setLoading(true);
    try {
      const url = `/api/v1/admin/agents${includeInactive ? "?all=true" : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (request !== loadRequest.current) return;
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Failed to load agents", err);
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [includeInactive]);

  useLiveRefresh(() => fetchAgents(true), !loading);

  const openRegisterModal = () => {
    // Ensure form is opened completely blank every time
    setRegisterForm({ ...BLANK_REGISTER_FORM });
    setShowRegisterModal(true);
  };

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side Mandatory Field Validation
    if (!registerForm.name.trim()) {
      alert("Full Name is mandatory.");
      return;
    }
    const cleanPhone = registerForm.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Valid 10-digit Mobile Number is mandatory.");
      return;
    }
    if (!registerForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email.trim())) {
      alert("Valid Email Address is mandatory (e.g. agent@sunlifesolar.in).");
      return;
    }
    if (!registerForm.role.trim()) {
      alert("Role Title is mandatory.");
      return;
    }
    if (!registerForm.territory.trim()) {
      alert("Assigned Territory is mandatory.");
      return;
    }
    const pin = registerForm.initialPin.trim();
    if (!pin || pin.length < 4 || pin.length > 6) {
      alert("Initial Login PIN (4 to 6 digits) is mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowRegisterModal(false);
        setCreatedAgentCreds({
          name: data.agent.name,
          employeeId: data.agent.employeeId,
          phone: data.agent.phone,
          email: data.agent.email || registerForm.email.trim(),
          pin: data.initialPin || registerForm.initialPin,
        });
        setShowCredsModal(true);
        // Reset form completely blank
        setRegisterForm({ ...BLANK_REGISTER_FORM });
        fetchAgents(true);
      } else {
        alert("Unable to complete the request right now. Please try again.");
      }
    } catch (err: any) {
      console.error("[Agent Registration Error]:", err);
      alert("Unable to complete the request right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAccess = async (agent: Agent) => {
    try {
      const res = await fetch("/api/v1/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agent.id,
          employeeAccessEnabled: !agent.employeeAccessEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id
              ? { ...a, employeeAccessEnabled: !a.employeeAccessEnabled }
              : a
          )
        );
      }
    } catch (err) {
      alert("Failed to toggle access permission.");
    }
  };

  const handleToggleActiveStatus = async (agent: Agent) => {
    const action = agent.activeStatus ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} ${agent.name}?`)) return;

    try {
      const res = await fetch("/api/v1/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agent.id,
          activeStatus: !agent.activeStatus,
          employeeAccessEnabled: !agent.activeStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAgents();
      }
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const openProfile = (agent: Agent) => {
    router.push(`/admin/team/${agent.id}/edit`);
  };

  const openEdit = (agent: Agent) => {
    setActiveAgent(agent);
    setEditForm({
      name: agent.name || "",
      phone: agent.phone || "",
      email: agent.email || "",
      role: agent.role || "",
      territory: agent.territory || "",
      department: agent.department || "",
      status: agent.status || "Available",
      newPin: agent.pin || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgent) return;

    // Client-side Mandatory Field Validation
    if (!editForm.name.trim()) {
      alert("Full Name is mandatory.");
      return;
    }
    const cleanPhone = editForm.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Valid 10-digit Mobile Number is mandatory.");
      return;
    }
    if (!editForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      alert("Valid Email Address is mandatory (e.g. agent@sunlifesolar.in).");
      return;
    }
    if (!editForm.role.trim()) {
      alert("Role Title is mandatory.");
      return;
    }
    if (!editForm.territory.trim()) {
      alert("Assigned Territory is mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        id: activeAgent.id,
        name: editForm.name.trim(),
        phone: cleanPhone,
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role.trim(),
        territory: editForm.territory.trim(),
        department: editForm.department.trim(),
        status: editForm.status,
      };
      if (editForm.newPin && editForm.newPin.trim().length >= 4) {
        payload.newPin = editForm.newPin.trim();
      }

      const res = await fetch("/api/v1/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        // Instant optimistic update
        setAgents((prev) =>
          prev.map((a) =>
            a.id === activeAgent.id
              ? {
                  ...a,
                  name: editForm.name.trim(),
                  phone: cleanPhone,
                  email: editForm.email.trim().toLowerCase(),
                  role: editForm.role.trim(),
                  territory: editForm.territory.trim(),
                  department: editForm.department.trim(),
                  status: editForm.status,
                  pin: editForm.newPin && editForm.newPin.trim().length >= 4 ? editForm.newPin.trim() : (data.agent?.pin || a.pin || "123456"),
                }
              : a
          )
        );
        fetchAgents(true);
      } else {
        alert("Unable to complete the request right now. Please try again.");
      }
    } catch (err: any) {
      console.error("[Agent Update Error]:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCredentials = (agent: Agent) => {
    setCreatedAgentCreds({
      name: agent.name,
      employeeId: agent.employeeId || agent.id,
      phone: agent.phone,
      email: agent.email || undefined,
      pin: agent.pin || "123456",
    });
    setShowCredsModal(true);
  };

  const copyCredsText = () => {
    if (!createdAgentCreds) return;
    const emailLine = createdAgentCreds.email ? `Email: ${createdAgentCreds.email}\n` : "";
    const text = `Sunlife Solar Agent App Credentials\nName: ${createdAgentCreds.name}\nEmployee ID: ${createdAgentCreds.employeeId}\nRegistered Phone: ${createdAgentCreds.phone}\n${emailLine}Initial PIN: ${createdAgentCreds.pin}\nLogin Portal: https://sunlifesolar.in/agent`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!createdAgentCreds) return;
    const msg = encodeURIComponent(
      `Hello ${createdAgentCreds.name},\nHere are your Sunlife Agent App login credentials:\n• Employee ID: ${createdAgentCreds.employeeId}\n• Mobile: ${createdAgentCreds.phone}\n• Login PIN: ${createdAgentCreds.pin}\n\nPlease keep your PIN confidential.`
    );
    window.open(`https://wa.me/91${createdAgentCreds.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  // Filter logic
  const territories = Array.from(new Set(agents.map((a) => a.territory).filter(Boolean)));
  const filtered = agents.filter((agent) => {
    const q = search.toLowerCase();
    const matchesSearch =
      agent.name.toLowerCase().includes(q) ||
      (agent.employeeId && agent.employeeId.toLowerCase().includes(q)) ||
      agent.phone.includes(q) ||
      (agent.email && agent.email.toLowerCase().includes(q)) ||
      agent.role.toLowerCase().includes(q) ||
      (agent.territory && agent.territory.toLowerCase().includes(q));

    const matchesTerritory =
      territoryFilter === "ALL" || agent.territory === territoryFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && agent.activeStatus) ||
      (statusFilter === "APP_ENABLED" && agent.employeeAccessEnabled) ||
      (statusFilter === "INACTIVE" && !agent.activeStatus);

    return matchesSearch && matchesTerritory && matchesStatus;
  });

  // KPI calculations
  const totalCount = agents.length;
  const activeCount = agents.filter((a) => a.activeStatus).length;
  const appEnabledCount = agents.filter((a) => a.employeeAccessEnabled).length;
  const assignedClientsCount = agents.reduce(
    (acc, a) => acc + (a._count?.assignedCustomers || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
              Agent & Partner Management
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage field agents, sales consultants, mobile app access permissions, and territory assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAgents()}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openRegisterModal}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Register Agent</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Agents</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <UserCog className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Enrolled team & partners</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Status</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Operational in field</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">App Login Enabled</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{appEnabledCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Agent portal authorization</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Assigned Customers</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{assignedClientsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across active portfolios</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by agent name, ID, phone, territory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Territory Dropdown */}
          <select
            value={territoryFilter}
            onChange={(e) => setTerritoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
          >
            <option value="ALL">All Territories</option>
            {territories.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Agents</option>
            <option value="APP_ENABLED">App Access Enabled</option>
            <option value="INACTIVE">Deactivated</option>
          </select>

          {/* Include Inactive Checkbox */}
          <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-slate-300 text-slate-700 focus:ring-slate-300 cursor-pointer"
            />
            <span>Show Inactive</span>
          </label>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Agent Details</th>
                <th className="px-5 py-3.5">Role & Department</th>
                <th className="px-5 py-3.5">Contact & Phone</th>
                <th className="px-5 py-3.5">Assigned Territory</th>
                <th className="px-5 py-3.5 text-center">Portfolio</th>
                <th className="px-5 py-3.5 text-center">App Access</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Loading agents roster...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <UserCog className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No agents found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try adjusting your search criteria or register a new agent.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((agent) => {
                  const initials = agent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={agent.id}
                      className={`hover:bg-slate-50/75 transition-colors ${
                        !agent.activeStatus ? "opacity-60 bg-slate-50/30" : ""
                      }`}
                    >
                      {/* Agent Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => openProfile(agent)}
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-2xs"
                            title="Click to view agent profile"
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openProfile(agent)}
                                className="hover:text-blue-600 hover:underline text-left font-semibold cursor-pointer transition-colors"
                                title="Click to view agent profile"
                              >
                                {agent.name}
                              </button>
                              {!agent.activeStatus && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-red-50 text-red-600 border border-red-200">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-slate-600 font-medium">
                                {agent.employeeId || "SL-PENDING"}
                              </span>
                              {agent.status && (
                                <>
                                  <span>•</span>
                                  <span>{agent.status}</span>
                                </>
                              )}
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => openProfile(agent)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Profile</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{agent.role}</div>
                        <div className="text-[11px] text-slate-400">
                          {agent.department || agent.category || "Field Staff"}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono font-medium text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>+91 {agent.phone}</span>
                        </div>
                        {agent.email ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1 truncate max-w-[190px]" title={agent.email}>
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{agent.email}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600/70 mt-0.5 italic">
                            <span>No email assigned</span>
                          </div>
                        )}
                      </td>

                      {/* Territory */}
                      <td className="px-5 py-3.5">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{agent.territory || "Unassigned"}</span>
                        </div>
                      </td>

                      {/* Portfolio Count */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold">
                          {agent._count?.assignedCustomers || 0} clients
                        </span>
                      </td>

                      {/* App Access Toggle */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAccess(agent)}
                          title="Click to toggle mobile portal access"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
                            agent.employeeAccessEnabled
                              ? "bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              agent.employeeAccessEnabled ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                          <span>{agent.employeeAccessEnabled ? "Enabled" : "Disabled"}</span>
                        </button>
                      </td>

                      {/* Actions with Three-Dot & Hover Dropdown */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Quick View Profile Button */}
                          <button
                            type="button"
                            onClick={() => openProfile(agent)}
                            title="View Agent Profile"
                            className="p-1.5 px-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 hover:border-slate-300 flex items-center gap-1 text-[11px] font-medium shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Profile</span>
                          </button>

                          {/* Portal-based Hover Action Menu */}
                          <AgentActionMenu
                            agent={agent}
                            onViewProfile={() => openProfile(agent)}
                            onEdit={() => openEdit(agent)}
                            onCredentials={() => openCredentials(agent)}
                            onToggleAccess={() => handleToggleAccess(agent)}
                            onToggleActive={() => handleToggleActiveStatus(agent)}
                          />
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

      {/* Modal: Register Agent */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register New Field Agent</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterAgent} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Verma"
                    value={registerForm.name}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={registerForm.phone}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="agent@sunlifesolar.in"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Employee ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated e.g. SL-A201"
                    value={registerForm.employeeId}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, employeeId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Field Operations Agent"
                    value={registerForm.role}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, role: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Assigned Territory <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jaipur Central, Pipariya"
                    value={registerForm.territory}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, territory: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Initial 6-Digit PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="4 to 6 digit PIN"
                    maxLength={6}
                    value={registerForm.initialPin}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, initialPin: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white font-mono text-center tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Department <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Operations, Sales"
                    value={registerForm.department}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, department: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                The agent will immediately be able to log in to the Sunlife Field Agent App using
                their registered mobile number or employee ID and this 6-digit initial PIN.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 rounded-xl font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Create Agent Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Agent */}
      {showEditModal && activeAgent && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Agent: {activeAgent.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: {activeAgent.employeeId || activeAgent.id} • Fields with <span className="text-red-500 font-bold">*</span> are mandatory
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="agent@sunlifesolar.in"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Assigned Territory <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.territory}
                    onChange={(e) =>
                      setEditForm({ ...editForm, territory: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Duty Status Label
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Active On-Site">Active On-Site</option>
                    <option value="On Survey">On Survey</option>
                    <option value="Off-Duty">Off-Duty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Department <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Operations, Sales"
                    value={editForm.department}
                    onChange={(e) =>
                      setEditForm({ ...editForm, department: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Reset Login PIN <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="New 4-6 digit PIN"
                    maxLength={6}
                    value={editForm.newPin}
                    onChange={(e) =>
                      setEditForm({ ...editForm, newPin: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white font-mono text-center tracking-wider"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 rounded-xl font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Credentials & WhatsApp Dispatch */}
      {showCredsModal && createdAgentCreds && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Agent Login Access</h3>
                  <p className="text-[11px] text-slate-400">Portal credentials & invite</p>
                </div>
              </div>
              <button
                onClick={() => setShowCredsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Agent Name</span>
                  <span className="font-semibold text-slate-900">{createdAgentCreds.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Employee ID</span>
                  <span className="font-mono font-bold text-slate-800">
                    {createdAgentCreds.employeeId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mobile Number</span>
                  <span className="font-mono font-medium text-slate-800">
                    +91 {createdAgentCreds.phone}
                  </span>
                </div>
                {createdAgentCreds.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email Address</span>
                    <span className="font-mono font-medium text-slate-800 truncate max-w-[200px]">
                      {createdAgentCreds.email}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                  <span className="text-slate-400">Login PIN</span>
                  <span className="font-mono font-bold text-slate-900 tracking-wider">
                    {createdAgentCreds.pin}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={copyCredsText}
                  className="flex-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Info</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="flex-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>WhatsApp Invite</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
