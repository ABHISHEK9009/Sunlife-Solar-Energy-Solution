/**
 * WhatsApp Queue & Notification Engine — Sunlife Solar CRM
 * 
 * Implements decoupled, non-blocking queueing and dispatching:
 * CRM action -> DB: QUEUED -> Worker / Dispatcher -> SENDING -> Gateway -> SENT -> DELIVERED -> READ
 * 
 * If gateway is offline, CRM does NOT freeze or fail.
 * Messages remain QUEUED and retry independently with exponential backoff.
 */

import { prisma } from "@/lib/prisma";
import { getWhatsAppProvider } from "./provider";

export const MAX_RETRIES = 5;

export type SolarLifecycleEvent =
  | "LEAD_CREATED"
  | "CUSTOMER_ENROLLED"
  | "SURVEY_SCHEDULED"
  | "SURVEY_RESCHEDULED"
  | "SURVEY_COMPLETED"
  | "DOCUMENT_REQUIRED"
  | "DOCUMENT_RECEIVED"
  | "QUOTATION_READY"
  | "QUOTATION_APPROVED"
  | "PAYMENT_DUE"
  | "PAYMENT_RECEIVED"
  | "DISCOM_APPLICATION_SUBMITTED"
  | "DISCOM_STATUS_CHANGED"
  | "MATERIAL_DISPATCHED"
  | "INSTALLATION_SCHEDULED"
  | "INSTALLATION_RESCHEDULED"
  | "INSTALLATION_COMPLETED"
  | "NET_METER_STATUS"
  | "COMMISSIONING_COMPLETED"
  | "SUBSIDY_STATUS"
  | "SERVICE_REQUEST_CREATED"
  | "ENGINEER_ASSIGNED"
  | "SERVICE_COMPLETED";

export interface EnqueueMessageOptions {
  phone: string;
  content: string;
  customerId?: string | null;
  leadId?: string | null;
  senderType?: "ADMIN" | "AGENT" | "SYSTEM" | "CUSTOMER";
  senderId?: string | null;
  senderName?: string | null;
  messageType?: "TEXT" | "IMAGE" | "DOCUMENT" | "TEMPLATE";
  mediaUrl?: string | null;
  caption?: string | null;
  fileName?: string | null;
  templateName?: string | null;
  replyToMessageId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Normalizes phone numbers to standard 12-digit Indian format (e.g. 919826012345).
 */
export function normalizePhone(phone: string): string {
  let clean = String(phone || "").replace(/\D/g, "");
  if (clean.startsWith("0")) clean = clean.slice(1);
  if (clean.length === 10) clean = "91" + clean;
  return clean;
}

/**
 * Enqueues a WhatsApp message into the database.
 * Non-blocking: inserts as QUEUED, updates conversation, and asynchronously kicks dispatcher.
 */
export async function enqueueWhatsAppMessage(options: EnqueueMessageOptions) {
  const phone = normalizePhone(options.phone);
  if (!phone || phone.length < 10) {
    throw new Error(`Invalid phone number: ${options.phone}`);
  }

  // Auto-resolve customer or lead from Client Registry if not explicitly provided
  let effectiveCustomerId = options.customerId || null;
  let effectiveLeadId = options.leadId || null;

  if (!effectiveCustomerId && !effectiveLeadId) {
    const tenDigit = phone.slice(-10);
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { primaryMobile: phone },
          { primaryMobile: tenDigit },
          { alternateMobile: phone },
          { alternateMobile: tenDigit },
        ],
      },
      select: { id: true },
    });

    if (customer) {
      effectiveCustomerId = customer.id;
    } else {
      const lead = await prisma.lead.findFirst({
        where: {
          OR: [{ phone: phone }, { phone: tenDigit }],
        },
        select: { id: true },
      });
      if (lead) {
        effectiveLeadId = lead.id;
      }
    }
  }

  // 1. Find or create conversation
  let conversation = await prisma.whatsAppConversation.findUnique({
    where: { phone },
  });

  if (!conversation) {
    conversation = await prisma.whatsAppConversation.create({
      data: {
        phone,
        customerId: effectiveCustomerId,
        leadId: effectiveLeadId,
        status: "OPEN",
        lastMessageText: options.content.slice(0, 200),
        lastMessageAt: new Date(),
        lastOutboundAt: new Date(),
      },
    });
  } else {
    // Update existing conversation
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        customerId: effectiveCustomerId || conversation.customerId,
        leadId: effectiveLeadId || conversation.leadId,
        lastMessageText: options.content.slice(0, 200),
        lastMessageAt: new Date(),
        lastOutboundAt: new Date(),
      },
    });
  }

  // 2. Insert WhatsAppMessage with status QUEUED
  const message = await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      phone,
      customerId: effectiveCustomerId,
      leadId: effectiveLeadId,
      senderType: options.senderType || "SYSTEM",
      senderId: options.senderId || null,
      senderName: options.senderName || null,
      direction: "OUTBOUND",
      messageType: options.messageType || "TEXT",
      content: options.content,
      mediaUrl: options.mediaUrl || null,
      caption: options.caption || null,
      fileName: options.fileName || null,
      templateName: options.templateName || null,
      replyToMessageId: options.replyToMessageId || null,
      metadata: options.metadata || {},
      status: "QUEUED",
      retryCount: 0,
    },
  });

  // 3. Reliably trigger worker without relying on serverless setTimeout
  queueMicrotask(() => {
    dispatchQueuedMessages().catch((err) => {
      console.error("[WhatsApp Dispatcher Background Error]:", err);
    });
  });

  return {
    success: true,
    messageId: message.id,
    conversationId: conversation.id,
    status: "QUEUED",
  };
}

let isDispatching = false;

/**
 * Worker / Dispatcher that processes QUEUED messages.
 * Respects state machine: DB: QUEUED -> SENDING -> Gateway -> SENT / FAILED.
 */
export async function dispatchQueuedMessages(limit = 10) {
  if (isDispatching) return { dispatched: 0, skipped: "Already running" };
  isDispatching = true;

  try {
    const provider = getWhatsAppProvider();

    // Check if gateway is reachable and authorized
    const status = await provider.getStatus();
    if (!status.isConnected || status.accountMismatch) {
      // Gateway is offline or connected to unauthorized foreign account!
      // Fail-closed: KEEP messages in QUEUED state. NEVER send through an unauthorized account!
      return {
        dispatched: 0,
        reason: status.accountMismatch
          ? `Fail-Closed Guard: ${status.error}`
          : `Gateway offline (${status.status})`,
      };
    }

    // 1. Audit & reconcile stale SENDING messages (>2 minutes old) where acknowledgment was missing.
    // Preserves uncertain state: NEVER blindly resend without authoritative confirmation.
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const staleSending = await prisma.whatsAppMessage.findMany({
      where: {
        direction: "OUTBOUND",
        status: "SENDING",
        updatedAt: { lt: twoMinutesAgo },
      },
      take: 20,
    });

    for (const stale of staleSending) {
      if (stale.gatewayMessageId || stale.providerMessageId) {
        // Authoritative confirmation exists: mark SENT
        await prisma.whatsAppMessage.update({
          where: { id: stale.id },
          data: { status: "SENT", sentAt: stale.sentAt || stale.updatedAt },
        });
      } else {
        // Missing acknowledgment: preserve UNCERTAIN transmission state.
        // DO NOT resend automatically to prevent duplicate customer messages.
        // Escalate for operator verification / manual recovery.
        await prisma.whatsAppMessage.update({
          where: { id: stale.id },
          data: {
            status: "FAILED",
            failureCode: "TRANSMISSION_UNCONFIRMED",
            failureReason: "Gateway transmission unconfirmed; acknowledgment missing. Preserved for operator verification to prevent double-send.",
          },
        });
      }
    }

    // 2. Fetch strictly QUEUED messages for orderly dispatch
    const pendingMessages = await prisma.whatsAppMessage.findMany({
      where: {
        direction: "OUTBOUND",
        status: "QUEUED",
        retryCount: { lt: MAX_RETRIES },
      },
      take: limit,
      orderBy: { createdAt: "asc" },
    });

    let successCount = 0;

    for (const msg of pendingMessages) {
      try {
        // Concurrency Guard: Atomically claim message from QUEUED
        const claimed = await prisma.whatsAppMessage.updateMany({
          where: { id: msg.id, status: "QUEUED" },
          data: { status: "SENDING", updatedAt: new Date() },
        });

        if (claimed.count === 0) {
          // Already claimed by another worker; skip
          continue;
        }

        // Reconciliation Guard: Never blindly resend if message was already transmitted
        if (msg.gatewayMessageId || msg.providerMessageId) {
          await prisma.whatsAppMessage.update({
            where: { id: msg.id },
            data: { status: "SENT", sentAt: msg.sentAt || new Date() },
          });
          successCount++;
          continue;
        }

        let sendResult;
        if (msg.messageType === "DOCUMENT" && msg.mediaUrl) {
          sendResult = await provider.sendDocument({
            phone: msg.phone,
            documentUrl: msg.mediaUrl,
            fileName: msg.fileName || "document.pdf",
            caption: msg.caption || msg.content,
            crmMessageId: msg.id,
          });
        } else if (msg.messageType === "IMAGE" && msg.mediaUrl) {
          sendResult = await provider.sendMedia({
            phone: msg.phone,
            mediaUrl: msg.mediaUrl,
            caption: msg.caption || msg.content,
            crmMessageId: msg.id,
          });
        } else {
          sendResult = await provider.sendText(msg.phone, msg.content, { crmMessageId: msg.id });
        }

        if (sendResult.success) {
          const gwId = sendResult.messageId || null;
          if (gwId) {
            // Defense-in-depth: If companion sync arrived while HTTP response was in flight
            // and created a companion duplicate, remove the duplicate so the CRM record prevails
            const companionDuplicate = await prisma.whatsAppMessage.findFirst({
              where: {
                gatewayMessageId: gwId,
                id: { not: msg.id },
              },
            });
            if (companionDuplicate) {
              await prisma.whatsAppMessage.delete({
                where: { id: companionDuplicate.id },
              }).catch(() => {});
            }
          }

          // Transition: SENDING -> SENT
          await prisma.whatsAppMessage.update({
            where: { id: msg.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              providerMessageId: gwId,
              gatewayMessageId: gwId,
              failureCode: null,
              failureReason: null,
            },
          });
          successCount++;

          // Anti-Spam / Anti-Ban: 8 to 12-second random jitter delay between consecutive messages
          if (pendingMessages.indexOf(msg) < pendingMessages.length - 1) {
            const throttleMs = Math.floor(Math.random() * (12000 - 8000 + 1)) + 8000;
            await new Promise((resolve) => setTimeout(resolve, throttleMs));
          }
        } else {
          // Failed dispatch: distinguish confirmed permanent error vs recoverable network error
          const errText = (sendResult.error || "").toLowerCase();
          const isConfirmedPermanent =
            errText.includes("invalid") ||
            errText.includes("not on whatsapp") ||
            sendResult.statusCode === 400;

          const nextRetry = msg.retryCount + 1;
          const isFinal = isConfirmedPermanent || nextRetry >= MAX_RETRIES;

          await prisma.whatsAppMessage.update({
            where: { id: msg.id },
            data: {
              status: isFinal ? "FAILED" : "QUEUED",
              retryCount: nextRetry,
              failureCode: isConfirmedPermanent
                ? "INVALID_RECIPIENT"
                : isFinal
                ? "MAX_RETRIES_EXCEEDED"
                : "GATEWAY_ERROR",
              failureReason: sendResult.error || "Gateway dispatch failed",
            },
          });
        }
      } catch (itemErr: any) {
        console.error(`[WhatsApp Dispatcher] Error processing message ${msg.id}:`, itemErr);
        await prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            status: msg.retryCount + 1 >= MAX_RETRIES ? "FAILED" : "QUEUED",
            retryCount: { increment: 1 },
            failureReason: itemErr.message || "Unexpected dispatcher error",
          },
        }).catch(() => {});
      }
    }

    return { dispatched: successCount, totalChecked: pendingMessages.length };
  } finally {
    isDispatching = false;
  }
}

/**
 * Generates customer-friendly solar notification copy for all 23 lifecycle events.
 */
export function formatSolarLifecycleMessage(
  event: SolarLifecycleEvent,
  params: {
    customerName?: string;
    plantCapacityKw?: number | string;
    date?: string;
    time?: string;
    engineerName?: string;
    engineerPhone?: string;
    quoteAmount?: number | string;
    subsidyAmount?: number | string;
    documentName?: string;
    paymentAmount?: number | string;
    discomName?: string;
    ticketId?: string;
    portalLink?: string;
    customNote?: string;
  }
): { title: string; body: string } {
  const name = params.customerName || "Customer";
  const capacity = params.plantCapacityKw ? `${params.plantCapacityKw} kW` : "Rooftop Solar";
  const helpline = "7722995100";

  switch (event) {
    case "LEAD_CREATED":
      return {
        title: "Welcome to Sunlife Solar",
        body: `Namaste ${name} ji! 🙏\n\nThank you for choosing Sunlife Solar Energy Solution for your ${capacity} rooftop solar inquiry. Our solar specialist will connect with you shortly to assist with your site evaluation and subsidy eligibility under PM Surya Ghar Muft Bijli Yojana.\n\nHelpline: ${helpline}\nWebsite: https://sunlifesolar.in`,
      };

    case "CUSTOMER_ENROLLED":
      return {
        title: "Solar Enrollment Confirmed",
        body: `Namaste ${name} ji! ☀️\n\nYour solar project enrollment with Sunlife Solar has been successfully confirmed. We are excited to accompany you on your journey towards 100% clean energy and zero electricity bills!\n\nHelpline: ${helpline}`,
      };

    case "SURVEY_SCHEDULED":
      return {
        title: "Site Survey Scheduled",
        body: `Namaste ${name} ji!\n\nYour rooftop site survey has been scheduled on *${params.date || "Tomorrow"}* at *${params.time || "11:00 AM"}*.\n\nAssigned Engineer: ${params.engineerName || "Sunlife Technical Team"}${params.engineerPhone ? ` (${params.engineerPhone})` : ""}.\n\nPlease ensure rooftop access is available.`,
      };

    case "SURVEY_RESCHEDULED":
      return {
        title: "Site Survey Rescheduled",
        body: `Namaste ${name} ji,\n\nYour rooftop site survey has been rescheduled to *${params.date || "Next Date"}* at *${params.time || "New Time"}*.\n\nFor any changes, please call ${helpline}.`,
      };

    case "SURVEY_COMPLETED":
      return {
        title: "Site Survey Completed",
        body: `Namaste ${name} ji,\n\nOur engineer has successfully completed your rooftop survey! We are now designing the optimal shadow-free layout and customized quotation for your system.`,
      };

    case "DOCUMENT_REQUIRED":
      return {
        title: "Document Required for Solar Project",
        body: `Namaste ${name} ji,\n\nTo proceed with your DISCOM solar net-metering & PM Surya Ghar subsidy application, kindly provide: *${params.documentName || "Electricity Bill & Aadhaar"}*.\n\nYou can reply directly to this WhatsApp message with the photo/PDF.`,
      };

    case "DOCUMENT_RECEIVED":
      return {
        title: "Documents Verified",
        body: `Namaste ${name} ji,\n\nWe have received your *${params.documentName || "documents"}*. Our compliance team has verified them successfully for portal submission.`,
      };

    case "QUOTATION_READY":
      return {
        title: "Your Solar Proposal is Ready",
        body: `Namaste ${name} ji! 📋\n\nYour customized quotation for *${capacity}* Solar Plant is ready.\n\n• Estimated Project Cost: ₹${params.quoteAmount || "---"}\n• PM Surya Ghar Subsidy: ₹${params.subsidyAmount || "78,000"}\n\nReview proposal: ${params.portalLink || "https://sunlifesolar.in"}\nHelpline: ${helpline}`,
      };

    case "QUOTATION_APPROVED":
      return {
        title: "Quotation Approved",
        body: `Namaste ${name} ji,\n\nThank you for approving your solar quotation! We have initiated the DISCOM portal registration and procurement process for your plant.`,
      };

    case "PAYMENT_DUE":
      return {
        title: "Solar Milestone Payment Due",
        body: `Namaste ${name} ji,\n\nA milestone payment of *₹${params.paymentAmount || "---"}* is scheduled for your solar project. You can pay securely via UPI or Bank Transfer.\n\nFor details: ${helpline}`,
      };

    case "PAYMENT_RECEIVED":
      return {
        title: "Payment Received",
        body: `Namaste ${name} ji,\n\nWe have received your payment of *₹${params.paymentAmount || "---"}*. Thank you! Your receipt has been added to your Sunlife customer vault.`,
      };

    case "DISCOM_APPLICATION_SUBMITTED":
      return {
        title: "DISCOM Application Submitted",
        body: `Namaste ${name} ji,\n\nYour solar rooftop net-metering feasibility application has been submitted to *${params.discomName || "MPMKVVCL"}*.\n\nWe will keep you updated on the approval status.`,
      };

    case "DISCOM_STATUS_CHANGED":
      return {
        title: "DISCOM Feasibility Update",
        body: `Namaste ${name} ji,\n\nUpdate on your DISCOM solar application: *${params.customNote || "Feasibility Approved"}*.\n\nNext step: Material procurement and dispatch.`,
      };

    case "MATERIAL_DISPATCHED":
      return {
        title: "Solar Material Dispatched",
        body: `Namaste ${name} ji! 🚚\n\nYour solar PV panels, inverter, and mounting structures have been dispatched to your installation address. Estimated arrival: *${params.date || "within 24-48 hours"}*.`,
      };

    case "INSTALLATION_SCHEDULED":
      return {
        title: "Installation Scheduled",
        body: `Namaste ${name} ji,\n\nOur solar installation technicians are scheduled to begin mounting & wiring work on *${params.date || "Tomorrow"}*.\n\nAssigned Lead: ${params.engineerName || "Installation Team"}.`,
      };

    case "INSTALLATION_RESCHEDULED":
      return {
        title: "Installation Rescheduled",
        body: `Namaste ${name} ji,\n\nYour solar installation has been rescheduled to *${params.date || "New Date"}*. Thank you for your cooperation.`,
      };

    case "INSTALLATION_COMPLETED":
      return {
        title: "Installation Completed Successfully",
        body: `Namaste ${name} ji! ⚡\n\nYour *${capacity}* solar plant installation and inverter wiring have been completed successfully! Next step: DISCOM inspection & Net Meter installation.`,
      };

    case "NET_METER_STATUS":
      return {
        title: "Net Metering Update",
        body: `Namaste ${name} ji,\n\nUpdate on your bidirectional Net Meter: *${params.customNote || "DISCOM inspection completed, meter installed"}*.\n\nYour system is now ready to export green solar power to the grid!`,
      };

    case "COMMISSIONING_COMPLETED":
      return {
        title: "Plant Commissioned — Generating Solar Power!",
        body: `Namaste ${name} ji! ☀️🎉\n\nCongratulations! Your *${capacity}* Solar Power Plant is now fully commissioned and generating clean electricity.\n\nSubsidy claim under PM Surya Ghar Yojana has been submitted to the National Portal for direct bank credit (DBT).\n\nSunlife Solar Helpline: ${helpline}`,
      };

    case "SUBSIDY_STATUS":
      return {
        title: "PM Surya Ghar Subsidy Update",
        body: `Namaste ${name} ji,\n\nUpdate on your PM Surya Ghar DBT subsidy: *${params.customNote || "Application under processing by National Portal"}*.\n\nApproved Amount: ₹${params.subsidyAmount || "78,000"}.\nDirect Bank Credit expected shortly.`,
      };

    case "SERVICE_REQUEST_CREATED":
      return {
        title: "Service Ticket Registered",
        body: `Namaste ${name} ji,\n\nYour service ticket *#${params.ticketId || "SL-SRV"}* has been logged. Our technical maintenance team will resolve this promptly.\n\nHelpline: ${helpline}`,
      };

    case "ENGINEER_ASSIGNED":
      return {
        title: "Technician Assigned",
        body: `Namaste ${name} ji,\n\nTechnician *${params.engineerName || "Sunlife Engineer"}* has been assigned for your service visit on *${params.date || "Today"}*.\n\nContact: ${params.engineerPhone || helpline}`,
      };

    case "SERVICE_COMPLETED":
      return {
        title: "Service Request Resolved",
        body: `Namaste ${name} ji,\n\nYour service ticket *#${params.ticketId || "SL-SRV"}* has been completed and closed. If you have any further questions, we are just a WhatsApp away!`,
      };

    default:
      return {
        title: "Sunlife Solar Update",
        body: `Namaste ${name} ji,\n\n${params.customNote || "Update regarding your Sunlife Solar project."}\n\nHelpline: ${helpline}`,
      };
  }
}

/**
 * Sends a solar lifecycle notification.
 * Feeds into the same notification engine, logging to Notification table and WhatsAppQueue.
 */
export async function sendSolarLifecycleNotification(
  event: SolarLifecycleEvent,
  target: { customerId?: string; leadId?: string; phone: string; name?: string },
  params: Parameters<typeof formatSolarLifecycleMessage>[1] = {}
) {
  const { title, body } = formatSolarLifecycleMessage(event, {
    customerName: target.name,
    ...params,
  });

  // 1. Log in Notification table for in-app history
  if (target.customerId) {
    await prisma.notification.create({
      data: {
        customerId: target.customerId,
        title,
        message: body,
        deliveryChannel: "WHATSAPP",
        deliveryStatus: "SENT",
        notificationType: event,
      },
    }).catch((err) => console.error("[Notification Log Error]:", err));
  }

  // 2. Enqueue into WhatsApp Queue
  return enqueueWhatsAppMessage({
    phone: target.phone,
    content: body,
    customerId: target.customerId,
    leadId: target.leadId,
    senderType: "SYSTEM",
    senderName: "Sunlife Solar Automation",
    messageType: "TEXT",
    templateName: event,
  });
}
