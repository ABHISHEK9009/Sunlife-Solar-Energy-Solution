// Production Verification Script against https://sunlifesolar.in/api/v1
const PROD_BASE = "https://sunlifesolar.in/api/v1";

const CLIENT_PHONE = "9999900001";
const CLIENT_OTP = "842601";
const AGENT_PHONE = "9999900002";
const AGENT_OTP = "715934";

async function runProductionVerification() {
  console.log("=================================================================");
  console.log("  SUNLIFE SOLAR — LIVE PRODUCTION API VERIFICATION REPORT       ");
  console.log("  Target: " + PROD_BASE);
  console.log("=================================================================\n");

  const results = [];
  function assert(condition, testName, details = "") {
    if (!condition) {
      console.error(`  [FAIL] ${testName} - ${details}`);
      results.push({ testName, pass: false, details });
      throw new Error(`Verification failed: ${testName} - ${details}`);
    }
    console.log(`  [PASS] ${testName}`);
    results.push({ testName, pass: true });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CLIENT DEMO AUTHENTICATION & ASSETS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ TEST SUITE 1: CLIENT DEMO LOGIN & LIVE DATA (9999900001)");

  // 1.1 Send OTP
  const clientSendRes = await fetch(`${PROD_BASE}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: CLIENT_PHONE }),
  });
  const clientSendData = await clientSendRes.json();
  assert(clientSendRes.status === 200 && clientSendData.success, "1.1 Client OTP Request (Send)", JSON.stringify(clientSendData));

  // 1.2 Verify OTP
  const clientVerifyRes = await fetch(`${PROD_BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: CLIENT_PHONE, otp: CLIENT_OTP }),
  });
  const clientVerifyData = await clientVerifyRes.json();
  assert(
    clientVerifyRes.status === 200 &&
    clientVerifyData.accountState === "CUSTOMER" &&
    clientVerifyData.accessToken &&
    clientVerifyData.projects?.length > 0,
    "1.2 Client OTP Verification with dedicated code 842601",
    JSON.stringify(clientVerifyData)
  );

  const clientToken = clientVerifyData.accessToken;
  console.log(`       Client Name: ${clientVerifyData.user.name}`);
  console.log(`       Customer ID: ${clientVerifyData.user.customerId}`);
  console.log(`       Projects   : ${clientVerifyData.projects.length}`);

  // 1.3 Customer Projects Endpoint
  const clientProjectsRes = await fetch(`${PROD_BASE}/customer/projects`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const clientProjectsData = await clientProjectsRes.json();
  assert(
    clientProjectsRes.status === 200 &&
    clientProjectsData.success &&
    clientProjectsData.projects?.length > 0,
    "1.3 Client Solar Projects Endpoint (/customer/projects)",
    `Status ${clientProjectsRes.status}`
  );

  const project = clientProjectsData.projects[0];
  console.log(`       Project: ${project.projectName} (${project.plantCapacityKw} kW)`);
  console.log(`       Status : ${project.projectStatus}`);
  console.log(`       Subsidy: ${project.subsidy?.currentStatus}`);
  console.log(`       Milestones: ${project.timeline?.length}`);

  assert(project.timeline?.length >= 4, "1.4 Project Timeline Milestones Visible to Customer");
  assert(project.subsidy !== null, "1.5 PM Surya Ghar Subsidy Tracking Record Verified");

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. AGENT DEMO AUTHENTICATION & FIELD WORKFLOW
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST SUITE 2: AGENT DEMO LOGIN & LIVE WORKFLOW (9999900002)");

  // 2.1 Send Agent OTP
  const agentSendRes = await fetch(`${PROD_BASE}/auth/agent/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: AGENT_PHONE }),
  });
  const agentSendData = await agentSendRes.json();
  assert(agentSendRes.status === 200 && agentSendData.success, "2.1 Agent OTP Request (Login)", JSON.stringify(agentSendData));

  // 2.2 Verify Agent OTP
  const agentVerifyRes = await fetch(`${PROD_BASE}/auth/agent/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: AGENT_PHONE, otp: AGENT_OTP }),
  });
  const agentVerifyData = await agentVerifyRes.json();
  assert(
    agentVerifyRes.status === 200 &&
    agentVerifyData.agent?.phone === AGENT_PHONE &&
    agentVerifyData.accessToken,
    "2.2 Agent OTP Verification with dedicated code 715934",
    JSON.stringify(agentVerifyData)
  );

  const agentToken = agentVerifyData.accessToken;
  console.log(`       Agent Name : ${agentVerifyData.agent.name}`);
  console.log(`       Employee ID: ${agentVerifyData.agent.employeeId}`);
  console.log(`       Role       : ${agentVerifyData.agent.role}`);

  // 2.3 Agent Assigned Leads
  const agentLeadsRes = await fetch(`${PROD_BASE}/agent/leads`, {
    headers: { Authorization: `Bearer ${agentToken}` },
  });
  const agentLeadsData = await agentLeadsRes.json();
  assert(
    agentLeadsRes.status === 200 &&
    agentLeadsData.success &&
    agentLeadsData.leads?.length > 0,
    "2.3 Agent Assigned Pipeline Leads (/agent/leads)",
    `Found ${agentLeadsData.leads?.length} leads`
  );
  console.log(`       Assigned Leads: ${agentLeadsData.leads.length} leads in pipeline`);

  // 2.4 Agent Site Visits
  const agentVisitsRes = await fetch(`${PROD_BASE}/agent/visits`, {
    headers: { Authorization: `Bearer ${agentToken}` },
  });
  const agentVisitsData = await agentVisitsRes.json();
  assert(
    agentVisitsRes.status === 200 && agentVisitsData.success,
    "2.4 Agent Site Surveys & Inspection Schedule (/agent/visits)",
    `Status ${agentVisitsRes.status}`
  );

  // 2.5 Safe Attendance Punch-In (simulating international reviewer GPS: Mountain View, CA)
  const punchInRes = await fetch(`${PROD_BASE}/agent/attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${agentToken}`,
    },
    body: JSON.stringify({
      action: "punch-in",
      latitude: 37.4220,
      longitude: -122.0841,
      siteName: "Google Play Review Verification Session",
    }),
  });
  const punchInData = await punchInRes.json();
  assert(
    punchInRes.status === 200 && punchInData.success && punchInData.record?.status === "Present",
    "2.5 International Safe Attendance Punch-In (/agent/attendance)",
    JSON.stringify(punchInData)
  );
  console.log(`       Punch-In Time: ${punchInData.record.checkIn}, Site: ${punchInData.record.assignedSite}`);

  // 2.6 Safe Attendance Punch-Out
  const punchOutRes = await fetch(`${PROD_BASE}/agent/attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${agentToken}`,
    },
    body: JSON.stringify({
      action: "punch-out",
      latitude: 37.4220,
      longitude: -122.0841,
    }),
  });
  const punchOutData = await punchOutRes.json();
  assert(
    punchOutRes.status === 200 && punchOutData.success && punchOutData.record?.checkOut !== "--",
    "2.6 International Safe Attendance Punch-Out (/agent/attendance)",
    JSON.stringify(punchOutData)
  );
  console.log(`       Punch-Out Time: ${punchOutData.record.checkOut}, Working Minutes: ${punchOutData.record.workingMinutes}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SECURITY NEGATIVE TESTS & CREDENTIAL ISOLATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST SUITE 3: PRODUCTION SECURITY & CREDENTIAL ISOLATION");

  // 3.1 Client entering deprecated 123456 MUST fail
  const badClient123456 = await fetch(`${PROD_BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: CLIENT_PHONE, otp: "123456" }),
  });
  assert(badClient123456.status === 400, "3.1 Client rejects deprecated 123456 OTP");

  // 3.2 Agent entering deprecated 123456 MUST fail
  const badAgent123456 = await fetch(`${PROD_BASE}/auth/agent/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: AGENT_PHONE, otp: "123456" }),
  });
  assert(badAgent123456.status === 400, "3.2 Agent rejects deprecated 123456 OTP");

  // 3.3 Cross-credential: Client entering Agent OTP 715934 MUST fail
  const clientWithAgentOtp = await fetch(`${PROD_BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: CLIENT_PHONE, otp: AGENT_OTP }),
  });
  assert(clientWithAgentOtp.status === 400, "3.3 Client rejects Agent OTP (715934)");

  // 3.4 Cross-credential: Agent entering Client OTP 842601 MUST fail
  const agentWithClientOtp = await fetch(`${PROD_BASE}/auth/agent/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: AGENT_PHONE, otp: CLIENT_OTP }),
  });
  assert(agentWithClientOtp.status === 400, "3.4 Agent rejects Client OTP (842601)");

  // 3.5 Arbitrary wrong OTP for Client
  const wrongOtpClient = await fetch(`${PROD_BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: CLIENT_PHONE, otp: "999999" }),
  });
  assert(wrongOtpClient.status === 400, "3.5 Client rejects arbitrary wrong OTP (999999)");

  // 3.6 Non-demo customer attempting to use review OTP without SMS dispatch MUST fail
  const normalCustBadOtp = await fetch(`${PROD_BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9876543210", otp: CLIENT_OTP }),
  });
  assert(normalCustBadOtp.status === 400, "3.6 Normal non-demo customer cannot bypass with review OTP");

  // 3.7 Non-demo agent attempting to use review OTP MUST fail
  const normalAgentBadOtp = await fetch(`${PROD_BASE}/auth/agent/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "7722995100", otp: AGENT_OTP }),
  });
  assert(normalAgentBadOtp.status === 400, "3.7 Normal non-demo agent cannot bypass with review OTP");

  // 3.8 Role Isolation: Customer token cannot access Agent endpoints
  const clientTamperAgent = await fetch(`${PROD_BASE}/agent/leads`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert(clientTamperAgent.status === 401, "3.8 Customer token rejected on Agent endpoints (401)");

  // 3.9 Role Isolation: Agent token cannot access Customer endpoints
  const agentTamperCust = await fetch(`${PROD_BASE}/customer/projects`, {
    headers: { Authorization: `Bearer ${agentToken}` },
  });
  assert(agentTamperCust.status === 401, "3.9 Agent token rejected on Customer endpoints (401)");

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. REPEAT LOGINS & SESSION STABILITY (NO LOCKOUTS)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST SUITE 4: REPEAT LOGINS & STABILITY FOR GOOGLE REVIEWERS");

  // 4.1 Client can log in repeatedly without cooldown/lockout
  const clientRepeatRes = await fetch(`${PROD_BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: CLIENT_PHONE, otp: CLIENT_OTP }),
  });
  assert(clientRepeatRes.status === 200, "4.1 Client immediate repeat login succeeds without lockout");

  // 4.2 Agent can log in repeatedly without cooldown/lockout
  const agentRepeatRes = await fetch(`${PROD_BASE}/auth/agent/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: AGENT_PHONE, otp: AGENT_OTP }),
  });
  assert(agentRepeatRes.status === 200, "4.2 Agent immediate repeat login succeeds without lockout");

  console.log("\n=================================================================");
  console.log(`  ALL ${results.length} LIVE PRODUCTION API TESTS PASSED (100%)       `);
  console.log("=================================================================\n");
}

runProductionVerification().catch((err) => {
  console.error("PRODUCTION VERIFICATION FAILED:", err);
  process.exit(1);
});
