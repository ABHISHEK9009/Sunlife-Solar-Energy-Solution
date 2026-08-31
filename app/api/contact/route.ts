import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, phone, email, city, monthlyBill, requirement, message } =
      body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: "Full Name and Phone Number are required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");

    const inquiry = await prisma.contactInquiry.create({
      data: {
        fullName: fullName.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        city: city || "Narmadapuram",
        monthlyBill: monthlyBill || null,
        requirement: requirement || null,
        message: message ? message.trim() : null,
      },
    });

    // Also register as a lead so it appears in the unified lead dashboard
    await prisma.lead.create({
      data: {
        name: fullName.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        city: city || "Narmadapuram",
        propertyType: requirement || "Contact Form Inquiry",
        monthlyBill: monthlyBill || null,
        message: message ? message.trim() : null,
        source: "Contact Us Page",
        status: "NEW",
      },
    });

    return NextResponse.json({ success: true, inquiryId: inquiry.id });
  } catch (error: any) {
    console.error("Error creating contact inquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please call 7722995100 directly." },
      { status: 500 }
    );
  }
}
