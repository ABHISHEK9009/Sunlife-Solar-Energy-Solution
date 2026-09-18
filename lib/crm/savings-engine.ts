export interface SavingsInput {
  systemCapacityKw: number;
  electricityTariff?: number; // In INR per unit (kWh), default 7.5
  exportTariff?: number; // In INR per unit (kWh), default 3.25
  monthlyBillBeforeSolar?: number; // In INR
  systemInvestmentCost: number; // Gross project cost in INR
  approvedSubsidy?: number; // Direct financial subsidy in INR
  commissioningDate?: Date | string | null;
  totalGeneratedKwh?: number;
  totalExportedKwh?: number;
}

export interface SavingsOutput {
  systemCapacityKw: number;
  netInvestmentCost: number;
  dailyEstimatedGenerationKwh: number;
  monthlyEstimatedGenerationKwh: number;
  annualEstimatedGenerationKwh: number;
  dailySavingsInr: number;
  monthlySavingsInr: number;
  annualSavingsInr: number;
  lifetime25YearSavingsInr: number;
  totalSavingsToDateInr: number;
  investmentRecoveredInr: number;
  remainingInvestmentInr: number;
  recoveryPercentage: number;
  estimatedPaybackYears: number;
  estimatedPaybackDate: string;
  co2AvoidedTons: number;
  equivalentTreesPlanted: number;
}

/**
 * Standardized Solar Savings Engine
 * Guarantees zero discrepancy between CRM Dashboard and Mobile App
 */
export function calculateSolarSavings(input: SavingsInput): SavingsOutput {
  const tariff = input.electricityTariff && input.electricityTariff > 0 ? input.electricityTariff : 7.5;
  const exportTariff = input.exportTariff && input.exportTariff > 0 ? input.exportTariff : 3.25;
  const capacity = input.systemCapacityKw || 3;
  const subsidy = input.approvedSubsidy || 0;
  const grossCost = input.systemInvestmentCost || capacity * 65000;
  const netCost = Math.max(0, grossCost - subsidy);

  // In Central India / Madhya Pradesh (Narmadapuram), solar insolation yields ~4.2 kWh/kW/day
  const dailyKwh = Math.round(capacity * 4.2 * 100) / 100;
  const monthlyKwh = Math.round(dailyKwh * 30 * 100) / 100;
  const annualKwh = Math.round(dailyKwh * 365 * 100) / 100;

  const dailySavings = Math.round(dailyKwh * tariff);
  const monthlySavings = Math.round(monthlyKwh * tariff);
  const annualSavings = Math.round(annualKwh * tariff);

  // 25-year lifetime savings accounting for nominal 0.7% annual panel degradation
  let lifetimeSavings = 0;
  let yearKwh = annualKwh;
  for (let year = 1; year <= 25; year++) {
    lifetimeSavings += yearKwh * tariff;
    yearKwh *= 0.993; // 0.7% degradation
  }
  const lifetime25YearSavingsInr = Math.round(lifetimeSavings);

  // Actual savings to date from actual telemetry or commissioning date
  let totalGenerated = input.totalGeneratedKwh;
  if (totalGenerated === undefined || totalGenerated === null) {
    if (input.commissioningDate) {
      const commDate = new Date(input.commissioningDate);
      const daysSince = Math.max(0, Math.floor((Date.now() - commDate.getTime()) / (1000 * 60 * 60 * 24)));
      totalGenerated = daysSince * dailyKwh;
    } else {
      totalGenerated = 0;
    }
  }

  const totalExported = input.totalExportedKwh || 0;
  const selfConsumed = Math.max(0, totalGenerated - totalExported);
  const totalSavingsToDate = Math.round(selfConsumed * tariff + totalExported * exportTariff);

  const investmentRecovered = Math.min(netCost, totalSavingsToDate);
  const remainingInvestment = Math.max(0, netCost - totalSavingsToDate);
  const recoveryPercentage = netCost > 0 ? Math.min(100, Math.round((totalSavingsToDate / netCost) * 10000) / 100) : 100;

  const paybackYears = annualSavings > 0 ? Math.round((netCost / annualSavings) * 10) / 10 : 4.5;
  const paybackMs = paybackYears * 365.25 * 24 * 60 * 60 * 1000;
  const startDate = input.commissioningDate ? new Date(input.commissioningDate) : new Date();
  const estimatedPaybackDate = new Date(startDate.getTime() + paybackMs).toISOString().split("T")[0];

  // Environmental Impact: 1 kWh solar = ~0.00082 metric tons CO2 avoided; 1 ton CO2 = ~45 trees planted
  const co2AvoidedTons = Math.round(totalGenerated * 0.00082 * 100) / 100;
  const equivalentTreesPlanted = Math.round(co2AvoidedTons * 45);

  return {
    systemCapacityKw: capacity,
    netInvestmentCost: netCost,
    dailyEstimatedGenerationKwh: dailyKwh,
    monthlyEstimatedGenerationKwh: monthlyKwh,
    annualEstimatedGenerationKwh: annualKwh,
    dailySavingsInr: dailySavings,
    monthlySavingsInr: monthlySavings,
    annualSavingsInr: annualSavings,
    lifetime25YearSavingsInr,
    totalSavingsToDateInr: totalSavingsToDate,
    investmentRecoveredInr: investmentRecovered,
    remainingInvestmentInr: remainingInvestment,
    recoveryPercentage,
    estimatedPaybackYears: paybackYears,
    estimatedPaybackDate,
    co2AvoidedTons,
    equivalentTreesPlanted,
  };
}
