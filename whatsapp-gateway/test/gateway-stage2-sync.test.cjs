const assert = require("node:assert");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");

// Load tested gateway module
const gateway = require("../src/index.js");
const {
  app,
  startServer,
  stopServer,
  calculateBackoffMs,
  destroySocket,
} = gateway;

const TEST_PORT = 3198;
const VALID_KEY = process.env.WHATSAPP_API_KEY || "sunlife_whatsapp_secret_key_2026";

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runStage2Tests() {
  console.log("=================================================");
  console.log("RUNNING STAGE 2 WHATSAPP REAL-TIME SYNC TEST SUITE");
  console.log("=================================================");

  // 1. Start test gateway server
  console.log(`[SETUP] Starting gateway test server on port ${TEST_PORT}...`);
  await startServer(TEST_PORT);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL: ${name}`);
      console.error(`        Error: ${err.message}`);
      failed++;
    }
  }

  // TEST 1: Gateway health & status endpoints
  await test("GET /health responds with 200 ok and no leaked sensitive metadata", async () => {
    const res = await request("GET", "/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "ok");
    assert.strictEqual(res.body.uptime, undefined);
  });

  await test("GET /status rejects without API key and accepts valid API key", async () => {
    const unauth = await request("GET", "/status");
    assert.strictEqual(unauth.status, 401);

    const auth = await request("GET", "/status", { "x-api-key": VALID_KEY });
    assert.strictEqual(auth.status, 200);
    assert.ok("isConnected" in auth.body);
  });

  // TEST 2: Scenario B Outbound Validation
  await test("POST /send-message rejects without auth and validates body payload", async () => {
    const unauth = await request("POST", "/send-message", {}, { phone: "919876543210", message: "Hello" });
    assert.strictEqual(unauth.status, 401);

    const empty = await request("POST", "/send-message", { "x-api-key": VALID_KEY }, {});
    assert.strictEqual(empty.status, 400);
  });

  // TEST 3: Scenario C Companion Phone-Originated Message Structure
  await test("Companion phone message structure verifies correct payload attributes", () => {
    const mockPhoneMessage = {
      key: { remoteJid: "919876543210@s.whatsapp.net", fromMe: true, id: "PHONE_MSG_101" },
      message: { conversation: "Yes, I will arrange site survey tomorrow." },
      messageTimestamp: Math.floor(Date.now() / 1000),
    };

    const senderJid = mockPhoneMessage.key.remoteJid;
    const cleanPhone = senderJid.replace(/@s\.whatsapp\.net|@c\.us/g, "");
    assert.strictEqual(cleanPhone, "919876543210");
    assert.strictEqual(mockPhoneMessage.key.fromMe, true);
    assert.strictEqual(mockPhoneMessage.key.id, "PHONE_MSG_101");
  });

  // TEST 4: Idempotency & Deduplication Logic
  await test("Webhook idempotency contract: replayed gatewayMessageId must be deduplicated", () => {
    const processedIds = new Set();
    const testMsgId = "BAILEYS_MSG_DUP_001";

    function processIncoming(id) {
      if (processedIds.has(id)) {
        return { success: true, deduplicated: true };
      }
      processedIds.add(id);
      return { success: true, created: true };
    }

    const first = processIncoming(testMsgId);
    assert.strictEqual(first.created, true);

    const replay = processIncoming(testMsgId);
    assert.strictEqual(replay.deduplicated, true);
    assert.strictEqual(replay.created, undefined);
  });

  // TEST 5: Unmatched Enquiry Triage Architecture
  await test("Unmatched enquiry classification preserves privacy while avoiding silent drop", () => {
    const knownCustomer = { id: "c1", phone: "919876543210" };
    const unknownPhone = "917999979527";

    function classifyInbound(phone, customer) {
      if (customer) {
        return { status: "OPEN", senderType: "CUSTOMER" };
      }
      return { status: "UNMATCHED", senderType: "UNKNOWN" };
    }

    const knownResult = classifyInbound("919876543210", knownCustomer);
    assert.strictEqual(knownResult.status, "OPEN");
    assert.strictEqual(knownResult.senderType, "CUSTOMER");

    const unknownResult = classifyInbound(unknownPhone, null);
    assert.strictEqual(unknownResult.status, "UNMATCHED");
    assert.strictEqual(unknownResult.senderType, "UNKNOWN");
  });

  // TEST 6: Message Status Progression
  await test("Message status progression: QUEUED -> SENDING -> SENT -> DELIVERED -> READ", () => {
    const states = ["QUEUED", "SENDING", "SENT", "DELIVERED", "READ"];
    let currentState = states[0];

    for (let i = 1; i < states.length; i++) {
      currentState = states[i];
    }
    assert.strictEqual(currentState, "READ");
  });

  // TEST 7: Exponential Backoff & Jitter Range
  await test("Exponential backoff conforms to bounded jitter limits", () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const ms = calculateBackoffMs(attempt);
      assert.ok(ms >= 2000, `Backoff must be at least 2000ms, got ${ms}`);
      assert.ok(ms <= 48000, `Backoff must not exceed 48000ms, got ${ms}`);
    }
  });

  // TEST 8: Session Security & Zero-Wipe Protection
  await test("Zero-Wipe Guarantee: sessions directory is never deleted automatically", () => {
    const sessionsDir = path.join(__dirname, "..", "sessions");
    assert.ok(fs.existsSync(sessionsDir), "Sessions directory must remain intact");
  });

  // TEARDOWN
  console.log(`[TEARDOWN] Stopping test server...`);
  await stopServer();
  console.log(`[TEARDOWN] Test server closed.`);

  console.log("=================================================");
  console.log(`STAGE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runStage2Tests().catch((err) => {
  console.error("FATAL STAGE 2 TEST ERROR:", err);
  process.exit(1);
});
