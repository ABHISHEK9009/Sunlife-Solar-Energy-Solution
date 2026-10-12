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
  destroySocket,
  calculateBackoffMs,
  getConnectionStatus,
  setConnectionStatus,
  getIsConnecting,
  setIsConnecting,
  getIsIntentionalDisconnect,
  setIsIntentionalDisconnect,
  setQrCodeData,
} = gateway;

const TEST_PORT = 3199;
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

async function runTests() {
  console.log("=================================================");
  console.log("RUNNING STAGE 1 GATEWAY AUTOMATED TESTS");
  console.log("=================================================");

  // TEST 0: Real Gateway Entrypoint Startup using startServer()
  console.log(`[SETUP] Starting real gateway server on port ${TEST_PORT}...`);
  const activeServer = await startServer(TEST_PORT);
  assert.ok(activeServer, "Active HTTP server instance must be returned by startServer()");

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

  // TEST 1: Minimal Public Health Endpoint
  await test("GET /health returns 200 with minimal payload and no leaked uptime or internal metadata", async () => {
    const res = await request("GET", "/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "ok");
    assert.ok(res.body.timestamp, "Timestamp should be present");
    assert.strictEqual(res.body.uptime, undefined, "Uptime must NOT be leaked publicly");
    assert.strictEqual(res.body.service, undefined, "Service name must NOT be leaked publicly");
  });

  // TEST 2: Protected /status Endpoint
  await test("GET /status without API key must reject with 401 Unauthorized", async () => {
    const res = await request("GET", "/status");
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, "Unauthorized. Invalid API Key.");
  });

  await test("GET /status with valid API key must succeed with 200", async () => {
    const res = await request("GET", "/status", { "x-api-key": VALID_KEY });
    assert.strictEqual(res.status, 200);
    assert.ok("isConnected" in res.body);
    assert.ok("status" in res.body);
  });

  // TEST 3: Protected /qr Endpoint
  await test("GET /qr without API key must reject with 401 Unauthorized", async () => {
    const res = await request("GET", "/qr");
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, "Unauthorized. Invalid API Key.");
  });

  await test("GET /qr with valid API key must return 200 and safe QR state", async () => {
    setConnectionStatus("QR_READY");
    setQrCodeData("data:image/png;base64,test_qr");
    const res = await request("GET", "/qr", { "x-api-key": VALID_KEY });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "QR_READY");
    assert.strictEqual(res.body.success, true);
  });

  // TEST 4: Protected Action Endpoints
  await test("POST /send-message without API key must reject with 401", async () => {
    const res = await request("POST", "/send-message", {}, { phone: "919999999999", message: "hi" });
    assert.strictEqual(res.status, 401);
  });

  await test("POST /disconnect with valid API key triggers non-destructive pause without unpairing", async () => {
    const res = await request("POST", "/disconnect", { "x-api-key": VALID_KEY });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(getIsIntentionalDisconnect(), true);
  });

  await test("POST /logout without confirmUnpair: true must reject with 400 guard", async () => {
    const res = await request("POST", "/logout", { "x-api-key": VALID_KEY }, {});
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes("confirmUnpair"));
  });

  await test("POST /logout with confirmUnpair: true revokes without deleting session folder", async () => {
    const sessionsDir = path.join(__dirname, "..", "sessions");
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }
    const markerFile = path.join(sessionsDir, "test-marker.tmp");
    fs.writeFileSync(markerFile, "test-data");

    const res = await request("POST", "/logout", { "x-api-key": VALID_KEY }, { confirmUnpair: true });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(fs.existsSync(sessionsDir), "Sessions directory must NOT be deleted");
    assert.ok(fs.existsSync(markerFile), "Session authentication files must NOT be wiped");

    // Clean up marker file
    if (fs.existsSync(markerFile)) {
      fs.unlinkSync(markerFile);
    }
  });

  // TEST 5: Exponential Backoff & Jitter calculation
  await test("calculateBackoffMs must calculate bounded backoff with jitter", () => {
    const b0 = calculateBackoffMs(0);
    assert.ok(b0 >= 2000 && b0 <= 5000, `Backoff 0 expected 2000..5000, got ${b0}`);

    const b3 = calculateBackoffMs(3);
    assert.ok(b3 >= 6750 && b3 <= 10000, `Backoff 3 expected >=6750, got ${b3}`);

    const b20 = calculateBackoffMs(20);
    assert.ok(b20 <= 48000, `Backoff capped at 48000ms max, got ${b20}`);
  });

  // TEST 6: isConnecting lifecycle guard check
  await test("isConnecting lifecycle state getter/setter functions correctly", () => {
    setIsConnecting(true);
    assert.strictEqual(getIsConnecting(), true);
    setIsConnecting(false);
    assert.strictEqual(getIsConnecting(), false);
  });

  // TEST 7: Socket Lifecycle Teardown
  await test("destroySocket must execute safely without throwing", async () => {
    await destroySocket();
    assert.strictEqual(getConnectionStatus(), "DISCONNECTED");
  });

  // TEARDOWN
  console.log(`[TEARDOWN] Stopping test server...`);
  await stopServer();
  console.log(`[TEARDOWN] Test server closed.`);

  console.log("=================================================");
  console.log(`STAGE 1 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("FATAL TEST SUITE ERROR:", err);
  process.exit(1);
});
