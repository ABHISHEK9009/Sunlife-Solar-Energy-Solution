const { checkedEnvironment } = require("./with-sunlife-env.cjs");
// Recheck in this process even when invoked directly. Read-only verification.
checkedEnvironment(process.env, null);
const { PrismaClient } = require("../prisma/generated/client");
const prisma = new PrismaClient();
(async () => {
  try {
    const models = ["teamMember", "attendance", "payrollProfile", "employeeAdvance", "monthlyPayroll", "lead", "customer", "solarProject", "siteSurvey", "quotation", "document", "payment", "subsidyRecord", "auditLog", "calculatorEstimate", "serviceTicket", "referral", "plantMonitoring"];
    for (const model of models) {
      await prisma[model].count();
      console.log(`${model}: connected`);
    }
  } catch {
    console.error("Sunlife database verification failed. Check connectivity and schema migrations.");
    process.exitCode = 1;
  } finally { await prisma.$disconnect(); }
})();
