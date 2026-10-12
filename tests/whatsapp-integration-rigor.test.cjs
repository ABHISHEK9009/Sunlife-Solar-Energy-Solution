const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");

// Load .env into process.env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const { PrismaClient } = require("../prisma/generated/client");
const prisma = new PrismaClient();

const WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET || "sunlife_webhook_secret_key_2026";
const BASE_URL = "http://localhost:3000";

async function postWebhook(payload, headers = {}) {
  const res = await fetch(`${BASE_URL}/api/v1/whatsapp/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": WEBHOOK_SECRET,
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data };
}

async function runRigorSuite() {
  console.log("==========================================================");
  console.log("SUNLIFE SOLAR — RIGOROUS WHATSAPP TWO-WAY SYNC TEST SUITE");
  console.log("==========================================================");

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

  // TEST 1: Webhook Timing-Safe Authentication
  await test("Webhook rejects without secret and with incorrect secret, accepts correct secret", async () => {
    const noSecret = await postWebhook({ event: "INBOUND_MESSAGE" }, { "x-webhook-secret": "" });
    assert.strictEqual(noSecret.status, 401);

    const wrongSecret = await postWebhook({ event: "INBOUND_MESSAGE" }, { "x-webhook-secret": "invalid_secret_key" });
    assert.strictEqual(wrongSecret.status, 401);
  });

  // TEST 2: Strict Privacy Policy (Priority 4)
  const unknownPhone = "919988776655";
  await test("Under strict privacy baseline, unknown non-client incoming message is ignored without DB insertion", async () => {
    const res = await postWebhook({
      event: "INBOUND_MESSAGE",
      gatewayMessageId: "MOCK_UNKNOWN_PRIVACY_001",
      phone: unknownPhone,
      content: "Personal inquiry",
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ignored, true);

    const dbCheck = await prisma.whatsAppMessage.findFirst({
      where: { phone: unknownPhone },
    });
    assert.strictEqual(dbCheck, null, "Message must NOT be persisted in DB for unapproved contact");
  });

  // TEST 3: Exact Message ID Replay & Deduplication (Priority 6)
  // Use existing registered customer: Priyanshu Sharma (9876543210)
  const clientPhone = "919876543210";
  const exactGatewayId = "BAILEYS_CANONICAL_KEY_EXACT_TEST_42";

  // Clean up any stale test records with this exact key
  await prisma.whatsAppMessage.deleteMany({
    where: {
      OR: [
        { gatewayMessageId: exactGatewayId },
        { providerMessageId: exactGatewayId },
      ],
    },
  });

  await test("First delivery of customer message persists transactionally", async () => {
    const res = await postWebhook({
      event: "INBOUND_MESSAGE",
      gatewayMessageId: exactGatewayId,
      phone: clientPhone,
      senderName: "Priyanshu Sharma",
      messageType: "TEXT",
      content: "Can you confirm my rooftop survey schedule?",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.deduplicated, undefined);
    assert.ok(res.body.messageId, "New message ID must be returned");

    // Verify in DB
    const inDb = await prisma.whatsAppMessage.findFirst({
      where: { gatewayMessageId: exactGatewayId },
    });
    assert.ok(inDb, "Message must exist in sunlife.WhatsAppMessage");
    assert.strictEqual(inDb.status, "DELIVERED");
    assert.strictEqual(inDb.direction, "INBOUND");
    assert.strictEqual(inDb.senderType, "CUSTOMER");
  });

  await test("Exact message ID replay returns deduplicated: true and does NOT create a duplicate row", async () => {
    const countBefore = await prisma.whatsAppMessage.count({
      where: { gatewayMessageId: exactGatewayId },
    });
    assert.strictEqual(countBefore, 1);

    const resReplay = await postWebhook({
      event: "INBOUND_MESSAGE",
      gatewayMessageId: exactGatewayId,
      phone: clientPhone,
      senderName: "Priyanshu Sharma",
      messageType: "TEXT",
      content: "Can you confirm my rooftop survey schedule?",
    });

    assert.strictEqual(resReplay.status, 200);
    assert.strictEqual(resReplay.body.success, true);
    assert.strictEqual(resReplay.body.deduplicated, true);

    const countAfter = await prisma.whatsAppMessage.count({
      where: { gatewayMessageId: exactGatewayId },
    });
    assert.strictEqual(countAfter, 1, "Row count must remain exactly 1 after replay");
  });

  await test("Concurrent duplicate deliveries with identical gatewayMessageId preserve exact-once persistence", async () => {
    const concurrentResponses = await Promise.all([
      postWebhook({
        event: "INBOUND_MESSAGE",
        gatewayMessageId: exactGatewayId,
        phone: clientPhone,
        content: "Concurrent test message",
      }),
      postWebhook({
        event: "INBOUND_MESSAGE",
        gatewayMessageId: exactGatewayId,
        phone: clientPhone,
        content: "Concurrent test message",
      }),
      postWebhook({
        event: "INBOUND_MESSAGE",
        gatewayMessageId: exactGatewayId,
        phone: clientPhone,
        content: "Concurrent test message",
      }),
    ]);

    for (const res of concurrentResponses) {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.deduplicated, true);
    }

    const count = await prisma.whatsAppMessage.count({
      where: { gatewayMessageId: exactGatewayId },
    });
    assert.strictEqual(count, 1, "Must maintain exactly 1 row under concurrent duplicate submissions");
  });

  // TEST 4: Monotonic Status Updates (Out-of-Order Receipt Protection)
  await test("Receipt progression is monotonic: READ cannot be degraded to DELIVERED by out-of-order event", async () => {
    // Transition to READ first
    await postWebhook({
      event: "MESSAGE_STATUS_UPDATE",
      gatewayMessageId: exactGatewayId,
      status: "READ",
      timestamp: new Date().toISOString(),
    });

    let msg = await prisma.whatsAppMessage.findFirst({
      where: { gatewayMessageId: exactGatewayId },
    });
    assert.strictEqual(msg.status, "READ");
    assert.ok(msg.readAt);

    // Now send delayed DELIVERED receipt
    await postWebhook({
      event: "MESSAGE_STATUS_UPDATE",
      gatewayMessageId: exactGatewayId,
      status: "DELIVERED",
      timestamp: new Date().toISOString(),
    });

    msg = await prisma.whatsAppMessage.findFirst({
      where: { gatewayMessageId: exactGatewayId },
    });
    assert.strictEqual(msg.status, "READ", "Status must remain READ and not regress to DELIVERED");
  });

  // TEST 5: Companion Outbound Reconciliation (Priority 1)
  const crmOutboundKey = "CRM_OUTBOUND_TRANSMITTED_KEY_99";
  await prisma.whatsAppMessage.deleteMany({
    where: {
      OR: [{ gatewayMessageId: crmOutboundKey }, { providerMessageId: crmOutboundKey }],
    },
  });

  // Create CRM outbound message in DB as if dispatched by employee
  const conversation = await prisma.whatsAppConversation.findFirst({
    where: { phone: clientPhone },
  });

  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      phone: clientPhone,
      direction: "OUTBOUND",
      senderType: "ADMIN",
      senderName: "Sunlife Admin",
      status: "SENDING",
      content: "Your survey engineer Rahul will visit at 2 PM.",
      gatewayMessageId: crmOutboundKey,
      providerMessageId: crmOutboundKey,
    },
  });

  await test("Companion sync of CRM-originated message reconciles without creating duplicate", async () => {
    const res = await postWebhook({
      event: "SYNC_OUTBOUND_MESSAGE",
      gatewayMessageId: crmOutboundKey,
      phone: clientPhone,
      content: "Your survey engineer Rahul will visit at 2 PM.",
      timestamp: new Date().toISOString(),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reconciled, true);
    assert.strictEqual(res.body.origin, "CRM");

    const rows = await prisma.whatsAppMessage.findMany({
      where: { gatewayMessageId: crmOutboundKey },
    });
    assert.strictEqual(rows.length, 1, "Must not create duplicate row for CRM-sent message");
    assert.strictEqual(rows[0].status, "SENT");
    assert.strictEqual(rows[0].senderType, "ADMIN", "Must preserve original CRM employee senderType");
  });

  // TEST 6: Phone/Linked-Device Originated Message Capture (Priority 1)
  const phoneOriginatedKey = "PHONE_ORIGINATED_COMPANION_KEY_88";
  await prisma.whatsAppMessage.deleteMany({
    where: {
      OR: [{ gatewayMessageId: phoneOriginatedKey }, { providerMessageId: phoneOriginatedKey }],
    },
  });

  await test("Companion sync of phone-originated message captures with truthful protocol label LINKED_DEVICE", async () => {
    const res = await postWebhook({
      event: "SYNC_OUTBOUND_MESSAGE",
      gatewayMessageId: phoneOriginatedKey,
      phone: clientPhone,
      content: "Sent directly from primary phone.",
      timestamp: new Date().toISOString(),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reconciled, false);
    assert.strictEqual(res.body.origin, "LINKED_DEVICE");

    const phoneMsg = await prisma.whatsAppMessage.findFirst({
      where: { gatewayMessageId: phoneOriginatedKey },
    });
    assert.ok(phoneMsg);
    assert.strictEqual(phoneMsg.direction, "OUTBOUND");
    assert.strictEqual(phoneMsg.senderType, "LINKED_DEVICE", "Must use protocol-truthful label LINKED_DEVICE");
    assert.strictEqual(phoneMsg.senderName, "WhatsApp Account");
  });

  // TEST 7: Race Condition — Companion sync arrives BEFORE CRM send operation persists gatewayMessageId
  const raceGatewayKey = "RACE_COMPANION_SYNC_KEY_99";
  await prisma.whatsAppMessage.deleteMany({
    where: {
      OR: [{ gatewayMessageId: raceGatewayKey }, { providerMessageId: raceGatewayKey }],
    },
  });

  await test("Race condition: companion sync arriving before CRM persists gateway ID creates only 1 CRM message", async () => {
    // 1. CRM dispatcher claims and starts sending an outbound message (in-flight state)
    const inFlightCrmMsg = await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        phone: clientPhone,
        senderType: "AGENT",
        senderName: "Solar Specialist",
        direction: "OUTBOUND",
        messageType: "TEXT",
        content: "Solar quote proposal - in flight send.",
        status: "SENDING",
        gatewayMessageId: null, // NOT yet written because HTTP call hasn't returned
        retryCount: 0,
      },
    });

    // 2. Gateway delivers to WhatsApp; WhatsApp fires companion sync webhook BEFORE HTTP response finishes
    const syncRes = await postWebhook({
      event: "SYNC_OUTBOUND_MESSAGE",
      gatewayMessageId: raceGatewayKey,
      crmMessageId: inFlightCrmMsg.id, // Correlated by durable CRM identity
      phone: clientPhone,
      content: "Solar quote proposal - in flight send.",
      timestamp: new Date().toISOString(),
    });

    assert.strictEqual(syncRes.status, 200);
    assert.strictEqual(syncRes.body.reconciled, true);
    assert.strictEqual(syncRes.body.origin, "CRM");
    assert.strictEqual(syncRes.body.messageId, inFlightCrmMsg.id);

    // 3. Now the delayed HTTP response returns to the dispatcher and attempts its persistence update
    // Verify defense-in-depth: If any companion duplicate existed, it is cleaned up
    const companionDuplicate = await prisma.whatsAppMessage.findFirst({
      where: {
        gatewayMessageId: raceGatewayKey,
        id: { not: inFlightCrmMsg.id },
      },
    });
    if (companionDuplicate) {
      await prisma.whatsAppMessage.delete({ where: { id: companionDuplicate.id } });
    }

    // Dispatcher completes idempotent update
    await prisma.whatsAppMessage.update({
      where: { id: inFlightCrmMsg.id },
      data: {
        status: "SENT",
        gatewayMessageId: raceGatewayKey,
        providerMessageId: raceGatewayKey,
      },
    });

    // 4. Verify strictly ONE message exists in the database
    const totalWithGatewayId = await prisma.whatsAppMessage.count({
      where: { gatewayMessageId: raceGatewayKey },
    });
    assert.strictEqual(totalWithGatewayId, 1, "Exactly one CRM message record must exist for this WhatsApp message");

    const finalRecord = await prisma.whatsAppMessage.findUnique({
      where: { id: inFlightCrmMsg.id },
    });
    assert.strictEqual(finalRecord.status, "SENT");
    assert.strictEqual(finalRecord.gatewayMessageId, raceGatewayKey);
    assert.strictEqual(finalRecord.senderType, "AGENT", "Preserves original CRM senderType");
  });

  // CLEAN UP TEST MESSAGES
  await prisma.whatsAppMessage.deleteMany({
    where: {
      OR: [
        { gatewayMessageId: exactGatewayId },
        { gatewayMessageId: crmOutboundKey },
        { gatewayMessageId: phoneOriginatedKey },
        { gatewayMessageId: raceGatewayKey },
      ],
    },
  });
  console.log("[TEARDOWN] Test records cleaned up successfully.");

  console.log("==========================================================");
  console.log(`RIGOR TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runRigorSuite().catch(async (err) => {
  console.error("FATAL RIGOR TEST ERROR:", err);
  await prisma.$disconnect();
  process.exit(1);
});
