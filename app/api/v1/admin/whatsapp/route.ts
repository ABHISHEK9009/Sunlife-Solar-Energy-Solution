import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueWhatsAppMessage, normalizePhone } from "@/lib/whatsapp/queue";
import { getWhatsAppProvider } from "@/lib/whatsapp/provider";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "conversations";

    // 1. Gateway Status
    if (action === "gateway_status") {
      const provider = getWhatsAppProvider();
      const status = await provider.getStatus();
      return NextResponse.json(status);
    }

    // 2. Gateway QR Code
    if (action === "gateway_qr") {
      const provider = getWhatsAppProvider();
      const qrData = await provider.getQrCode();
      return NextResponse.json(qrData);
    }

    // 3. Conversation Messages
    if (action === "messages") {
      const conversationId = searchParams.get("conversationId");
      const phoneParam = searchParams.get("phone");

      let whereClause: any = {};
      if (conversationId) {
        whereClause.conversationId = conversationId;
      } else if (phoneParam) {
        whereClause.phone = normalizePhone(phoneParam);
      } else {
        return NextResponse.json({ error: "conversationId or phone is required" }, { status: 400 });
      }

      const messages = await prisma.whatsAppMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ messages });
    }

    // 4. Conversation List
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search")?.trim() || "";
    const assignedToId = searchParams.get("assignedToId");

    // Strict Privacy: Only return conversations belonging to registered clients (Customer or Lead)
    const where: any = {
      AND: [
        {
          OR: [
            { customerId: { not: null } },
            { leadId: { not: null } },
          ],
        },
      ],
    };

    if (filter === "unread") {
      where.unreadCount = { gt: 0 };
    } else if (filter === "open") {
      where.status = "OPEN";
    } else if (filter === "resolved") {
      where.status = "RESOLVED";
    } else if (filter === "unassigned") {
      where.assignedToId = null;
    } else if (filter === "assigned") {
      where.assignedToId = { not: null };
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where.AND.push({
        OR: [
          { phone: { contains: search } },
          { lastMessageText: { contains: search, mode: "insensitive" } },
          { customer: { fullName: { contains: search, mode: "insensitive" } } },
          { customer: { customerId: { contains: search, mode: "insensitive" } } },
          { lead: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    const conversations = await prisma.whatsAppConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            fullName: true,
            primaryMobile: true,
            propertyType: true,
            installationAddress: true,
            projects: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                projectId: true,
                plantCapacityKw: true,
                projectStatus: true,
                discom: true,
                assignedSalesExecutive: { select: { name: true } },
                assignedEngineer: { select: { name: true } },
              },
            },
          },
        },
        lead: {
          select: {
            id: true,
            leadId: true,
            name: true,
            phone: true,
            interestedSolution: true,
            requestedCapacity: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error("[Admin WhatsApp GET Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "send" } = body;

    // 1. Send / Enqueue Message
    if (action === "send") {
      const {
        phone,
        content,
        customerId,
        leadId,
        senderType = "ADMIN",
        senderId,
        senderName = "Sunlife Solar Admin",
        messageType = "TEXT",
        mediaUrl,
        caption,
        fileName,
        templateName,
      } = body;

      if (!phone || (!content && !mediaUrl)) {
        return NextResponse.json({ error: "Phone and content/media are required." }, { status: 400 });
      }

      const result = await enqueueWhatsAppMessage({
        phone,
        content: content || caption || "(Attachment)",
        customerId,
        leadId,
        senderType,
        senderId,
        senderName,
        messageType,
        mediaUrl,
        caption,
        fileName,
        templateName,
      });

      return NextResponse.json(result);
    }

    // 2. Assign Conversation
    if (action === "assign") {
      const { conversationId, assignedToId } = body;
      if (!conversationId) {
        return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
      }

      const updated = await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: {
          assignedToId: assignedToId || null,
          lastHandledById: assignedToId || null,
        },
      });

      return NextResponse.json({ success: true, conversation: updated });
    }

    // 3. Update Conversation Status (OPEN | RESOLVED)
    if (action === "status") {
      const { conversationId, status } = body;
      if (!conversationId || !["OPEN", "RESOLVED"].includes(status)) {
        return NextResponse.json({ error: "Valid conversationId and status required" }, { status: 400 });
      }

      const updated = await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: { status },
      });

      return NextResponse.json({ success: true, conversation: updated });
    }

    // 4. Mark Conversation Messages as Read
    if (action === "mark_read") {
      const { conversationId } = body;
      if (!conversationId) {
        return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
      }

      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
      });

      await prisma.whatsAppMessage.updateMany({
        where: {
          conversationId,
          direction: "INBOUND",
          readAt: null,
        },
        data: {
          status: "READ",
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    // 5. Gateway Logout
    if (action === "gateway_logout") {
      const provider = getWhatsAppProvider();
      const result = await provider.logout();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Admin WhatsApp POST Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}
