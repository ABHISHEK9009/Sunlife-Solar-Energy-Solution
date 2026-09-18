"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useEffect, useState } from "react";
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
  _count?: {
    assignedCustomers: number;
    surveys: number;
  };
}

export default function AdminAgentsPage() {
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
  const [createdAgentCreds, setCreatedAgentCreds] = useState<{
    name: string;
    employeeId: string;
    phone: string;
    pin: string;
  } | null>(null);

  // Form State
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    employeeId: "",
    role: "Field Operations Agent",
    category: "Field Team",
    territory: "Jaipur Central",
    department: "Operations",
    initialPin: "123456",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
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

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
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
          pin: data.initialPin || registerForm.initialPin,
        });
        setShowCredsModal(true);
        // Reset form
        setRegisterForm({
          name: "",
          phone: "",
          employeeId: "",
          role: "Field Operations Agent",
          category: "Field Team",
          territory: "Jaipur Central",
          department: "Operations",
          initialPin: "123456",
        });
        fetchAgents();
      } else {
        alert(data.error || "Failed to register agent.");
      }
    } catch (err: any) {
      alert("Error registering agent: " + err.message);
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

  const openEdit = (agent: Agent) => {
    setActiveAgent(agent);
    setEditForm({
      name: agent.name,
      phone: agent.phone,
      role: agent.role,
      territory: agent.territory || "",
      department: agent.department || "",
      status: agent.status || "Available",
      newPin: "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgent) return;
    setSubmitting(true);
    try {
      const payload: any = {
        id: activeAgent.id,
        name: editForm.name,
        phone: editForm.phone,
        role: editForm.role,
        territory: editForm.territory,
        department: editForm.department,
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
        fetchAgents();
      } else {
        alert(data.error || "Failed to update agent.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openCredentials = (agent: Agent) => {
    setCreatedAgentCreds({
      name: agent.name,
      employeeId: agent.employeeId || agent.id,
      phone: agent.phone,
      pin: "123456",
    });
    setShowCredsModal(true);
  };

  const copyCredsText = () => {
    if (!createdAgentCreds) return;
    const text = `Sunlife Solar Agent App Credentials\nName: ${createdAgentCreds.name}\nEmployee ID: ${createdAgentCreds.employeeId}\nRegistered Phone: ${createdAgentCreds.phone}\nInitial PIN: ${createdAgentCreds.pin}\nLogin Portal: https://sunlifesolar.in/agent`;
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
            onClick={() => setShowRegisterModal(true)}
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
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
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
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{agent.name}</span>
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
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>+91 {agent.phone}</span>
                        </div>
                        {agent.email && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {agent.email}
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

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCredentials(agent)}
                            title="View credentials & WhatsApp invite"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEdit(agent)}
                            title="Edit Agent details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleActiveStatus(agent)}
                            title={agent.activeStatus ? "Deactivate agent" : "Activate agent"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100"
                          >
                            {agent.activeStatus ? (
                              <Trash2 className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
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

      {/* Modal: Register Agent */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register New Field Agent</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Creates profile and generates mobile credentials with 6-digit PIN
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
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
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
                    Mobile Number *
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
                    Employee ID (Optional)
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

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role Title</label>
                  <input
                    type="text"
                    value={registerForm.role}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, role: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Assigned Territory
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jaipur North, Pipariya"
                    value={registerForm.territory}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, territory: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Initial 6-Digit PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={registerForm.initialPin}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, initialPin: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white font-mono text-center tracking-wider"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                The agent will immediately be able to log in to the Sunlife Field Agent App using
                their registered mobile number and this 6-digit initial PIN.
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
                  ID: {activeAgent.employeeId || activeAgent.id}
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
                  <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Number</label>
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
                  <label className="block text-slate-700 font-semibold mb-1">Role Title</label>
                  <input
                    type="text"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Assigned Territory
                  </label>
                  <input
                    type="text"
                    value={editForm.territory}
                    onChange={(e) =>
                      setEditForm({ ...editForm, territory: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Reset Login PIN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="New 6-digit PIN"
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
