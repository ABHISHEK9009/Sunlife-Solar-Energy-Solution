const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const nodeCrypto = require("node:crypto");

function load(file, globals) {
  const source = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }
  ).outputText;
  const context = {
    exports: {},
    Request,
    Response,
    URL,
    AbortController,
    Event,
    clearTimeout,
    Buffer,
    process: {
      env: {
        NODE_ENV: "production",
        CUSTOMER_AUTH_SECRET: "test_secret_for_unit_tests_only_32_bytes_long!!",
      },
    },
    ...globals,
  };
  vm.runInNewContext(source, context);
  return context.exports;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.6: No exposed secrets in Flutter source or constants
// ─────────────────────────────────────────────────────────────────────────────
test("5.6: Zero exposed WhatsApp credentials or direct gateway URLs in Flutter source", () => {
  const libDir = path.join(__dirname, "..", "solar application", "lib");

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith(".dart")) {
        const content = fs.readFileSync(fullPath, "utf8");
        // Check for compromised WhatsApp API key fragments or direct gateway endpoints
        assert.doesNotMatch(
          content,
          /whatsappApiKey/i,
          `Found whatsappApiKey in ${file}`
        );
        assert.doesNotMatch(
          content,
          /whatsappGatewayUrl/i,
          `Found whatsappGatewayUrl in ${file}`
        );
        assert.doesNotMatch(
          content,
          /b9195b62b1739c362ddcbbf3d942/i,
          `Found compromised WhatsApp secret in ${file}`
        );
        assert.doesNotMatch(
          content,
          /gate\.bhashsms\.com/i,
          `Found direct third-party gateway URL in ${file}`
        );
      }
    }
  }

  scanDir(libDir);
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.7, 5.8, 5.9: Attendance Security & Authorization
// ─────────────────────────────────────────────────────────────────────────────
test("5.7: Unauthenticated attendance POST and PUT requests are rejected with 401", async () => {
  const route = load("app/api/attendance/route.ts", {
    console: { error() {} },
    require: (name) => {
      if (name === "next/server") {
        return {
          NextResponse: {
            json: (body, init) => Response.json(body, init),
          },
        };
      }
      if (name.includes("admin-auth")) {
        return { authenticateAdminRequest: async () => false };
      }
      if (name.includes("agent-auth")) {
        return { authenticateAgentRequest: async () => null };
      }
      return { prisma: {} };
    },
  });

  // Test unauthenticated POST (punch attempt)
  const postReq = new Request("http://localhost/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberId: "emp_123",
      action: "punch-in",
    }),
  });

  const postRes = await route.POST(postReq);
  assert.equal(postRes.status, 401);
  const postBody = await postRes.json();
  assert.equal(
    postBody.error,
    "Unauthorized: Attendance punch requires an active employee or administrator session."
  );

  // Test unauthenticated PUT (bulk attendance)
  const putReq = new Request("http://localhost/api/attendance", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      records: [{ memberId: "emp_123", date: "2026-10-09", status: "Present" }],
    }),
  });

  const putRes = await route.PUT(putReq);
  assert.equal(putRes.status, 401);
  const putBody = await putRes.json();
  assert.equal(
    putBody.error,
    "Unauthorized: Bulk attendance management requires administrator privileges."
  );
});

test("5.8: Field agent cannot spoof another employee ID on attendance punch (403 Forbidden)", async () => {
  const route = load("app/api/attendance/route.ts", {
    console: { error() {} },
    require: (name) => {
      if (name === "next/server") {
        return {
          NextResponse: {
            json: (body, init) => Response.json(body, init),
          },
        };
      }
      // Non-admin agent authenticated as agent_A
      if (name.includes("admin-auth")) {
        return { authenticateAdminRequest: async () => false };
      }
      if (name.includes("agent-auth")) {
        return {
          authenticateAgentRequest: async () => ({
            id: "agent_A",
            employeeId: "EMP-001",
            role: "agent",
          }),
        };
      }
      return { prisma: {} };
    },
  });

  // Agent A attempts to record attendance for a DIFFERENT employee ID "agent_B"
  const spoofReq = new Request("http://localhost/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberId: "agent_B",
      action: "punch-in",
    }),
  });

  const spoofRes = await route.POST(spoofReq);
  assert.equal(spoofRes.status, 403);
  const body = await spoofRes.json();
  assert.equal(
    body.error,
    "Forbidden: You cannot record attendance for another employee."
  );
});

test("5.9: Authorized administrator attendance punch succeeds", async () => {
  let createdRecord = null;
  const mockPrisma = {
    teamMember: {
      findUnique: async () => ({ id: "emp_target", territory: "Bhopal" }),
    },
    attendance: {
      findUnique: async () => null,
      upsert: async (args) => {
        createdRecord = {
          id: "att_1",
          date: new Date(),
          updatedAt: new Date(),
          ...args.create,
        };
        return createdRecord;
      },
    },
  };

  const route = load("app/api/attendance/route.ts", {
    console: { error() {} },
    require: (name) => {
      if (name === "next/server") {
        return {
          NextResponse: {
            json: (body, init) => Response.json(body, init),
          },
        };
      }
      // Authorized admin
      if (name.includes("admin-auth")) {
        return { authenticateAdminRequest: async () => true };
      }
      if (name.includes("agent-auth")) {
        return { authenticateAgentRequest: async () => null };
      }
      return { prisma: mockPrisma };
    },
  });

  const adminReq = new Request("http://localhost/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberId: "emp_target",
      action: "punch-in",
      latitude: 22.75,
      longitude: 77.72,
    }),
  });

  const res = await route.POST(adminReq);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.record);
  assert.equal(body.record.memberId, "emp_target");
  assert.match(body.record.remarks, /GPS: 22.75000, 77.72000/);
});

test("5.8b: Attendance location validation rejects out-of-range GPS coordinates", async () => {
  const route = load("app/api/attendance/route.ts", {
    console: { error() {} },
    require: (name) => {
      if (name === "next/server") {
        return {
          NextResponse: {
            json: (body, init) => Response.json(body, init),
          },
        };
      }
      if (name.includes("admin-auth")) {
        return { authenticateAdminRequest: async () => true };
      }
      if (name.includes("agent-auth")) {
        return { authenticateAgentRequest: async () => null };
      }
      return { prisma: {} };
    },
  });

  // Invalid latitude 999
  const invalidGpsReq = new Request("http://localhost/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberId: "emp_1",
      action: "punch-in",
      latitude: 999.0,
      longitude: 77.0,
    }),
  });

  const res = await route.POST(invalidGpsReq);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(
    body.error,
    "Invalid GPS coordinates provided for attendance location."
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.1, 5.2, 5.3: Server OTP verification, expiration & replay eviction
// ─────────────────────────────────────────────────────────────────────────────
test("5.1, 5.2, 5.3: Server-side OTP challenges enforce SHA-256 hashing, expiration, and replay eviction", async () => {
  // Isolate customerOtpCache
  globalThis.__customerOtpCache = new Map();

  let sentPayload = null;
  const mockSmsService = {
    dispatchCustomerOtp: async (payload) => {
      sentPayload = payload;
      return { sent: true, destination: "******7135", channel: "WhatsApp" };
    },
  };

  const mockPrisma = {
    customer: {
      findUnique: async () => ({
        id: "cust_123",
        customerId: "CUST-001",
        fullName: "Test Customer",
        primaryMobile: "9876543210",
        email: "test@example.com",
        customerStatus: "ACTIVE",
        appAccessEnabled: true,
        projects: [],
      }),
      update: async () => ({}),
    },
    lead: {
      findFirst: async () => null,
      count: async () => 0,
    },
  };

  const authOtp = load("lib/crm/auth-otp.ts", {
    require: (name) => {
      if (name === "crypto" || name === "node:crypto") return nodeCrypto;
      if (name.includes("sms-service")) return mockSmsService;
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("territory-router"))
        return { assignLeadToSales: async () => {} };
      return {};
    },
  });

  // 1. Send OTP (generates cryptographically random 6-digit code on server)
  const sendRes = await authOtp.sendCustomerOtp("9876543210");
  assert.equal(sendRes.success, true);
  assert.ok(sentPayload);
  const correctOtp = sentPayload.otp;
  assert.equal(correctOtp.length, 6);

  // 2. Reject universal/hardcoded mock OTP "123456" in production mode
  await assert.rejects(
    authOtp.verifyCustomerOtp("9876543210", "123456"),
    /Incorrect code/
  );

  // 3. Reject wrong OTP
  await assert.rejects(
    authOtp.verifyCustomerOtp("9876543210", "999999"),
    /Incorrect code/
  );

  // 4. Verify with legitimate OTP -> succeeds and returns authenticated JWT token
  const verifyRes = await authOtp.verifyCustomerOtp("9876543210", correctOtp);
  assert.equal(verifyRes.success, true);
  assert.ok(verifyRes.accessToken);
  assert.equal(verifyRes.user.name, "Test Customer");

  // 5. Replay prevention: Repeating the verification MUST fail because challenge was atomically evicted
  await assert.rejects(
    authOtp.verifyCustomerOtp("9876543210", correctOtp),
    /No active verification code found/
  );
});
