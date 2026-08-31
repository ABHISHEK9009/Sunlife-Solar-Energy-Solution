import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      monthlyBill,
      propertyType,
      systemSizeKw,
      annualGenerationKwh,
      annualSavingsInr,
      paybackYears,
      co2OffsetTons,
      name,
      phone,
      city,
    } = body;

    const estimate = await prisma.calculatorEstimate.create({
      data: {
        monthlyBill: Number(monthlyBill) || 0,
        propertyType: propertyType || "residential",
        systemSizeKw: Number(systemSizeKw) || 0,
        annualGenerationKwh: Number(annualGenerationKwh) || 0,
        annualSavingsInr: Number(annualSavingsInr) || 0,
        paybackYears: Number(paybackYears) || 0,
        co2OffsetTons: Number(co2OffsetTons) || 0,
        name: name || null,
        phone: phone || null,
        city: city || "Narmadapuram",
      },
    });

    return NextResponse.json({ success: true, estimateId: estimate.id });
  } catch (error: any) {
    console.error("Error saving calculator estimate:", error);
    return NextResponse.json(
      { error: "Failed to save estimate." },
      { status: 500 }
    );
  }
}
