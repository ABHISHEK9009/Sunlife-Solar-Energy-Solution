export interface SolarCalculationInput {
  monthlyBill: number;
  propertyType: "residential" | "commercial" | "industrial";
  city?: string;
  roofAreaSqFt?: number;
}

export interface SolarCalculationResult {
  systemSizeKw: number;
  monthlyUnitsKwh: number;
  annualGenerationKwh: number;
  annualSavingsInr: number;
  approximatePaybackYears: number;
  roofAreaNeededSqFt: number;
  estimatedCo2OffsetTonsYear: number;
  treesEquivalent: number;
  disclaimer: string;
}

export function calculateSolarRequirements(
  input: SolarCalculationInput
): SolarCalculationResult {
  const { monthlyBill, propertyType } = input;

  // Average commercial/residential power tariff in Madhya Pradesh
  let averageTariffPerUnit = 7.5; // INR per kWh for residential
  if (propertyType === "commercial") averageTariffPerUnit = 9.2;
  if (propertyType === "industrial") averageTariffPerUnit = 8.4;

  // Estimated monthly units (kWh)
  const monthlyUnitsKwh = Math.round(monthlyBill / averageTariffPerUnit);
  const dailyUnitsNeeded = monthlyUnitsKwh / 30;

  // In Central India / Madhya Pradesh, 1 kW solar generates ~4.1 units/day (~1,500 units/year)
  const exactKw = dailyUnitsNeeded / 4.1;
  let systemSizeKw = Math.max(1, Math.round(exactKw * 2) / 2); // round to nearest 0.5 kW

  if (propertyType === "residential" && systemSizeKw > 25) {
    systemSizeKw = Math.min(systemSizeKw, 30);
  }

  // Realistic annual generation (kWh)
  const annualGenerationKwh = Math.round(systemSizeKw * 1480);

  // Annual savings (INR) - assuming ~90% self-consumption or net metering offset
  const annualSavingsInr = Math.round(annualGenerationKwh * averageTariffPerUnit * 0.92);

  // Indicative system benchmark price (before any govt subsidy / site customization)
  const benchmarkCostPerKw =
    propertyType === "residential"
      ? 58000
      : propertyType === "commercial"
      ? 52000
      : 48000;
  const estimatedGrossCost = systemSizeKw * benchmarkCostPerKw;

  // Payback period (indicative)
  const approximatePaybackYears =
    annualSavingsInr > 0
      ? Math.max(2.8, Number((estimatedGrossCost / annualSavingsInr).toFixed(1)))
      : 4.5;

  // Rooftop area needed: ~85 sq. ft. per kW for modern high-efficiency mono PERC / TopCon panels
  const roofAreaNeededSqFt = Math.round(systemSizeKw * 85);

  // CO2 offset: ~0.82 kg CO2 per kWh solar generated in India
  const estimatedCo2OffsetTonsYear = Number(
    ((annualGenerationKwh * 0.82) / 1000).toFixed(1)
  );
  const treesEquivalent = Math.round(estimatedCo2OffsetTonsYear * 15);

  return {
    systemSizeKw,
    monthlyUnitsKwh,
    annualGenerationKwh,
    annualSavingsInr,
    approximatePaybackYears,
    roofAreaNeededSqFt,
    estimatedCo2OffsetTonsYear,
    treesEquivalent,
    disclaimer:
      "Indicative estimate for informational purposes. Actual generation and savings depend on roof orientation, shadow analysis, equipment specifications, and local discom net metering rules.",
  };
}
