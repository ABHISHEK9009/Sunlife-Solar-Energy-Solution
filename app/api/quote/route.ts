import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      city,
      propertyType,
      monthlyBill,
      interestedSolution,
      rooftopArea,
      message,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone number are required." },
        { status: 400 }
      );
    }

    // Clean Indian phone number
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        city: city || "Narmadapuram",
        propertyType: propertyType || "Residential",
        monthlyBill: monthlyBill || null,
        interestedSolution: interestedSolution || "Rooftop Solar",
        rooftopArea: rooftopArea || null,
        message: message ? message.trim() : null,
        source: "Website Quote Form",
        status: "NEW",
      },
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error: any) {
    console.error("Error creating quote lead:", error);
    return NextResponse.json(
      { error: "Failed to submit quote request. Please try again or call us directly." },
      { status: 500 }
    );
  }
}
