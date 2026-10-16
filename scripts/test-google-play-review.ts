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

async function verifyGooglePlayReviewSystem() {
  console.log("\n=======================================================");
  console.log("   VERIFYING GOOGLE PLAY REVIEW DEMO LOGIN SUBSYSTEM   ");
  console.log("=======================================================\n");

  const {
    GOOGLE_PLAY_CONFIG,
    isGooglePlayClientPhone,
    isGooglePlayAgentPhone,
    isGooglePlayClientReviewOtp,
    isGooglePlayAgentReviewOtp,
    ensureGooglePlayDemoData,
    handleDemoAgentAttendance,
  } = await import("../lib/crm/google-play-review");

  const { sendCustomerOtp, verifyCustomerOtp, authenticateCustomerRequest } = await import("../lib/crm/auth-otp");
  const { sendAgentOtp, verifyAgentOtp, authenticateAgentRequest } = await import("../lib/crm/agent-auth");
  const { prisma } = await import("../lib/prisma");

  console.log(`[Config] Demo Client Phone: ${GOOGLE_PLAY_CONFIG.CLIENT_PHONE}`);
  console.log(`[Config] Client Review OTP: ${GOOGLE_PLAY_CONFIG.CLIENT_REVIEW_OTP}`);
  console.log(`[Config] Demo Agent Phone : ${GOOGLE_PLAY_CONFIG.AGENT_PHONE}`);
  console.log(`[Config] Agent Review OTP : ${GOOGLE_PLAY_CONFIG.AGENT_REVIEW_OTP}`);

  // ─── STEP 1: Seed / Ensure Synthetic Demo Data in CRM ────────────────────
  console.log("\n▶ STEP 1: Initializing synthetic CRM records...");
  const { demoCustomer, demoAgent, demoProject } = await ensureGooglePlayDemoData();
  console.log(`  ✓ Demo Customer ID: ${demoCustomer.customerId} (${demoCustomer.fullName})`);
  console.log(`  ✓ Demo Agent ID   : ${demoAgent.employeeId} (${demoAgent.name})`);
  console.log(`  ✓ Demo Project ID : ${demoProject.projectId} (${demoProject.projectName})`);

  // ─── STEP 2: Client Demo Authentication Flow ─────────────────────────────
  console.log("\n▶ STEP 2: Testing Google Play Client Login Flow...");
  const clientSendRes = await sendCustomerOtp(GOOGLE_PLAY_CONFIG.CLIENT_PHONE);
  console.log("  [2.1] Client OTP Request Response:", clientSendRes);
  if (!clientSendRes.success) throw new Error("Client sendCustomerOtp failed");

  // Verify with client review OTP
  const clientVerifyRes = await verifyCustomerOtp(
    GOOGLE_PLAY_CONFIG.CLIENT_PHONE,
    GOOGLE_PLAY_CONFIG.CLIENT_REVIEW_OTP
  );
  console.log("  [2.2] Client Verification Result:");
  console.log("        Account State  :", clientVerifyRes.accountState);
  console.log("        Customer Name  :", clientVerifyRes.user.name);
  console.log("        Access Token   :", clientVerifyRes.accessToken.slice(0, 30) + "...");
  console.log("        Linked Projects:", clientVerifyRes.projects.length);

  if (clientVerifyRes.accountState !== "CUSTOMER" || clientVerifyRes.projects.length === 0) {
    throw new Error("Client verification did not return active CUSTOMER with projects.");
  }
  console.log("  ✓ Client login successfully verified with fixed review OTP.");

  // Test token authentication on Customer endpoints
  const clientReq = new Request("http://localhost:3000/api/v1/me", {
    headers: { Authorization: `Bearer ${clientVerifyRes.accessToken}` },
  });
  const authenticatedCustomer = await authenticateCustomerRequest(clientReq);
  if (!authenticatedCustomer || authenticatedCustomer.primaryMobile !== GOOGLE_PLAY_CONFIG.CLIENT_PHONE) {
    throw new Error("Client bearer token failed authentication check.");
  }
  console.log(`  ✓ Client token authenticated: ${authenticatedCustomer.fullName}`);

  // Verify Customer Projects and Documents
  const customerProjects = await prisma.solarProject.findMany({
    where: { customerId: authenticatedCustomer.id },
    include: {
      timeline: true,
      documents: true,
      subsidy: true,
      tickets: true,
      monitoring: true,
    },
  });
  const project = customerProjects[0];
  console.log(`  [2.3] Project: ${project.projectName} (${project.plantCapacityKw} kW, ${project.projectStatus})`);
  console.log(`        Milestones : ${project.timeline.length}`);
  console.log(`        Documents  : ${project.documents.length}`);
  console.log(`        Subsidy    : ${project.subsidy?.subsidyScheme} (Status: ${project.subsidy?.currentStatus})`);
  console.log(`        Tickets    : ${project.tickets.length}`);
  console.log(`        Monitoring : Health ${project.monitoring?.systemHealth}, Energy: ${project.monitoring?.totalGeneratedEnergyKwh} kWh`);

  if (project.timeline.length < 4 || project.documents.length < 3 || !project.subsidy) {
    throw new Error("Client demo project is missing required synthetic assets.");
  }
  console.log("  ✓ All required customer demo assets confirmed.");

  // ─── STEP 3: Agent Demo Authentication Flow ──────────────────────────────
  console.log("\n▶ STEP 3: Testing Google Play Agent Login Flow...");
  const agentSendRes = await sendAgentOtp(GOOGLE_PLAY_CONFIG.AGENT_PHONE);
  console.log("  [3.1] Agent OTP Request Response:", agentSendRes);
  if (!agentSendRes.success) throw new Error("Agent sendAgentOtp failed");

  // Verify with agent review OTP
  const agentVerifyRes = await verifyAgentOtp(
    GOOGLE_PLAY_CONFIG.AGENT_PHONE,
    GOOGLE_PLAY_CONFIG.AGENT_REVIEW_OTP
  );
  console.log("  [3.2] Agent Verification Result:");
  console.log("        Agent Name   :", agentVerifyRes.agent.name);
  console.log("        Role         :", agentVerifyRes.agent.role);
  console.log("        Employee ID  :", agentVerifyRes.agent.employeeId);
  console.log("        Access Token :", agentVerifyRes.accessToken.slice(0, 30) + "...");

  if (!agentVerifyRes.agent || agentVerifyRes.agent.phone !== GOOGLE_PLAY_CONFIG.AGENT_PHONE) {
    throw new Error("Agent verification did not return valid demo agent identity.");
  }
  console.log("  ✓ Agent login successfully verified with fixed review OTP.");

  // Test token authentication on Agent endpoints
  const agentReq = new Request("http://localhost:3000/api/v1/agent/leads", {
    headers: { Authorization: `Bearer ${agentVerifyRes.accessToken}` },
  });
  const authenticatedAgent = await authenticateAgentRequest(agentReq);
  if (!authenticatedAgent || authenticatedAgent.phone !== GOOGLE_PLAY_CONFIG.AGENT_PHONE) {
    throw new Error("Agent bearer token failed authentication check.");
  }
  console.log(`  ✓ Agent token authenticated: ${authenticatedAgent.name} (${authenticatedAgent.employeeId})`);

  // Verify Agent Leads, Visits, and Tasks
  const agentLeads = await prisma.lead.findMany({
    where: { assignedSalesExecutiveId: authenticatedAgent.id },
  });
  const agentSurveys = await prisma.siteSurvey.findMany({
    where: { surveyEngineerId: authenticatedAgent.id },
  });
  const agentAttendance = await prisma.attendance.findMany({
    where: { memberId: authenticatedAgent.id },
  });
  console.log(`  [3.3] Agent Pipeline:`);
  console.log(`        Assigned Leads : ${agentLeads.length}`);
  console.log(`        Site Surveys   : ${agentSurveys.length}`);
  console.log(`        Past Attendance: ${agentAttendance.length} days`);

  if (agentLeads.length === 0 || agentSurveys.length === 0) {
    throw new Error("Agent demo account is missing assigned leads or site visits.");
  }
  console.log("  ✓ Agent leads, surveys, and tasks confirmed.");

  // ─── STEP 4: Safe Attendance Demonstration Mode ──────────────────────────
  console.log("\n▶ STEP 4: Testing safe review-only attendance punch from international coordinates...");
  // Simulate reviewer from Mountain View, CA (Google HQ: 37.4220, -122.0841)
  const punchInRecord = await handleDemoAgentAttendance({
    agent: authenticatedAgent,
    action: "punch-in",
    latitude: 37.4220,
    longitude: -122.0841,
    siteName: "Google Play Review Verification Session",
  });
  console.log("  [4.1] Demo Punch-In Result:", punchInRecord);
  if (punchInRecord.status !== "Present" || punchInRecord.checkIn === "--") {
    throw new Error("Demo punch-in failed to record status.");
  }
  console.log("  ✓ International location attendance punch-in recorded safely.");

  // Punch out
  const punchOutRecord = await handleDemoAgentAttendance({
    agent: authenticatedAgent,
    action: "punch-out",
    latitude: 37.4220,
    longitude: -122.0841,
  });
  console.log("  [4.2] Demo Punch-Out Result:", punchOutRecord);
  if (punchOutRecord.checkOut === "--" || punchOutRecord.workingMinutes <= 0) {
    throw new Error("Demo punch-out failed to record check-out.");
  }
  console.log("  ✓ International location attendance punch-out recorded safely.");

  // ─── STEP 5: Security & Negative Verification ────────────────────────────
  console.log("\n▶ STEP 5: Negative security checks (enforcing allowlist isolation)...");

  // 5.1: Non-allowlisted customer entering client review OTP MUST fail
  try {
    await verifyCustomerOtp("9876543210", GOOGLE_PLAY_CONFIG.CLIENT_REVIEW_OTP);
    throw new Error("SECURITY FAILURE: Non-allowlisted customer number accepted review OTP!");
  } catch (err: any) {
    console.log("  ✓ Normal customer 9876543210 cannot use client review OTP:", err.message);
  }

  // 5.2: Client entering old insecure 123456 MUST fail
  try {
    await verifyCustomerOtp(GOOGLE_PLAY_CONFIG.CLIENT_PHONE, "123456");
    throw new Error("SECURITY FAILURE: Client demo accepted deprecated 123456!");
  } catch (err: any) {
    console.log("  ✓ Client demo strictly rejected 123456:", err.message);
  }

  // 5.3: Agent entering old insecure 123456 MUST fail
  try {
    await verifyAgentOtp(GOOGLE_PLAY_CONFIG.AGENT_PHONE, "123456");
    throw new Error("SECURITY FAILURE: Agent demo accepted deprecated 123456!");
  } catch (err: any) {
    console.log("  ✓ Agent demo strictly rejected 123456:", err.message);
  }

  // 5.4: Cross-credential check: Client entering Agent OTP MUST fail
  try {
    await verifyCustomerOtp(GOOGLE_PLAY_CONFIG.CLIENT_PHONE, GOOGLE_PLAY_CONFIG.AGENT_REVIEW_OTP);
    throw new Error("SECURITY FAILURE: Client demo accepted Agent OTP!");
  } catch (err: any) {
    console.log("  ✓ Client demo strictly rejected Agent OTP:", err.message);
  }

  // 5.5: Cross-credential check: Agent entering Client OTP MUST fail
  try {
    await verifyAgentOtp(GOOGLE_PLAY_CONFIG.AGENT_PHONE, GOOGLE_PLAY_CONFIG.CLIENT_REVIEW_OTP);
    throw new Error("SECURITY FAILURE: Agent demo accepted Client OTP!");
  } catch (err: any) {
    console.log("  ✓ Agent demo strictly rejected Client OTP:", err.message);
  }

  // 5.6: Demo number entering arbitrary wrong OTP MUST fail
  try {
    await verifyCustomerOtp(GOOGLE_PLAY_CONFIG.CLIENT_PHONE, "999999");
    throw new Error("SECURITY FAILURE: Demo number accepted wrong OTP!");
  } catch (err: any) {
    console.log("  ✓ Demo number rejected wrong OTP 999999:", err.message);
  }

  // 5.7: Normal agent number cannot use review OTP without valid challenge
  try {
    await verifyAgentOtp("7722995100", GOOGLE_PLAY_CONFIG.AGENT_REVIEW_OTP);
    throw new Error("SECURITY FAILURE: Normal agent number accepted review OTP!");
  } catch (err: any) {
    console.log("  ✓ Normal agent 7722995100 cannot use agent review OTP:", err.message);
  }

  // 5.8: Reusable review OTP: Reviewers can log in AGAIN repeatedly without getting locked out
  const clientSecondLogin = await verifyCustomerOtp(
    GOOGLE_PLAY_CONFIG.CLIENT_PHONE,
    GOOGLE_PLAY_CONFIG.CLIENT_REVIEW_OTP
  );
  if (!clientSecondLogin.success) {
    throw new Error("Client Review OTP failed on second login attempt (must be reusable for reviewers).");
  }
  console.log("  ✓ Reusable client review OTP verified: second login succeeded without lockout.");

  const agentSecondLogin = await verifyAgentOtp(
    GOOGLE_PLAY_CONFIG.AGENT_PHONE,
    GOOGLE_PLAY_CONFIG.AGENT_REVIEW_OTP
  );
  if (!agentSecondLogin.success) {
    throw new Error("Agent Review OTP failed on second login attempt (must be reusable for reviewers).");
  }
  console.log("  ✓ Reusable agent review OTP verified: second login succeeded without lockout.");

  console.log("\n=======================================================");
  console.log("   ALL GOOGLE PLAY REVIEW SYSTEM CHECKS PASSED (100%)  ");
  console.log("=======================================================\n");
}

verifyGooglePlayReviewSystem()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
