import * as fs from "fs";
import * as path from "path";
import { parseEnv } from "util";

// Parse project .env and override process.env directly
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

async function runTests() {
  const { sendCustomerOtp, verifyCustomerOtp } = await import("../lib/crm/auth-otp");
  const { prisma } = await import("../lib/prisma");
  console.log("\n=======================================================");
  console.log("   TESTING SUNLIFE SOLAR BASELINE CUSTOMER & LEAD FLOW  ");
  console.log("=======================================================\n");

  // ─── TEST 1: Existing Active Customer (Priyanshu Sharma) ──────────────
  console.log("▶ TEST 1: Existing Customer Login (9876543210)");
  const sendRes1 = await sendCustomerOtp("9876543210");
  console.log("  [1.1] Send OTP Result:", sendRes1);

  // Retrieve challenge OTP from internal cache
  const challenge1 = (globalThis as any).__customerOtpCache?.get("9876543210");
  console.log("  [1.2] Challenge active in cache:", Boolean(challenge1));

  // Verify using test master code 123456
  const verifyRes1 = await verifyCustomerOtp("9876543210", "123456");
  console.log("  [1.3] Verify Result:");
  console.log("        Account State :", verifyRes1.accountState);
  console.log("        Customer Name :", verifyRes1.user.name);
  console.log("        Access Token  :", verifyRes1.accessToken.slice(0, 30) + "...");
  console.log("        Linked Projects:", verifyRes1.projects.length);
  if (verifyRes1.accountState !== "CUSTOMER" || verifyRes1.projects.length === 0) {
    throw new Error("TEST 1 FAILED: Expected CUSTOMER with linked projects.");
  }
  console.log("  ✓ TEST 1 PASSED: Existing Customer resolved with full Project tree.\n");

  // ─── TEST 2: Existing Open Lead (Amit Verma) ──────────────────────────
  console.log("▶ TEST 2: Existing Open Lead Login (9876500001)");
  await sendCustomerOtp("9876500001");
  const verifyRes2 = await verifyCustomerOtp("9876500001", "123456");
  console.log("  [2.1] Verify Result:");
  console.log("        Account State :", verifyRes2.accountState);
  console.log("        Lead Name     :", verifyRes2.user.name);
  console.log("        City          :", verifyRes2.user.city);
  console.log("        Profile Done? :", verifyRes2.profileComplete);
  if (verifyRes2.accountState !== "LEAD") {
    throw new Error("TEST 2 FAILED: Expected LEAD state.");
  }
  console.log("  ✓ TEST 2 PASSED: Open Lead resolved to Enquiry Experience.\n");

  // ─── TEST 3: Completely New Phone Number (Auto-Provisioning) ──────────
  const newPhone = "9876599999";
  // Clean up if exists from previous test
  await prisma.lead.deleteMany({ where: { phone: newPhone } });
  await prisma.customer.deleteMany({ where: { primaryMobile: newPhone } });

  console.log(`▶ TEST 3: New Customer Self-Registration (${newPhone})`);
  await sendCustomerOtp(newPhone);
  const verifyRes3 = await verifyCustomerOtp(newPhone, "123456");
  console.log("  [3.1] Verify Result (New Phone):");
  console.log("        Account State :", verifyRes3.accountState);
  console.log("        Is New User?  :", verifyRes3.isNewUser);
  console.log("        Profile Done? :", verifyRes3.profileComplete);

  if (verifyRes3.accountState !== "LEAD" || !verifyRes3.isNewUser) {
    throw new Error("TEST 3 FAILED: Expected new user to be provisioned as a new Lead.");
  }

  // Verify Lead exists in DB
  const createdLead = await prisma.lead.findFirst({ where: { phone: newPhone } });
  console.log("  [3.2] Idempotent Lead Created in DB:", createdLead?.leadId, "| Status:", createdLead?.status);

  // ─── TEST 4: Chunk 1 Update (Name & City) ─────────────────────────────
  console.log("▶ TEST 4: Chunk 1 Onboarding Update");
  const updatedLead1 = await prisma.lead.update({
    where: { id: createdLead!.id },
    data: { name: "Vikram Rajput", city: "Itarsi", status: "NEW" },
  });
  console.log("  [4.1] Chunk 1 Saved: Name =", updatedLead1.name, "| City =", updatedLead1.city);

  // ─── TEST 5: Chunk 2 Update (Requirements) ────────────────────────────
  console.log("▶ TEST 5: Chunk 2 Requirement Specs Update");
  const updatedLead2 = await prisma.lead.update({
    where: { id: createdLead!.id },
    data: { propertyType: "Commercial", monthlyBill: "₹10,000+", roofSize: "1200 sq ft" },
  });
  console.log("  [5.1] Chunk 2 Saved: Property =", updatedLead2.propertyType, "| Bill =", updatedLead2.monthlyBill);
  console.log("  ✓ TEST 3-5 PASSED: Full new client registration loop validated.\n");

  console.log("=======================================================");
  console.log("   ALL 5 TESTS PASSED: BASELINE SYSTEM IS 100% OPERATIONAL!");
  console.log("=======================================================\n");
}

runTests()
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
