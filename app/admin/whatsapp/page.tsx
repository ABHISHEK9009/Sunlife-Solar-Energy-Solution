"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Sparkles,
  Send,
  RefreshCw,
  User,
  Users,
  ShieldCheck,
  Phone,
  ArrowRight,
  ExternalLink,
  QrCode,
  LogOut,
  X,
  UserCheck,
  Building,
  Zap,
  Tag,
  Filter,
} from "lucide-react";
import { SolarLifecycleEvent, formatSolarLifecycleMessage } from "@/lib/whatsapp/queue";

interface ConversationItem {
  id: string;
  phone: string;
  customerId?: string | null;
  leadId?: string | null;
  assignedToId?: string | null;
  lastHandledById?: string | null;
  status: "OPEN" | "RESOLVED";
  unreadCount: number;
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  customer?: {
    id: string;
    customerId: string;
    fullName: string;
    primaryMobile: string;
    propertyType: string;
    installationAddress: string;
    projects?: {
      id: string;
      projectId: string;
      plantCapacityKw: number;
      projectStatus: string;
      discom: string;
      assignedSalesExecutive?: { name: string } | null;
      assignedEngineer?: { name: string } | null;
    }[];
  } | null;
  lead?: {
    id: string;
    leadId?: string | null;
    name: string;
    phone: string;
    interestedSolution?: string | null;
    requestedCapacity?: number | null;
    status: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface MessageItem {
  id: string;
  conversationId: string;
  phone: string;
  senderType: string;
  senderName?: string | null;
  direction: "OUTBOUND" | "INBOUND";
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  caption?: string | null;
  fileName?: string | null;
  status: "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  failureReason?: string | null;
  templateName?: string | null;
  createdAt: string;
}

interface GatewayStatus {
  status: string;
  isConnected: boolean;
  phone: string | null;
  name: string | null;
  hasQr: boolean;
}

export default function WhatsAppInboxPage() {
  // State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; role: string }[]>([]);

  const [filter, setFilter] = useState<"all" | "unread" | "open" | "resolved" | "unassigned">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState("");

  // Gateway status & QR Modal
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>({
    status: "UNKNOWN",
    isConnected: false,
    phone: null,
    name: null,
    hasQr: false,
  });
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Gateway Status
  const fetchGatewayStatus = async () => {
    try {
      const res = await fetch("/api/v1/admin/whatsapp?action=gateway_status");
      const data = await res.json();
      setGatewayStatus(data);
    } catch (e) {
      setGatewayStatus({
        status: "OFFLINE",
        isConnected: false,
        phone: null,
        name: null,
        hasQr: false,
      });
    }
  };

  // Fetch Team Members for assignment
  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/v1/admin/team");
      const data = await res.json();
      if (data.members) {
        setTeamMembers(data.members.map((m: any) => ({ id: m.id, name: m.name, role: m.role })));
      }
    } catch (e) {
      console.error("Failed to load team members:", e);
    }
  };

  // Fetch Conversations
  const fetchConversations = async (keepActive = true) => {
    try {
      let url = `/api/v1/admin/whatsapp?action=conversations&filter=${filter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      if (selectedAgentId) url += `&assignedToId=${selectedAgentId}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (keepActive && activeConversation) {
          const updated = data.conversations.find((c: ConversationItem) => c.id === activeConversation.id);
          if (updated) setActiveConversation(updated);
        } else if (!activeConversation && data.conversations.length > 0) {
          setActiveConversation(data.conversations[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch Messages for active conversation
  const fetchMessages = async (conversationId: string, isSilent = false) => {
    if (!isSilent) setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/v1/admin/whatsapp?action=messages&conversationId=${conversationId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
    } finally {
      if (!isSilent) setIsLoadingMessages(false);
    }
  };

  // Fetch QR Code for pairing
  const fetchQrCode = async () => {
    setIsLoadingQr(true);
    try {
      const res = await fetch("/api/v1/admin/whatsapp?action=gateway_qr");
      const data = await res.json();
      if (data.qr) {
        setQrCodeData(data.qr);
      } else {
        setQrCodeData(null);
      }
    } catch (e) {
      console.error("Failed to fetch QR code:", e);
    } finally {
      setIsLoadingQr(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchGatewayStatus();
    fetchTeamMembers();
    fetchConversations(false);

    const statusInterval = setInterval(fetchGatewayStatus, 6000);
    const convInterval = setInterval(() => fetchConversations(true), 4000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(convInterval);
    };
  }, [filter, searchQuery, selectedAgentId]);

  // When active conversation changes or is open, auto-fetch & poll its messages
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    // Initial load for this conversation
    fetchMessages(activeConversation.id, false);

    // Mark as read if unreadCount > 0
    if (activeConversation.unreadCount > 0) {
      fetch("/api/v1/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", conversationId: activeConversation.id }),
      }).then(() => {
        setActiveConversation((prev) => (prev ? { ...prev, unreadCount: 0 } : null));
      });
    }

    // Real-time polling for incoming messages every 3.5 seconds
    const msgInterval = setInterval(() => {
      fetchMessages(activeConversation.id, true);
    }, 3500);

    return () => clearInterval(msgInterval);
  }, [activeConversation?.id]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // QR Modal Polling
  useEffect(() => {
    let qrInterval: NodeJS.Timeout | null = null;
    if (showQrModal) {
      fetchQrCode();
      qrInterval = setInterval(async () => {
        await fetchGatewayStatus();
        if (gatewayStatus.isConnected) {
          setShowQrModal(false);
        } else {
          fetchQrCode();
        }
      }, 3000);
    }
    return () => {
      if (qrInterval) clearInterval(qrInterval);
    };
  }, [showQrModal, gatewayStatus.isConnected]);

  // Send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConversation || isSending) return;

    const content = inputText.trim();
    setIsSending(true);

    const optimistic: MessageItem = {
      id: "temp-" + Date.now(),
      conversationId: activeConversation.id,
      phone: activeConversation.phone,
      senderType: "ADMIN",
      senderName: "Admin",
      direction: "OUTBOUND",
      messageType: "TEXT",
      content,
      status: "QUEUED",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInputText("");

    try {
      const res = await fetch("/api/v1/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          phone: activeConversation.phone,
          content,
          customerId: activeConversation.customerId,
          leadId: activeConversation.leadId,
          senderType: "ADMIN",
          senderName: "Sunlife Solar Admin",
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to send");
      }

      await fetchMessages(activeConversation.id);
      await fetchConversations(true);
    } catch (err: any) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Quick Template Handler
  const handleSelectTemplate = (event: SolarLifecycleEvent) => {
    if (!activeConversation) return;
    const name = activeConversation.customer?.fullName || activeConversation.lead?.name || "Customer";
    const capacity = activeConversation.customer?.projects?.[0]?.plantCapacityKw || 3;
    const { body } = formatSolarLifecycleMessage(event, {
      customerName: name,
      plantCapacityKw: capacity,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    });
    setInputText(body);
  };

  // Toggle Conversation Status (OPEN / RESOLVED)
  const handleToggleStatus = async () => {
    if (!activeConversation) return;
    const newStatus = activeConversation.status === "OPEN" ? "RESOLVED" : "OPEN";
    try {
      const res = await fetch("/api/v1/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          conversationId: activeConversation.id,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setActiveConversation((prev) => (prev ? { ...prev, status: newStatus } : null));
        fetchConversations(true);
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // Assign Conversation to Agent
  const handleAssignAgent = async (agentId: string) => {
    if (!activeConversation) return;
    try {
      const res = await fetch("/api/v1/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          conversationId: activeConversation.id,
          assignedToId: agentId || null,
        }),
      });
      if (res.ok) {
        const found = teamMembers.find((m) => m.id === agentId);
        setActiveConversation((prev) =>
          prev
            ? {
                ...prev,
                assignedToId: agentId || null,
                assignedTo: found ? { id: found.id, name: found.name, role: found.role } : null,
              }
            : null
        );
        fetchConversations(true);
      }
    } catch (e) {
      console.error("Failed to assign agent:", e);
    }
  };

  // Gateway Logout
  const handleGatewayLogout = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp gateway? You will need to scan QR code again.")) return;
    try {
      await fetch("/api/v1/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "gateway_logout" }),
      });
      fetchGatewayStatus();
    } catch (e) {
      console.error("Failed to logout gateway:", e);
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── TOP STATUS BANNER ─── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>WhatsApp Command Center</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                Sunlife Solar
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Bidirectional WhatsApp inbox, non-blocking queue dispatcher & automated solar notifications.
            </p>
          </div>
        </div>

        {/* Gateway Status Badge & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gatewayStatus.isConnected
                  ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                  : gatewayStatus.status === "QR_READY"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="font-semibold text-slate-700">
              {gatewayStatus.isConnected
                ? `Connected (${gatewayStatus.phone || "Active"})`
                : gatewayStatus.status === "QR_READY"
                ? "Scan QR Code"
                : "Gateway Offline"}
            </span>
          </div>

          {!gatewayStatus.isConnected ? (
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Pair WhatsApp</span>
            </button>
          ) : (
            <button
              onClick={handleGatewayLogout}
              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
              title="Disconnect WhatsApp Gateway"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              fetchGatewayStatus();
              fetchConversations(true);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── THREE COLUMN INBOX ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-210px)] min-h-[600px]">
        {/* ─── COLUMN 1: CONVERSATIONS LIST (3 cols) ─── */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col shadow-xs overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-100 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, or customer ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5 text-xs">
              {(["all", "unread", "open", "resolved", "unassigned"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] capitalize transition-colors shrink-0 ${
                    filter === tab
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Agent Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="">All Assigned Agents</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No conversations found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Incoming WhatsApp messages or outbound messages will appear here.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                const contactName =
                  conv.customer?.fullName || conv.lead?.name || `+${conv.phone}`;
                const identifier = conv.customer?.customerId || conv.lead?.leadId || null;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-3.5 cursor-pointer transition-colors relative flex gap-3 items-start ${
                      isSelected
                        ? "bg-emerald-50/70 border-l-4 border-emerald-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                      {contactName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name & Timestamp */}
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {contactName}
                          </span>
                          {identifier && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-600 shrink-0">
                              {identifier}
                            </span>
                          )}
                        </div>

                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Last Message Snippet */}
                      <p className="text-xs text-slate-500 truncate mb-1.5 font-normal">
                        {conv.lastMessageText || "No messages"}
                      </p>

                      {/* Badges strip: Assigned to & Status & Unread */}
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          {conv.assignedTo ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[90px]">{conv.assignedTo.name}</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">
                              Unassigned
                            </span>
                          )}

                          <span
                            className={`px-1.5 py-0.5 rounded-md font-medium ${
                              conv.status === "OPEN"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {conv.status}
                          </span>
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── COLUMN 2: ACTIVE CHAT STREAM (5 cols) ─── */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl flex flex-col shadow-xs overflow-hidden">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                    {(
                      activeConversation.customer?.fullName ||
                      activeConversation.lead?.name ||
                      "C"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 truncate">
                      <span className="truncate">
                        {activeConversation.customer?.fullName ||
                          activeConversation.lead?.name ||
                          `+${activeConversation.phone}`}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        (+{activeConversation.phone})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      {/* Assigned to agent selector */}
                      <select
                        value={activeConversation.assignedToId || ""}
                        onChange={(e) => handleAssignAgent(e.target.value)}
                        className="bg-transparent border-0 font-semibold text-slate-700 hover:text-emerald-700 p-0 cursor-pointer focus:ring-0"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            Assigned: {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status Toggle & Customer link */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleToggleStatus}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      activeConversation.status === "OPEN"
                        ? "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {activeConversation.status === "OPEN" ? "Mark Resolved" : "Reopen Chat"}
                  </button>

                  {activeConversation.customerId && (
                    <Link
                      href={`/admin/client-profile/${activeConversation.customerId}`}
                      target="_blank"
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                      title="Open Customer Profile in New Tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
                {isLoadingMessages ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500 mr-2" />
                    <span>Loading message thread...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-xs">No message history</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Send a solar update or custom greeting to start the conversation.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutbound = msg.direction === "OUTBOUND";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                            isOutbound
                              ? "bg-emerald-600 text-white rounded-tr-xs"
                              : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                          }`}
                        >
                          {/* Template Badge if applicable */}
                          {msg.templateName && (
                            <div
                              className={`text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${
                                isOutbound ? "text-emerald-200" : "text-emerald-700"
                              }`}
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{msg.templateName.replace(/_/g, " ")}</span>
                            </div>
                          )}

                          {/* Content */}
                          <div className="whitespace-pre-wrap leading-relaxed break-words font-medium">
                            {msg.content}
                          </div>

                          {/* Footer: Time & Status */}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                              isOutbound ? "text-emerald-100" : "text-slate-400"
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            {isOutbound && (
                              <span>
                                {msg.status === "QUEUED" && (
                                  <span title="Queued">
                                    <Clock className="w-2.5 h-2.5 inline text-emerald-200" />
                                  </span>
                                )}
                                {msg.status === "SENDING" && (
                                  <span title="Sending">
                                    <RefreshCw className="w-2.5 h-2.5 inline animate-spin text-emerald-200" />
                                  </span>
                                )}
                                {msg.status === "SENT" && (
                                  <span title="Sent">
                                    <Check className="w-2.5 h-2.5 inline text-emerald-200" />
                                  </span>
                                )}
                                {msg.status === "DELIVERED" && (
                                  <span title="Delivered">
                                    <CheckCheck className="w-2.5 h-2.5 inline text-emerald-200" />
                                  </span>
                                )}
                                {msg.status === "READ" && (
                                  <span title="Read">
                                    <CheckCheck className="w-2.5 h-2.5 inline text-sky-300" />
                                  </span>
                                )}
                                {msg.status === "FAILED" && (
                                  <span title={msg.failureReason || "Failed"}>
                                    <AlertCircle className="w-2.5 h-2.5 inline text-red-300" />
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Solar Templates Bar */}
              <div className="p-2 border-t border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    <span>Solar Lifecycle Templates:</span>
                  </span>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                  <button
                    onClick={() => handleSelectTemplate("LEAD_CREATED")}
                    className="shrink-0 px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md font-medium"
                  >
                    Welcome 👋
                  </button>
                  <button
                    onClick={() => handleSelectTemplate("SURVEY_SCHEDULED")}
                    className="shrink-0 px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md font-medium"
                  >
                    Survey Date 📅
                  </button>
                  <button
                    onClick={() => handleSelectTemplate("QUOTATION_READY")}
                    className="shrink-0 px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md font-medium"
                  >
                    Quotation 📋
                  </button>
                  <button
                    onClick={() => handleSelectTemplate("DISCOM_APPLICATION_SUBMITTED")}
                    className="shrink-0 px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md font-medium"
                  >
                    DISCOM ⚡
                  </button>
                  <button
                    onClick={() => handleSelectTemplate("MATERIAL_DISPATCHED")}
                    className="shrink-0 px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md font-medium"
                  >
                    Dispatch 🚚
                  </button>
                  <button
                    onClick={() => handleSelectTemplate("INSTALLATION_SCHEDULED")}
                    className="shrink-0 px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md font-medium"
                  >
                    Installation 🔧
                  </button>
                  <button
                    onClick={() => handleSelectTemplate("COMMISSIONING_COMPLETED")}
                    className="shrink-0 px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md font-medium"
                  >
                    Commissioned ☀️
                  </button>
                  <button
                    onClick={() => handleSelectTemplate("SUBSIDY_STATUS")}
                    className="shrink-0 px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md font-medium"
                  >
                    Subsidy 🏦
                  </button>
                </div>
              </div>

              {/* Message Composer */}
              <div className="p-3 bg-white border-t border-slate-200">
                <div className="flex items-end gap-2">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Type message to ${
                      activeConversation.customer?.fullName ||
                      activeConversation.lead?.name ||
                      "customer"
                    }...`}
                    rows={2}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !inputText.trim()}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors shrink-0"
                    title="Send"
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Select a conversation</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose a customer or lead from the list on the left to view message history and reply.
              </p>
            </div>
          )}
        </div>

        {/* ─── COLUMN 3: CUSTOMER 360 SIDEBAR (3 cols) ─── */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col overflow-y-auto space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Customer 360</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          {activeConversation ? (
            <>
              {/* Profile Card */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                    {(
                      activeConversation.customer?.fullName ||
                      activeConversation.lead?.name ||
                      "C"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {activeConversation.customer?.fullName ||
                        activeConversation.lead?.name ||
                        "Unregistered"}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">+{activeConversation.phone}</p>
                  </div>
                </div>

                {activeConversation.customer?.installationAddress && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                    {activeConversation.customer.installationAddress}
                  </p>
                )}
              </div>

              {/* Solar Project Card */}
              {activeConversation.customer?.projects?.[0] ? (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Solar Project
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 font-bold">
                      {activeConversation.customer.projects[0].projectId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Plant Capacity</span>
                      <span className="font-bold text-slate-900">
                        {activeConversation.customer.projects[0].plantCapacityKw} kW
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">DISCOM</span>
                      <span className="font-bold text-slate-900">
                        {activeConversation.customer.projects[0].discom}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Status</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                      {activeConversation.customer.projects[0].projectStatus.replace(/_/g, " ")}
                    </span>
                  </div>

                  {activeConversation.customer.projects[0].assignedSalesExecutive && (
                    <div className="text-xs border-t border-emerald-100 pt-2 text-slate-600">
                      <span className="text-[10px] text-slate-400 block">Sales Executive</span>
                      <span className="font-medium text-slate-800">
                        {activeConversation.customer.projects[0].assignedSalesExecutive.name}
                      </span>
                    </div>
                  )}

                  {activeConversation.customer.projects[0].assignedEngineer && (
                    <div className="text-xs text-slate-600">
                      <span className="text-[10px] text-slate-400 block">Project Engineer</span>
                      <span className="font-medium text-slate-800">
                        {activeConversation.customer.projects[0].assignedEngineer.name}
                      </span>
                    </div>
                  )}

                  <Link
                    href={`/admin/client-profile/${activeConversation.customer.id}`}
                    className="w-full mt-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Open Customer Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : activeConversation.lead ? (
                /* Lead Card */
                <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                      Lead Details
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800 font-bold">
                      {activeConversation.lead.leadId || "LEAD"}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Solution</span>
                      <span className="font-bold text-slate-900">
                        {activeConversation.lead.interestedSolution || "Rooftop Solar"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Capacity</span>
                      <span className="font-bold text-slate-900">
                        {activeConversation.lead.requestedCapacity
                          ? `${activeConversation.lead.requestedCapacity} kW`
                          : "Not specified"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/leads`}
                    className="w-full mt-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Manage in Leads Pipeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500 space-y-2">
                  <p>This phone is not yet linked to a Customer or Lead in Sunlife CRM.</p>
                  <Link
                    href="/admin/customers"
                    className="inline-block px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
                  >
                    Create Customer
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-xs text-slate-400 py-10">
              No active customer selected.
            </div>
          )}
        </div>
      </div>

      {/* ─── PAIRING QR CODE MODAL ─── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Pair WhatsApp</h3>
                  <p className="text-[11px] text-slate-500">Scan with WhatsApp on phone</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Display */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[220px]">
              {isLoadingQr ? (
                <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>Generating QR code...</span>
                </div>
              ) : qrCodeData ? (
                <img
                  src={qrCodeData}
                  alt="WhatsApp QR Code"
                  className="w-48 h-48 rounded-lg shadow-xs border border-slate-200"
                />
              ) : (
                <div className="text-center text-xs text-slate-500 space-y-2">
                  <p>QR Code not ready yet or Gateway is offline.</p>
                  <button
                    onClick={fetchQrCode}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              <p className="font-bold text-slate-800 text-[11px]">How to link:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                <li>Open WhatsApp on your phone</li>
                <li>Tap <strong>Settings</strong> or <strong>Menu (⋮)</strong></li>
                <li>Select <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong></li>
                <li>Point your camera at this QR code</li>
              </ol>
            </div>

            <div className="text-[10px] text-center text-slate-400">
              Modal will automatically close as soon as WhatsApp connects.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
