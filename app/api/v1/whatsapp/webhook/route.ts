import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/whatsapp/queue";

function safeCompare(a: string | null, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

const STATUS_RANK: Record<string, number> = {
  QUEUED: 1,
  SENDING: 2,
  SENT: 3,
  DELIVERED: 4,
  READ: 5,
  FAILED: 0,
};

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    const expectedSecret = process.env.CRM_WEBHOOK_SECRET || "sunlife_webhook_secret_key_2026";

    if (!safeCompare(secret, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized. Invalid webhook secret." }, { status: 401 });
    }

    const payload = await req.json();
    const {
      event,
      gatewayMessageId,
      crmMessageId,
      phone: rawPhone,
      senderName,
      messageType = "TEXT",
      content = "",
      mediaUrl = null,
      caption = null,
      fileName = null,
      status: incomingStatus,
      timestamp,
    } = payload;

    const msgDate = timestamp ? new Date(timestamp) : new Date();

    // FAIL-CLOSED ACCOUNT ISOLATION SAFEGUARD:
    // Reject any webhook payloads originating from known external business accounts (e.g. Bima Headquarter)
    const BLOCKED_FOREIGN_ACCOUNTS = ["916232003262", "6232003262"];
    const incomingAccount = String(payload.gatewayPhone || payload.accountPhone || "").replace(/\D/g, "");
    if (incomingAccount && BLOCKED_FOREIGN_ACCOUNTS.includes(incomingAccount)) {
      return NextResponse.json(
        { error: "Forbidden: Incoming event belongs to an external business account. Ingestion blocked." },
        { status: 403 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. EVENT: MESSAGE_STATUS_UPDATE (Monotonic Delivery & Read Receipts)
    // ─────────────────────────────────────────────────────────────────────────
    if (event === "MESSAGE_STATUS_UPDATE" && gatewayMessageId) {
      const existing = await prisma.whatsAppMessage.findFirst({
        where: {
          OR: [
            { gatewayMessageId },
            { providerMessageId: gatewayMessageId },
          ],
        },
      });

      if (existing) {
        const currentRank = STATUS_RANK[existing.status] || 0;
        const targetRank = STATUS_RANK[incomingStatus] || 0;

        // Monotonic progression: Never downgrade READ to DELIVERED
        if (targetRank >= currentRank) {
          const updateData: any = { status: incomingStatus };
          if (incomingStatus === "DELIVERED" && !existing.deliveredAt) {
            updateData.deliveredAt = msgDate;
          } else if (incomingStatus === "READ") {
            updateData.readAt = msgDate;
            if (!existing.deliveredAt) updateData.deliveredAt = msgDate;
          }

          await prisma.whatsAppMessage.update({
            where: { id: existing.id },
            data: updateData,
          });
        }
      }

      return NextResponse.json({ success: true, statusUpdate: true });
    }

    if (!rawPhone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone);
    const tenDigit = phone.slice(-10);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. EVENT: SYNC_OUTBOUND_MESSAGE (Companion Linked-Device Sync & Reconciliation)
    // ─────────────────────────────────────────────────────────────────────────
    if (event === "SYNC_OUTBOUND_MESSAGE" || event === "PHONE_OUTBOUND_MESSAGE") {
      // Step A: Check if this message was sent by the CRM dispatcher
      // Direct lookup by durable CRM message ID or authoritative WhatsApp gatewayMessageId
      let crmSent = null;
      if (crmMessageId) {
        crmSent = await prisma.whatsAppMessage.findUnique({
          where: { id: crmMessageId },
        });
      }

      if (!crmSent && gatewayMessageId) {
        crmSent = await prisma.whatsAppMessage.findFirst({
          where: {
            OR: [
              { gatewayMessageId },
              { providerMessageId: gatewayMessageId },
            ],
          },
        });
      }

      if (crmSent) {
        // Reconcile: Already in DB, originated by CRM. Ensure SENT status and gateway ID.
        if (crmSent.status === "QUEUED" || crmSent.status === "SENDING" || !crmSent.gatewayMessageId) {
          await prisma.whatsAppMessage.update({
            where: { id: crmSent.id },
            data: {
              status: "SENT",
              gatewayMessageId: gatewayMessageId || crmSent.gatewayMessageId,
              providerMessageId: gatewayMessageId || crmSent.providerMessageId,
              sentAt: crmSent.sentAt || msgDate,
            },
          });
        }
        return NextResponse.json({
          success: true,
          reconciled: true,
          origin: "CRM",
          messageId: crmSent.id,
          conversationId: crmSent.conversationId,
        });
      }

      // Step B: Not originated by CRM -> Sent directly from primary phone or linked device
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { primaryMobile: phone },
            { primaryMobile: tenDigit },
            { alternateMobile: phone },
            { alternateMobile: tenDigit },
          ],
        },
      });

      const lead = !customer
        ? await prisma.lead.findFirst({
            where: { OR: [{ phone: phone }, { phone: tenDigit }] },
          })
        : null;

      const syncResult = await prisma.$transaction(async (tx) => {
        if (gatewayMessageId) {
          const existingTx = await tx.whatsAppMessage.findFirst({
            where: {
              OR: [
                { gatewayMessageId },
                { providerMessageId: gatewayMessageId },
              ],
            },
          });
          if (existingTx) {
            const conv = await tx.whatsAppConversation.findUnique({ where: { phone } });
            return { conversation: conv, message: existingTx, deduplicated: true };
          }
        }

        let conv = await tx.whatsAppConversation.findUnique({ where: { phone } });
        if (!conv) {
          conv = await tx.whatsAppConversation.create({
            data: {
              phone,
              customerId: customer?.id || null,
              leadId: lead?.id || null,
              status: customer || lead ? "OPEN" : "UNMATCHED",
              unreadCount: 0,
              lastMessageText: (content || caption || "Media sent").slice(0, 200),
              lastMessageAt: msgDate,
              lastOutboundAt: msgDate,
            },
          });
        } else {
          conv = await tx.whatsAppConversation.update({
            where: { id: conv.id },
            data: {
              customerId: customer?.id || conv.customerId,
              leadId: lead?.id || conv.leadId,
              lastMessageText: (content || caption || "Media sent").slice(0, 200),
              lastMessageAt: msgDate,
              lastOutboundAt: msgDate,
            },
          });
        }

        const msg = await tx.whatsAppMessage.create({
          data: {
            conversationId: conv.id,
            gatewayMessageId: gatewayMessageId || null,
            providerMessageId: gatewayMessageId || null,
            customerId: customer?.id || null,
            leadId: lead?.id || null,
            phone,
            senderType: "LINKED_DEVICE",
            senderName: "WhatsApp Account",
            direction: "OUTBOUND",
            messageType,
            content: content || caption || "(Attachment)",
            mediaUrl,
            caption,
            fileName,
            status: "SENT",
            sentAt: msgDate,
          },
        });

        return { conversation: conv, message: msg, deduplicated: false };
      });

      if (syncResult.deduplicated) {
        return NextResponse.json({
          success: true,
          reconciled: true,
          origin: syncResult.message.senderType === "ADMIN" || syncResult.message.senderType === "AGENT" ? "CRM" : "LINKED_DEVICE",
          messageId: syncResult.message.id,
          conversationId: syncResult.conversation?.id || syncResult.message.conversationId,
        });
      }

      return NextResponse.json({
        success: true,
        reconciled: false,
        origin: "LINKED_DEVICE",
        conversationId: syncResult.conversation?.id || syncResult.message.conversationId,
        messageId: syncResult.message.id,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. EVENT: INBOUND_MESSAGE (Customer Message with Strict Privacy Policy)
    // ─────────────────────────────────────────────────────────────────────────
    // DEDUPLICATION: Check if gatewayMessageId has already been persisted
    if (gatewayMessageId) {
      const existing = await prisma.whatsAppMessage.findFirst({
        where: {
          OR: [
            { gatewayMessageId },
            { providerMessageId: gatewayMessageId },
          ],
        },
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          deduplicated: true,
          messageId: existing.id,
          conversationId: existing.conversationId,
        });
      }
    }

    // Look up Client Registry
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { primaryMobile: phone },
          { primaryMobile: tenDigit },
          { alternateMobile: phone },
          { alternateMobile: tenDigit },
        ],
      },
      include: {
        projects: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    let lead = !customer
      ? await prisma.lead.findFirst({
          where: { OR: [{ phone: phone }, { phone: tenDigit }] },
        })
      : null;

    // If sender is neither an existing customer nor lead, auto-enroll as new enquiry lead
    if (!customer && !lead) {
      try {
        const leadCount = await prisma.lead.count();
        const leadCode = `SL-LEAD-${new Date().getFullYear()}-${String(leadCount + 1).padStart(4, "0")}`;
        lead = await prisma.lead.create({
          data: {
            leadId: leadCode,
            name: senderName || "New Applicant",
            phone: phone,
            source: "WhatsApp Inbound",
            leadSource: "WhatsApp Inbound",
            status: "NEW",
            notes: `Enquiry received directly via WhatsApp: "${(content || caption || "").slice(0, 300)}"`,
          },
        });
      } catch (leadCreateErr) {
        console.error("[Auto-create Lead Error]:", leadCreateErr);
      }
    }

    const isClient = Boolean(customer || lead);

    // Transactional Upsert and Insertion with inside-transaction concurrency protection
    const inbResult = await prisma.$transaction(async (tx) => {
      // Concurrency Double-Check: inside transaction lock
      if (gatewayMessageId) {
        const existingTx = await tx.whatsAppMessage.findFirst({
          where: {
            OR: [
              { gatewayMessageId },
              { providerMessageId: gatewayMessageId },
            ],
          },
        });
        if (existingTx) {
          const conv = await tx.whatsAppConversation.findUnique({ where: { phone } });
          return { conversation: conv, message: existingTx, deduplicated: true };
        }
      }

      let conv = await tx.whatsAppConversation.findUnique({ where: { phone } });
      const initialStatus = isClient ? "OPEN" : "QUARANTINED";

      if (!conv) {
        conv = await tx.whatsAppConversation.create({
          data: {
            phone,
            customerId: customer?.id || null,
            leadId: lead?.id || null,
            status: initialStatus,
            unreadCount: 1,
            lastMessageText: (content || caption || "Media attachment").slice(0, 200),
            lastMessageAt: msgDate,
            lastInboundAt: msgDate,
          },
        });
      } else {
        conv = await tx.whatsAppConversation.update({
          where: { id: conv.id },
          data: {
            customerId: customer?.id || conv.customerId,
            leadId: lead?.id || conv.leadId,
            unreadCount: { increment: 1 },
            lastMessageText: (content || caption || "Media attachment").slice(0, 200),
            lastMessageAt: msgDate,
            lastInboundAt: msgDate,
            status: conv.status === "RESOLVED" ? initialStatus : conv.status,
          },
        });
      }

      const msg = await tx.whatsAppMessage.create({
        data: {
          conversationId: conv.id,
          gatewayMessageId: gatewayMessageId || null,
          providerMessageId: gatewayMessageId || null,
          customerId: customer?.id || null,
          leadId: lead?.id || null,
          phone,
          senderType: isClient ? "CUSTOMER" : "UNKNOWN",
          senderName: senderName || customer?.fullName || lead?.name || "Customer",
          direction: "INBOUND",
          messageType,
          content: content || caption || "(Attachment)",
          mediaUrl,
          caption,
          fileName,
          status: "DELIVERED",
          deliveredAt: msgDate,
        },
      });

      return { conversation: conv, message: msg, deduplicated: false };
    });

    if (inbResult.deduplicated) {
      return NextResponse.json({
        success: true,
        deduplicated: true,
        messageId: inbResult.message.id,
        conversationId: inbResult.conversation?.id || inbResult.message.conversationId,
      });
    }

    const { conversation, message } = inbResult;

    // If customer has an active project, append to ProjectTimeline
    const activeProject = customer?.projects?.[0];
    if (activeProject) {
      await prisma.projectTimeline.create({
        data: {
          projectId: activeProject.id,
          eventType: "WHATSAPP_INBOUND",
          eventTitle: "WhatsApp Message from Customer",
          customerDescription: "Customer sent a WhatsApp message.",
          internalDescription: `[Customer WhatsApp Inbound]: ${content || caption || "Attachment received"}`,
          visibleToCustomer: false,
          createdBy: "WHATSAPP_GATEWAY",
        },
      }).catch((err) => console.error("[Timeline Log Error]:", err));
    }

    return NextResponse.json({
      success: true,
      unmatched: !isClient,
      conversationId: conversation?.id || message.conversationId,
      messageId: message.id,
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      // Prisma unique constraint violation (database-level deduplication safety net)
      console.warn("[WhatsApp Webhook] Caught P2002 unique constraint deduplication.");
      return NextResponse.json({
        success: true,
        deduplicated: true,
      });
    }
    console.error("[WhatsApp Webhook Error]:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
