import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/whatsapp/queue";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    const expectedSecret = process.env.CRM_WEBHOOK_SECRET || "sunlife_webhook_secret_key_2026";

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized. Invalid webhook secret." }, { status: 401 });
    }

    const payload = await req.json();
    const {
      event,
      gatewayMessageId,
      phone: rawPhone,
      senderName,
      messageType = "TEXT",
      content = "",
      mediaUrl = null,
      caption = null,
      fileName = null,
    } = payload;

    if (!rawPhone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone);
    const tenDigit = phone.slice(-10);

    // 1. Identify Customer or Lead
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

    const lead = !customer
      ? await prisma.lead.findFirst({
          where: {
            OR: [{ phone: phone }, { phone: tenDigit }],
          },
        })
      : null;

    // PRIVACY FILTER: Only process messages from contacts saved in the Client Registry (Customer or Lead).
    // All personal messages, unknown numbers, friends, and family are completely ignored and never stored in the CRM.
    if (!customer && !lead) {
      console.log(`[WhatsApp Webhook] Ignored non-client personal message from: ${phone}`);
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Sender is not registered in the Client Registry (Customer or Lead). Personal message ignored.",
      });
    }

    // 2. Upsert WhatsApp Conversation (Registered Clients Only)
    let conversation = await prisma.whatsAppConversation.findUnique({
      where: { phone },
    });

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: {
          phone,
          customerId: customer?.id || null,
          leadId: lead?.id || null,
          status: "OPEN",
          unreadCount: 1,
          lastMessageText: (content || caption || "Media attachment").slice(0, 200),
          lastMessageAt: new Date(),
          lastInboundAt: new Date(),
        },
      });
    } else {
      conversation = await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          customerId: customer?.id || conversation.customerId,
          leadId: lead?.id || conversation.leadId,
          unreadCount: { increment: 1 },
          lastMessageText: (content || caption || "Media attachment").slice(0, 200),
          lastMessageAt: new Date(),
          lastInboundAt: new Date(),
          status: "OPEN", // Reopen on customer inbound reply
        },
      });
    }

    // 3. Record Inbound Message
    const message = await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        gatewayMessageId: gatewayMessageId || null,
        providerMessageId: gatewayMessageId || null,
        customerId: customer?.id || null,
        leadId: lead?.id || null,
        phone,
        senderType: "CUSTOMER",
        senderName: senderName || customer?.fullName || lead?.name || "Customer",
        direction: "INBOUND",
        messageType,
        content: content || caption || "(Attachment)",
        mediaUrl,
        caption,
        fileName,
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });

    // 4. If customer has an active project, append to ProjectTimeline
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
      conversationId: conversation.id,
      messageId: message.id,
    });
  } catch (err: any) {
    console.error("[WhatsApp Webhook Error]:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
