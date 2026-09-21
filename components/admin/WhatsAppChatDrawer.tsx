"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  RefreshCw,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Sparkles,
  Paperclip,
  Phone,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { SolarLifecycleEvent, formatSolarLifecycleMessage } from "@/lib/whatsapp/queue";

interface WhatsAppMessageItem {
  id: string;
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
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
}

interface WhatsAppChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  customerName: string;
  customerId?: string;
  leadId?: string;
  plantCapacityKw?: number;
}

export default function WhatsAppChatDrawer({
  isOpen,
  onClose,
  phone,
  customerName,
  customerId,
  leadId,
  plantCapacityKw,
}: WhatsAppChatDrawerProps) {
  const [messages, setMessages] = useState<WhatsAppMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [gatewayStatus, setGatewayStatus] = useState<string>("UNKNOWN");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages and gateway status
  const loadChatData = async () => {
    if (!phone) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch messages
      const res = await fetch(`/api/v1/admin/whatsapp?action=messages&phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }

      // 2. Fetch gateway status
      const statusRes = await fetch(`/api/v1/admin/whatsapp?action=gateway_status`);
      const statusData = await statusRes.json();
      setGatewayStatus(statusData.status || "OFFLINE");
    } catch (err: any) {
      console.error("Error loading chat data:", err);
      setErrorMessage("Could not load WhatsApp messages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && phone) {
      loadChatData();
      const interval = setInterval(loadChatData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, phone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle template selection
  const handleTemplateSelect = (event: SolarLifecycleEvent) => {
    setSelectedTemplate(event);
    const { body } = formatSolarLifecycleMessage(event, {
      customerName,
      plantCapacityKw: plantCapacityKw || 3,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    });
    setInputText(body);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const content = inputText.trim();
    setIsSending(true);
    setErrorMessage(null);

    // Optimistic local item
    const tempId = "temp-" + Date.now();
    const optimisticMsg: WhatsAppMessageItem = {
      id: tempId,
      phone,
      senderType: "ADMIN",
      senderName: "Admin",
      direction: "OUTBOUND",
      messageType: "TEXT",
      content,
      status: "QUEUED",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");

    try {
      const res = await fetch("/api/v1/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          phone,
          content,
          customerId,
          leadId,
          senderType: "ADMIN",
          senderName: "Sunlife Solar Admin",
          templateName: selectedTemplate || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to enqueue message");
      }

      // Re-fetch chat data to get synchronized state
      await loadChatData();
    } catch (err: any) {
      console.error("Send error:", err);
      setErrorMessage(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
      setSelectedTemplate("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>{customerName}</span>
                <span className="text-xs font-normal text-slate-400">({phone})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      gatewayStatus === "CONNECTED"
                        ? "bg-emerald-400"
                        : gatewayStatus === "QR_READY"
                        ? "bg-amber-400 animate-pulse"
                        : "bg-red-400"
                    }`}
                  />
                  <span className="text-slate-300 font-medium">
                    {gatewayStatus === "CONNECTED"
                      ? "WhatsApp Gateway Active"
                      : gatewayStatus === "QR_READY"
                      ? "Pairing Needed"
                      : "Gateway Offline (Queueing Active)"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadChatData}
              disabled={isLoading}
              title="Refresh conversation"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gateway Notice if not connected */}
        {gatewayStatus !== "CONNECTED" && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Gateway is {gatewayStatus}. Messages will be safely <strong>QUEUED</strong> and automatically dispatched once the WhatsApp session connects.
            </span>
          </div>
        )}

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">No messages yet</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Start the conversation with {customerName} or send a solar update template below.
                </p>
              </div>
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
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                      isOutbound
                        ? "bg-emerald-600 text-white rounded-tr-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                    }`}
                  >
                    {/* Template Badge if applicable */}
                    {msg.templateName && (
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${
                          isOutbound ? "text-emerald-200" : "text-emerald-700"
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{msg.templateName.replace(/_/g, " ")}</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="whitespace-pre-wrap leading-relaxed break-words font-medium">
                      {msg.content}
                    </div>

                    {/* Metadata & Status footer */}
                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
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
                            <span title="Queued in CRM">
                              <Clock className="w-3 h-3 inline text-emerald-200" />
                            </span>
                          )}
                          {msg.status === "SENDING" && (
                            <span title="Sending...">
                              <RefreshCw className="w-3 h-3 inline animate-spin text-emerald-200" />
                            </span>
                          )}
                          {msg.status === "SENT" && (
                            <span title="Sent to WhatsApp">
                              <Check className="w-3 h-3 inline text-emerald-200" />
                            </span>
                          )}
                          {msg.status === "DELIVERED" && (
                            <span title="Delivered">
                              <CheckCheck className="w-3 h-3 inline text-emerald-200" />
                            </span>
                          )}
                          {msg.status === "READ" && (
                            <span title="Read by Customer">
                              <CheckCheck className="w-3 h-3 inline text-sky-300" />
                            </span>
                          )}
                          {msg.status === "FAILED" && (
                            <span title={msg.failureReason || "Failed"}>
                              <AlertCircle className="w-3 h-3 inline text-red-300" />
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

        {/* Quick Solar Templates Strip */}
        <div className="border-t border-slate-200 bg-white p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Solar Lifecycle Templates:</span>
            </span>
            {selectedTemplate && (
              <button
                onClick={() => {
                  setSelectedTemplate("");
                  setInputText("");
                }}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => handleTemplateSelect("LEAD_CREATED")}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg font-medium text-[11px] transition-colors"
            >
              Welcome 👋
            </button>
            <button
              onClick={() => handleTemplateSelect("SURVEY_SCHEDULED")}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg font-medium text-[11px] transition-colors"
            >
              Survey Date 📅
            </button>
            <button
              onClick={() => handleTemplateSelect("QUOTATION_READY")}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg font-medium text-[11px] transition-colors"
            >
              Quotation Ready 📋
            </button>
            <button
              onClick={() => handleTemplateSelect("DISCOM_APPLICATION_SUBMITTED")}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg font-medium text-[11px] transition-colors"
            >
              DISCOM Portal ⚡
            </button>
            <button
              onClick={() => handleTemplateSelect("MATERIAL_DISPATCHED")}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg font-medium text-[11px] transition-colors"
            >
              Material Dispatch 🚚
            </button>
            <button
              onClick={() => handleTemplateSelect("INSTALLATION_SCHEDULED")}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg font-medium text-[11px] transition-colors"
            >
              Installation 🔧
            </button>
            <button
              onClick={() => handleTemplateSelect("COMMISSIONING_COMPLETED")}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg font-medium text-[11px] transition-colors"
            >
              Commissioned ☀️
            </button>
            <button
              onClick={() => handleTemplateSelect("SUBSIDY_STATUS")}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg font-medium text-[11px] transition-colors"
            >
              Subsidy Update 🏦
            </button>
          </div>
        </div>

        {/* Input Composer */}
        <div className="p-3 bg-white border-t border-slate-200">
          {errorMessage && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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
              placeholder={`Message ${customerName}...`}
              rows={3}
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
            />

            <button
              onClick={handleSendMessage}
              disabled={isSending || !inputText.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center shrink-0"
              title="Send WhatsApp Message"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Sunlife WhatsApp Engine</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
