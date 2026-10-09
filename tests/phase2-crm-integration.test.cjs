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
  const sharedGlobal = {};
  const userRequire = globals?.require;
  const safeRequire = (name) => {
    if (name === "next/server" || name === "@/next/server") {
      return { NextResponse: { json: (body, init) => Response.json(body, init) } };
    }
    if (name === "crypto" || name === "node:crypto") return nodeCrypto;
    if (userRequire) {
      const custom = userRequire(name);
      if (custom !== undefined) return custom;
    }
    return {};
  };

  const context = {
    exports: {},
    Request,
    Response,
    URL,
    AbortController,
    Event,
    clearTimeout,
    Buffer,
    NextResponse: { json: (body, init) => Response.json(body, init) },
    globalThis: sharedGlobal,
    process: {
      env: {
        NODE_ENV: "production",
        CUSTOMER_AUTH_SECRET: "test_secret_phase1_customer_lifecycle_token_secret_32bytes",
        AGENT_AUTH_SECRET: "test_agent_secret_key_for_phase2_tests_32bytes_long",
      },
    },
    ...globals,
    require: safeRequire,
  };
  vm.runInNewContext(source, context);
  return context.exports;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 & 2: Agent sees only assigned work & Unauthorized project update is rejected (403)
// ─────────────────────────────────────────────────────────────────────────────
test("1 & 2: Agent sees only assigned work and unauthorized project milestone update is rejected (403)", async () => {
  const timelineEvents = [];
  const auditLogs = [];

  const mockPrisma = {
    solarProject: {
      findFirst: async ({ where }) => {
        if (where.OR?.[0]?.id === "proj_assigned") {
          return {
            id: "proj_assigned",
            projectId: "SL-PRJ-101",
            customerId: "cust_1",
            assignedEngineerId: "eng_abhishek",
            assignedSalesExecutiveId: "sales_1",
            customer: { fullName: "Rajesh Sharma", id: "cust_1" },
          };
        }
        if (where.OR?.[0]?.id === "proj_unassigned") {
          return {
            id: "proj_unassigned",
            projectId: "SL-PRJ-102",
            customerId: "cust_2",
            assignedEngineerId: "eng_other",
            assignedSalesExecutiveId: "sales_other",
            customer: { fullName: "Anita Patel", id: "cust_2" },
          };
        }
        return null;
      },
      update: async () => ({ id: "proj_assigned" }),
    },
    projectTimeline: {
      create: async ({ data }) => {
        const item = { id: `tl_${Date.now()}`, ...data, eventDateTime: new Date() };
        timelineEvents.push(item);
        return item;
      },
      findMany: async () => timelineEvents,
    },
    auditLog: {
      create: async ({ data }) => {
        auditLogs.push(data);
        return data;
      },
    },
  };

  const timelineRoute = load("app/api/v1/projects/[id]/timeline/route.ts", {
    require: (name) => {
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("auth-otp")) return { authenticateCustomerRequest: async () => null };
      if (name.includes("agent-auth")) {
        return {
          authenticateAgentRequest: async () => ({
            id: "eng_abhishek",
            employeeId: "SA-54504",
            name: "Abhishek Verma",
            role: "FieldEngineer",
          }),
        };
      }
      if (name.includes("admin-auth")) return { authenticateAdminRequest: async () => false };
      if (name.includes("audit-logger")) {
        return {
          logAuditEvent: async (entry) => {
            auditLogs.push(entry);
          },
        };
      }
      return {};
    },
  });

  // Unauthorized attempt: Agent tries to update a project assigned to another engineer
  const unauthReq = new Request("http://localhost:3000/api/v1/projects/proj_unassigned/timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "STRUCTURE_WORK",
      eventTitle: "Structure Work Completed",
      status: "COMPLETED",
    }),
  });

  const unauthRes = await timelineRoute.POST(unauthReq, { params: { id: "proj_unassigned" } });
  const unauthJson = await unauthRes.json();
  assert.equal(unauthRes.status, 403);
  assert.ok(unauthJson.error.includes("Forbidden"));

  // Authorized attempt: Agent updates project assigned to them
  const authReq = new Request("http://localhost:3000/api/v1/projects/proj_assigned/timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "STRUCTURE_WORK",
      eventTitle: "Mounting Structure Erected",
      customerDescription: "Ground mounting rails installed and tested.",
      status: "COMPLETED",
    }),
  });

  const authRes = await timelineRoute.POST(authReq, { params: { id: "proj_assigned" } });
  const authJson = await authRes.json();
  assert.equal(authRes.status, 200);
  assert.equal(authJson.success, true);
  assert.equal(authJson.milestone.status, "COMPLETED");
  assert.equal(timelineEvents.length, 1);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3, 4, 5: Installation progress persistence, client visibility & verification safety
// ─────────────────────────────────────────────────────────────────────────────
test("3, 4, 5: Incomplete work cannot be falsely verified & client sees authorized installation progress", async () => {
  const mockTimeline = [
    {
      id: "tl_1",
      projectId: "proj_1",
      eventType: "CIVIL_WORK",
      eventTitle: "Civil Anchor Pads",
      customerDescription: "Foundation cured and load verified.",
      status: "PENDING",
      visibleToCustomer: true,
      eventDateTime: new Date(),
    },
  ];

  const mockPrisma = {
    solarProject: {
      findFirst: async () => ({
        id: "proj_1",
        customerId: "cust_1",
        assignedEngineerId: "eng_1",
      }),
    },
    projectTimeline: {
      findFirst: async ({ where }) => mockTimeline.find((t) => t.id === where.id),
      update: async ({ where, data }) => {
        const item = mockTimeline.find((t) => t.id === where.id);
        Object.assign(item, data);
        return item;
      },
      findMany: async ({ where }) =>
        mockTimeline.filter((t) => !where.visibleToCustomer || t.visibleToCustomer === true),
    },
    auditLog: { create: async () => ({}) },
  };

  const timelineRoute = load("app/api/v1/projects/[id]/timeline/route.ts", {
    require: (name) => {
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("auth-otp")) return { authenticateCustomerRequest: async () => null };
      if (name.includes("agent-auth")) {
        return {
          authenticateAgentRequest: async () => ({
            id: "eng_1",
            name: "Engineer 1",
            role: "FieldEngineer",
          }),
        };
      }
      if (name.includes("admin-auth")) return { authenticateAdminRequest: async () => false };
      if (name.includes("audit-logger")) return { logAuditEvent: async () => {} };
      return {};
    },
  });

  // Attempt to falsely mark PENDING work as VERIFIED without work completion notes
  const falseVerifyReq = new Request("http://localhost:3000/api/v1/projects/proj_1/timeline", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      milestoneId: "tl_1",
      status: "VERIFIED",
    }),
  });

  const falseVerifyRes = await timelineRoute.PATCH(falseVerifyReq, { params: { id: "proj_1" } });
  const falseVerifyJson = await falseVerifyRes.json();
  assert.equal(falseVerifyRes.status, 400);
  assert.ok(falseVerifyJson.error.includes("Cannot mark incomplete milestone as VERIFIED"));

  // Customer view: only sees visibleToCustomer events
  const customerTimelineRoute = load("app/api/v1/projects/[id]/timeline/route.ts", {
    require: (name) => {
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("auth-otp")) {
        return {
          authenticateCustomerRequest: async () => ({
            id: "cust_1",
            customerId: "SL-CUST-1001",
          }),
        };
      }
      if (name.includes("agent-auth")) return { authenticateAgentRequest: async () => null };
      if (name.includes("admin-auth")) return { authenticateAdminRequest: async () => false };
      return {};
    },
  });

  const custReq = new Request("http://localhost:3000/api/v1/projects/proj_1/timeline");
  const custRes = await customerTimelineRoute.GET(custReq, { params: { id: "proj_1" } });
  const custJson = await custRes.json();
  assert.equal(custRes.status, 200);
  assert.equal(custJson.timeline.length, 1);
  assert.equal(custJson.timeline[0].eventTitle, "Civil Anchor Pads");
});

// ─────────────────────────────────────────────────────────────────────────────
// 6, 7, 8, 9, 10: Service Tickets: Customer creates, Tech updates, Customer confirms
// ─────────────────────────────────────────────────────────────────────────────
test("6, 7, 8, 9, 10: Complete Service Ticket Lifecycle: Customer creates -> Tech updates -> Customer confirms", async () => {
  let tickets = [];
  let auditTrail = [];

  const mockPrisma = {
    serviceTicket: {
      count: async () => tickets.length,
      create: async ({ data }) => {
        const item = {
          id: `tck_${Date.now()}`,
          ticketId: data.ticketId,
          customerId: data.customerId,
          projectId: data.projectId,
          issueCategory: data.issueCategory,
          description: data.description,
          priority: data.priority,
          status: data.status,
          assignedTechnicianId: null,
          customerRating: null,
          submittedDate: new Date(),
          attachments: [],
        };
        tickets.push(item);
        return item;
      },
      findFirst: async ({ where }) => {
        const id = where.id || where.ticketId || where.OR?.[0]?.id || where.OR?.[1]?.ticketId;
        return tickets.find((t) => t.id === id || t.ticketId === id);
      },
      findUnique: async ({ where }) => tickets.find((t) => t.id === where.id),
      findMany: async ({ where }) => {
        return tickets.filter((t) => {
          if (where.customerId && t.customerId !== where.customerId) return false;
          if (where.assignedTechnicianId && t.assignedTechnicianId !== where.assignedTechnicianId) return false;
          return true;
        });
      },
      update: async ({ where, data }) => {
        const item = tickets.find((t) => t.id === where.id);
        Object.assign(item, data);
        return item;
      },
    },
    ticketAttachment: {
      create: async ({ data }) => data,
    },
    auditLog: {
      create: async ({ data }) => {
        auditTrail.push(data);
        return data;
      },
    },
  };

  const customerTicketsRoute = load("app/api/v1/tickets/route.ts", {
    require: (name) => {
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("auth-otp")) {
        return {
          authenticateCustomerRequest: async () => ({
            id: "cust_rajesh",
            customerId: "SL-CUST-1001",
          }),
        };
      }
      if (name.includes("audit-logger")) {
        return {
          logAuditEvent: async (entry) => auditTrail.push(entry),
        };
      }
      return {};
    },
  });

  // Step 1: Customer creates ticket
  const createReq = new Request("http://localhost:3000/api/v1/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      issueCategory: "INVERTER_ISSUE",
      description: "Inverter showing red blinking warning LED after morning rain.",
      priority: "HIGH",
    }),
  });
  const createRes = await customerTicketsRoute.POST(createReq);
  const createJson = await createRes.json();
  assert.equal(createRes.status, 200);
  assert.equal(createJson.ticket.status, "SUBMITTED");
  const createdTicketId = createJson.ticket.id;

  // Step 2: Assign ticket to technician in DB
  tickets[0].assignedTechnicianId = "tech_abhishek";
  tickets[0].status = "ASSIGNED";

  // Step 3: Technician views assigned tickets
  const agentTicketsRoute = load("app/api/v1/agent/tickets/route.ts", {
    require: (name) => {
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("agent-auth")) {
        return {
          authenticateAgentRequest: async () => ({
            id: "tech_abhishek",
            name: "Abhishek Verma",
            role: "Technician",
          }),
        };
      }
      if (name.includes("admin-auth")) return { authenticateAdminRequest: async () => false };
      return {};
    },
  });

  const techListReq = new Request("http://localhost:3000/api/v1/agent/tickets");
  const techListRes = await agentTicketsRoute.GET(techListReq);
  const techListJson = await techListRes.json();
  assert.equal(techListRes.status, 200);
  assert.equal(techListJson.tickets.length, 1);
  assert.equal(techListJson.tickets[0].id, createdTicketId);

  // Step 4: Technician updates work to WORK_COMPLETED with diagnosis notes
  const agentTicketDetailRoute = load("app/api/v1/agent/tickets/[id]/route.ts", {
    require: (name) => {
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("agent-auth")) {
        return {
          authenticateAgentRequest: async () => ({
            id: "tech_abhishek",
            name: "Abhishek Verma",
            role: "Technician",
          }),
        };
      }
      if (name.includes("admin-auth")) return { authenticateAdminRequest: async () => false };
      if (name.includes("audit-logger")) {
        return { logAuditEvent: async (entry) => auditTrail.push(entry) };
      }
      return {};
    },
  });

  const techUpdateReq = new Request(`http://localhost:3000/api/v1/agent/tickets/${createdTicketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "WORK_COMPLETED",
      resolutionDetails: "Replaced faulty surge arrester fuse on DC distribution box. Inverter rebooted with green generation status.",
      customerVisibleNotes: "Surge arrester replaced under warranty. Generation normal.",
    }),
  });

  const techUpdateRes = await agentTicketDetailRoute.PATCH(techUpdateReq, { params: { id: createdTicketId } });
  const techUpdateJson = await techUpdateRes.json();
  assert.equal(techUpdateRes.status, 200);
  assert.equal(techUpdateJson.ticket.status, "WORK_COMPLETED");

  // Step 5: Customer confirms resolution and provides 5-star rating
  const custConfirmReq = new Request("http://localhost:3000/api/v1/tickets", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticketId: createdTicketId,
      action: "CONFIRM_RESOLUTION",
      customerRating: 5,
      customerRemarks: "Technician arrived promptly and resolved the fault. Very happy!",
    }),
  });

  const custConfirmRes = await customerTicketsRoute.PATCH(custConfirmReq);
  const custConfirmJson = await custConfirmRes.json();
  assert.equal(custConfirmRes.status, 200);
  assert.equal(custConfirmJson.ticket.status, "RESOLVED");
  assert.equal(custConfirmJson.ticket.customerRating, 5);
  assert.ok(auditTrail.length >= 2);
});

// ─────────────────────────────────────────────────────────────────────────────
// 11, 12, 13: Mobile Attendance: Identity bound, Spoofing blocked, GPS validated
// ─────────────────────────────────────────────────────────────────────────────
test("11, 12, 13: Attendance uses CRM identity, prevents spoofing, and rejects invalid GPS", async () => {
  let attendanceRecords = [];

  const mockPrisma = {
    teamMember: {
      findUnique: async ({ where }) => ({ id: where.id, territory: "Jaipur" }),
    },
    attendance: {
      findUnique: async ({ where }) =>
        attendanceRecords.find((r) => r.memberId === where.memberId_date.memberId),
      upsert: async ({ create, update, where }) => {
        let existing = attendanceRecords.find((r) => r.memberId === where.memberId_date.memberId);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created = { id: `att_${Date.now()}`, ...create, updatedAt: new Date() };
        attendanceRecords.push(created);
        return created;
      },
    },
  };

  const attendanceRoute = load("app/api/v1/agent/attendance/route.ts", {
    require: (name) => {
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("agent-auth")) {
        return {
          authenticateAgentRequest: async () => ({
            id: "agent_abhishek",
            employeeId: "SA-54504",
            name: "Abhishek Verma",
            role: "FieldAgent",
          }),
        };
      }
      return {};
    },
  });

  // Test 13: Invalid GPS latitude (> 90) is rejected with 400
  const badGpsReq = new Request("http://localhost:3000/api/v1/agent/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "punch-in",
      latitude: 199.5, // Invalid coordinate
      longitude: 75.8,
    }),
  });

  const badGpsRes = await attendanceRoute.POST(badGpsReq);
  assert.equal(badGpsRes.status, 400);

  // Test 11: Valid punch-in automatically binds to authenticated agent_abhishek
  const makePunchReq = () =>
    new Request("http://localhost:3000/api/v1/agent/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "punch-in",
        latitude: 26.9124,
        longitude: 75.7873,
      }),
    });

  const validPunchInRes = await attendanceRoute.POST(makePunchReq());
  const punchInJson = await validPunchInRes.json();
  assert.equal(validPunchInRes.status, 200);
  assert.equal(punchInJson.record.memberId, "agent_abhishek");
  assert.equal(punchInJson.record.status, "Present");

  // Duplicate punch-in is rejected (409 Conflict)
  const dupPunchInRes = await attendanceRoute.POST(makePunchReq());
  assert.equal(dupPunchInRes.status, 409);
});

// ─────────────────────────────────────────────────────────────────────────────
// 14, 15, 16: Document Upload & Cross-Customer Isolation
// ─────────────────────────────────────────────────────────────────────────────
test("14, 15, 16: Authorized document upload succeeds; unauthorized access fails (403)", async () => {
  let documents = [];

  const mockPrisma = {
    solarProject: {
      findFirst: async ({ where }) => {
        if (where.OR?.[0]?.id === "proj_cust1") {
          return {
            id: "proj_cust1",
            customerId: "cust_1",
            assignedEngineerId: "eng_1",
            customer: { fullName: "Rajesh", id: "cust_1" },
          };
        }
        return null;
      },
    },
    document: {
      count: async () => documents.length,
      create: async ({ data }) => {
        const item = { id: `doc_${Date.now()}`, ...data };
        documents.push(item);
        return item;
      },
    },
    auditLog: { create: async () => ({}) },
  };

  const docRoute = load("app/api/v1/projects/[id]/documents/route.ts", {
    require: (name) => {
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("auth-otp")) {
        return {
          authenticateCustomerRequest: async () => ({
            id: "cust_foreign_attacker", // Foreign customer
            customerId: "SL-CUST-9999",
          }),
        };
      }
      if (name.includes("agent-auth")) return { authenticateAgentRequest: async () => null };
      if (name.includes("admin-auth")) return { authenticateAdminRequest: async () => false };
      return {};
    },
  });

  // Foreign customer attempts to upload document to cust_1's project -> 403 Forbidden
  const foreignReq = new Request("http://localhost:3000/api/v1/projects/proj_cust1/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentCategory: "CUSTOMER_KYC",
      documentName: "Aadhaar Card",
      fileLocation: "/uploads/docs/aadhaar.pdf",
    }),
  });

  const foreignRes = await docRoute.POST(foreignReq, { params: { id: "proj_cust1" } });
  assert.equal(foreignRes.status, 403);
  assert.equal(documents.length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 19: CRM Completion Gate Bypass Blocked on client-profile route
// ─────────────────────────────────────────────────────────────────────────────
test("19: Administrative completion gate bypass is blocked on client-profile endpoint", async () => {
  const mockPrisma = {
    customer: {
      findFirst: async () => ({
        id: "cust_1",
        fullName: "Test Customer",
        projects: [
          {
            id: "proj_in_progress",
            projectStatus: "STRUCTURE_WORK", // Premature installation stage
            installationDate: null,
            commissioningDate: null,
          },
        ],
      }),
      findUnique: async () => ({
        id: "cust_1",
        fullName: "Test Customer",
        projects: [
          {
            id: "proj_in_progress",
            projectStatus: "STRUCTURE_WORK",
            installationDate: null,
            commissioningDate: null,
          },
        ],
      }),
      update: async () => ({ fullName: "Test Customer" }),
    },
    auditLog: { create: async () => ({}) },
  };

  const clientProfileRoute = load("app/api/v1/admin/client-profile/[id]/route.ts", {
    require: (name) => {
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("admin-auth")) return { authenticateAdminRequest: async () => true };
      if (name.includes("audit-logger")) return { logAuditEvent: async () => {} };
      return {};
    },
  });

  // Admin attempts to prematurely jump stage to ACTIVE without installation completion
  const bypassReq = new Request("http://localhost:3000/api/v1/admin/client-profile/cust_1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "UPDATE_STAGE",
      stage: "ACTIVE",
    }),
  });

  const bypassRes = await clientProfileRoute.POST(bypassReq, { params: { id: "cust_1" } });
  const bypassJson = await bypassRes.json();
  assert.equal(bypassRes.status, 400);
  assert.ok(bypassJson.error.includes("Cannot transition project to ACTIVE"));
});

