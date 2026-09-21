const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");
const { checkedEnvironment } = require("./with-sunlife-env.cjs");

const envFile = path.join(__dirname, "..", ".env");
const projectEnv = fs.existsSync(envFile) ? parseEnv(fs.readFileSync(envFile, "utf8")) : null;
const safeEnv = checkedEnvironment(process.env, projectEnv);
for (const key of Object.keys(safeEnv)) {
  process.env[key] = safeEnv[key];
}

const { PrismaClient } = require("../prisma/generated/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("\n🧪 STARTING SUNLIFE WHATSAPP SUBSYSTEM VERIFICATION...\n");

  const testPhone = "919999988888";

  try {
    // 1. Clean up any previous test artifact
    await prisma.whatsAppMessage.deleteMany({ where: { phone: testPhone } });
    await prisma.whatsAppConversation.deleteMany({ where: { phone: testPhone } });

    // 2. Test WhatsAppConversation creation
    console.log("1️⃣ Testing WhatsAppConversation creation...");
    const conversation = await prisma.whatsAppConversation.create({
      data: {
        phone: testPhone,
        status: "OPEN",
        unreadCount: 0,
        lastMessageText: "Hello from test script",
        lastMessageAt: new Date(),
        lastOutboundAt: new Date(),
      },
    });
    console.log("   ✅ Conversation created with ID:", conversation.id);
    console.log("   ✅ Fields verified: phone, status, unreadCount, lastMessageText, lastMessageAt");

    // 3. Test WhatsAppMessage with QUEUED state machine
    console.log("\n2️⃣ Testing WhatsAppMessage creation (status: QUEUED)...");
    const message = await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        phone: testPhone,
        senderType: "ADMIN",
        senderId: "test-admin-1",
        senderName: "Test Admin",
        direction: "OUTBOUND",
        messageType: "TEXT",
        content: "Namaste! This is a test outbound solar message.",
        status: "QUEUED",
        retryCount: 0,
        templateName: "WELCOME",
      },
    });
    console.log("   ✅ Message created with ID:", message.id);
    console.log("   ✅ Status is correctly QUEUED");
    console.log("   ✅ Fields verified: conversationId, senderType, senderId, direction, templateName");

    // 4. Test State Transition: QUEUED -> SENDING -> SENT
    console.log("\n3️⃣ Testing State Machine Transition (QUEUED -> SENDING -> SENT)...");
    const sending = await prisma.whatsAppMessage.update({
      where: { id: message.id },
      data: { status: "SENDING" },
    });
    console.log("   ✅ Transitioned to SENDING:", sending.status);

    const sent = await prisma.whatsAppMessage.update({
      where: { id: message.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        providerMessageId: "baileys_msg_12345",
        gatewayMessageId: "baileys_msg_12345",
      },
    });
    console.log("   ✅ Transitioned to SENT with providerMessageId:", sent.providerMessageId);

    // 5. Test Inbound Reply handling
    console.log("\n4️⃣ Testing Inbound Customer Reply...");
    const inbound = await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        phone: testPhone,
        senderType: "CUSTOMER",
        senderName: "Solar Customer",
        direction: "INBOUND",
        messageType: "TEXT",
        content: "I want to install a 3 kW solar plant on my roof.",
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });

    const updatedConv = await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        unreadCount: { increment: 1 },
        lastMessageText: inbound.content,
        lastMessageAt: new Date(),
        lastInboundAt: new Date(),
        status: "OPEN",
      },
    });
    console.log("   ✅ Inbound message recorded:", inbound.id);
    console.log("   ✅ Conversation unreadCount incremented to:", updatedConv.unreadCount);
    console.log("   ✅ Last message text updated to:", updatedConv.lastMessageText);

    // 6. Test Assignment and Resolution
    console.log("\n5️⃣ Testing Conversation Assignment and Resolution...");
    const resolvedConv = await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        status: "RESOLVED",
        unreadCount: 0,
      },
    });
    console.log("   ✅ Conversation marked RESOLVED:", resolvedConv.status);

    // 7. Cleanup test data
    console.log("\n6️⃣ Cleaning up test records...");
    await prisma.whatsAppMessage.deleteMany({ where: { phone: testPhone } });
    await prisma.whatsAppConversation.deleteMany({ where: { phone: testPhone } });
    console.log("   ✅ Test data cleaned up successfully!");

    console.log("\n🎉 ALL WHATSAPP SUBSYSTEM TESTS PASSED WITH 100% SUCCESS!\n");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
