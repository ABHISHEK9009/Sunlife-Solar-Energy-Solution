import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomerRequest } from "@/lib/crm/auth-otp";

export async function GET(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { customerId: customer.id },
      orderBy: { createdTime: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.readTime).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const customer = await authenticateCustomerRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { customerId: customer.id, readTime: null },
        data: { readTime: new Date() },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId is required." }, { status: 400 });
    }

    const updated = await prisma.notification.update({
      where: {
        id: notificationId,
        customerId: customer.id,
      },
      data: { readTime: new Date() },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 });
  }
}
