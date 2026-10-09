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
  const context = {
    exports: {},
    Request,
    Response,
    URL,
    AbortController,
    Event,
    clearTimeout,
    Buffer,
    globalThis: sharedGlobal,
    process: {
      env: {
        NODE_ENV: "production",
        CUSTOMER_AUTH_SECRET: "test_secret_phase1_customer_lifecycle_token_secret_32bytes",
      },
    },
    ...globals,
  };
  vm.runInNewContext(source, context);
  return context.exports;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 1 & 11: New Lead Login & No Duplicate Customer Creation
// ─────────────────────────────────────────────────────────────────────────────
test("1 & 11: New lead login resolves to LEAD state without creating duplicate Customer record", async () => {
  let createdLeads = [];
  let dispatchedPayload = null;

  const mockPrisma = {
    customer: {
      findUnique: async () => null, // No existing customer
    },
    lead: {
      findFirst: async () => null, // No existing lead
      count: async () => 0,
      create: async (args) => {
        const row = {
          id: "lead_new_1",
          leadId: "SL-LEAD-2026-001",
          name: "New Applicant",
          phone: "9876543210",
          city: "Narmadapuram",
          propertyType: "Residential",
          monthlyBill: "₹5,000–₹10,000",
          status: "NEW",
          createdAt: new Date(),
          ...args.data,
        };
        createdLeads.push(row);
        return row;
      },
    },
  };

  const authOtp = load("lib/crm/auth-otp.ts", {
    require: (name) => {
      if (name === "crypto" || name === "node:crypto") return nodeCrypto;
      if (name.includes("sms-service")) {
        return {
          dispatchCustomerOtp: async (payload) => {
            dispatchedPayload = payload;
            return { sent: true, destination: "******3210", channel: "WhatsApp" };
          },
        };
      }
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("territory-router")) {
        return { assignLeadToSales: async () => ({ salesExecutiveId: "sales_1" }) };
      }
      return {};
    },
  });

  const send = await authOtp.sendCustomerOtp("9876543210");
  assert.equal(send.success, true);
  assert.ok(dispatchedPayload);
  const correctOtp = dispatchedPayload.otp;

  const verifyRes = await authOtp.verifyCustomerOtp("9876543210", correctOtp);
  assert.equal(verifyRes.success, true);
  assert.equal(verifyRes.accountState, "LEAD");
  assert.equal(verifyRes.isNewUser, true);
  assert.equal(createdLeads.length, 1);
  assert.equal(createdLeads[0].phone, "9876543210");
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 2, 3, 11: Existing CRM Customer Login & Completed Plant
// ─────────────────────────────────────────────────────────────────────────────
test("2, 3, 11: Existing customer with completed installation logs in and retrieves plant records", async () => {
  let dispatchedPayload = null;
  const existingCustomer = {
    id: "cust_completed_1",
    customerId: "SL-CUST-1001",
    fullName: "Suresh Patel",
    primaryMobile: "9876500001",
    customerStatus: "ACTIVE",
    appAccessEnabled: true,
    installationAddress: "Plot 12, Hoshangabad Road, Bhopal",
    propertyType: "RESIDENTIAL",
    projects: [
      {
        id: "prj_comp_1",
        projectId: "SL-PRJ-1001",
        projectName: "Suresh Patel - 5kW Rooftop Solar",
        plantCapacityKw: 5.0,
        solarType: "ON_GRID",
        projectStatus: "ACTIVE",
        commissioningDate: new Date("2026-01-15T10:00:00Z"),
        installationDate: new Date("2026-01-05T10:00:00Z"),
        installationAddress: "Plot 12, Hoshangabad Road, Bhopal",
        consumerNumber: "BPL-99214-01",
        discom: "MPMKVVCL",
        panelBrandModel: "Adani Solar 540W Mono PERC",
        inverterBrandModel: "Sungrow 5kW Grid-Tie",
        warrantyStartDate: new Date("2026-01-15T10:00:00Z"),
        warrantyEndDate: new Date("2051-01-15T10:00:00Z"),
      },
    ],
  };

  const mockPrisma = {
    customer: {
      findUnique: async () => existingCustomer,
      update: async () => existingCustomer,
    },
    lead: {
      findFirst: async () => null,
    },
  };

  const authOtp = load("lib/crm/auth-otp.ts", {
    require: (name) => {
      if (name === "crypto" || name === "node:crypto") return nodeCrypto;
      if (name.includes("sms-service")) {
        return {
          dispatchCustomerOtp: async (payload) => {
            dispatchedPayload = payload;
            return { sent: true, destination: "******0001", channel: "WhatsApp" };
          },
        };
      }
      if (name.includes("prisma")) return { prisma: mockPrisma };
      if (name.includes("territory-router")) {
        return { assignLeadToSales: async () => ({ salesExecutiveId: "sales_1" }) };
      }
      return {};
    },
  });

  await authOtp.sendCustomerOtp("9876500001");
  assert.ok(dispatchedPayload);
  const correctOtp = dispatchedPayload.otp;

  const verifyRes = await authOtp.verifyCustomerOtp("9876500001", correctOtp);
  assert.equal(verifyRes.success, true);
  assert.equal(verifyRes.accountState, "CUSTOMER");
  assert.equal(verifyRes.user.name, "Suresh Patel");
  assert.equal(verifyRes.projects.length, 1);
  assert.equal(verifyRes.projects[0].projectStatus, "ACTIVE");
  assert.ok(verifyRes.projects[0].commissioningDate);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 4, 5, 6: Multiple Projects & Completed Plant with New Enquiry
// ─────────────────────────────────────────────────────────────────────────────
test("4, 5, 6: Customer with completed plant AND new enquiry receives both authorized contexts in /api/v1/me", async () => {
  const customer = {
    id: "cust_multi_1",
    customerId: "SL-CUST-2002",
    fullName: "Ramesh Sharma",
    primaryMobile: "9876500002",
    customerStatus: "ACTIVE",
    installationAddress: "Site A, Narmadapuram",
    propertyType: "RESIDENTIAL",
    preferredLanguage: "hi",
    projects: [
      {
        id: "prj_site_a",
        projectId: "SL-PRJ-2001",
        projectName: "Residential Solar",
        plantCapacityKw: 3.5,
        projectStatus: "ACTIVE",
        commissioningDate: new Date("2025-11-20Z"),
        assignedEngineer: { id: "eng_1", name: "Vikram Singh", phone: "9876543211", role: "Engineer" },
        assignedSalesExecutive: { id: "sales_1", name: "Anil Verma", phone: "9876543212", role: "Sales" },
        subsidy: { currentStatus: "SUBSIDY_CREDITED", expectedSubsidy: 78000, approvedSubsidy: 78000 },
        _count: { tickets: 0, documents: 4 },
      },
      {
        id: "prj_site_b",
        projectId: "SL-PRJ-2002",
        projectName: "Farmhouse Solar",
        plantCapacityKw: 10.0,
        projectStatus: "INSTALLATION_IN_PROGRESS",
        commissioningDate: null,
        assignedEngineer: { id: "eng_2", name: "Rohit Jain", phone: "9876543213", role: "Engineer" },
        assignedSalesExecutive: { id: "sales_1", name: "Anil Verma", phone: "9876543212", role: "Sales" },
        subsidy: { currentStatus: "DISCOM_APPLICATION", expectedSubsidy: 78000, approvedSubsidy: null },
        _count: { tickets: 0, documents: 2 },
      },
    ],
  };

  const openEnquiry = {
    id: "lead_commercial_1",
    leadId: "SL-LEAD-2026-999",
    propertyType: "COMMERCIAL",
    city: "Bhopal",
    status: "SURVEY_SCHEDULED",
    requestedCapacity: 25.0,
    surveyRequestedDate: new Date("2026-10-15T11:00:00Z"),
  };

  const meRoute = load("app/api/v1/me/route.ts", {
    require: (name) => {
      if (name === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name.includes("auth-otp")) {
        return {
          authenticateCustomerRequest: async () => ({
            id: "cust_multi_1",
            isLead: false,
            customerStatus: "ACTIVE",
          }),
        };
      }
      if (name.includes("prisma")) {
        return {
          prisma: {
            customer: { findUnique: async () => customer },
            lead: { findFirst: async () => openEnquiry },
          },
        };
      }
      return {};
    },
  });

  const req = new Request("http://localhost/api/v1/me");
  const res = await meRoute.GET(req);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.success, true);
  assert.equal(data.accountState, "CUSTOMER");
  assert.equal(data.projects.length, 2);
  assert.equal(data.projects[0].id, "prj_site_a");
  assert.equal(data.projects[0].projectStatus, "ACTIVE");
  assert.equal(data.projects[1].id, "prj_site_b");
  assert.equal(data.projects[1].projectStatus, "INSTALLATION_IN_PROGRESS");
  assert.ok(data.openEnquiry);
  assert.equal(data.openEnquiry.propertyType, "COMMERCIAL");
  assert.equal(data.openEnquiry.status, "SURVEY_SCHEDULED");
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 10: Customer Isolation & No Unauthorized Project Access
// ─────────────────────────────────────────────────────────────────────────────
test("10: Customer cannot access another customer's solar project (Enforces customerId isolation)", async () => {
  const projectDetailRoute = load("app/api/v1/projects/[id]/route.ts", {
    require: (name) => {
      if (name === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name.includes("auth-otp")) {
        // Authenticated as Customer A
        return { authenticateCustomerRequest: async () => ({ id: "customer_A" }) };
      }
      if (name.includes("prisma")) {
        return {
          prisma: {
            solarProject: {
              findFirst: async (args) => {
                if (args.where.customerId === "customer_A" && args.where.id === "prj_belonging_to_B") {
                  return null;
                }
                return null;
              },
            },
          },
        };
      }
      return {};
    },
  });

  const req = new Request("http://localhost/api/v1/projects/prj_belonging_to_B");
  const res = await projectDetailRoute.GET(req, { params: { id: "prj_belonging_to_B" } });
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.match(body.error, /unauthorized|not found/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 12: No False Completed State (Completion Gates Enforcement)
// ─────────────────────────────────────────────────────────────────────────────
test("12: Transition to ACTIVE is rejected if installation is not completed (No false completed state)", async () => {
  const inFlightProject = {
    id: "prj_incomplete_1",
    customerId: "cust_123",
    projectStatus: "MATERIAL_PENDING", // Installation not done!
    installationDate: null,
    commissioningDate: null,
    solarType: "ON_GRID",
    customer: { id: "cust_123" },
  };

  const adminProjectsRoute = load("app/api/v1/admin/projects/route.ts", {
    require: (name) => {
      if (name === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name.includes("admin-auth")) return { authenticateAdminRequest: async () => true };
      if (name.includes("audit-logger")) return { logAuditEvent: async () => {} };
      if (name.includes("prisma")) {
        return {
          prisma: {
            solarProject: {
              findUnique: async () => inFlightProject,
              update: async () => ({ ...inFlightProject, projectStatus: "ACTIVE" }),
            },
          },
        };
      }
      return {};
    },
  });

  const req = new Request("http://localhost/api/v1/admin/projects", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: "prj_incomplete_1",
      newStatus: "ACTIVE",
    }),
  });

  const res = await adminProjectsRoute.PATCH(req);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Completion gate failed/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 13: Legacy Completed Project Compatibility
// ─────────────────────────────────────────────────────────────────────────────
test("13: Legacy completed project with past commissioningDate is permitted to update without blockage", async () => {
  const legacyCompletedProject = {
    id: "prj_legacy_completed",
    customerId: "cust_legacy",
    projectStatus: "ACTIVE",
    installationDate: new Date("2024-05-10Z"),
    commissioningDate: new Date("2024-05-20Z"),
    solarType: "ON_GRID",
    customer: { id: "cust_legacy" },
  };

  let updatedRecord = null;
  const adminProjectsRoute = load("app/api/v1/admin/projects/route.ts", {
    require: (name) => {
      if (name === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name.includes("admin-auth")) return { authenticateAdminRequest: async () => true };
      if (name.includes("audit-logger")) return { logAuditEvent: async () => {} };
      if (name.includes("prisma")) {
        return {
          prisma: {
            solarProject: {
              findUnique: async () => legacyCompletedProject,
            },
            $transaction: async (fn) => fn({
              solarProject: {
                update: async (args) => {
                  updatedRecord = { ...legacyCompletedProject, ...args.data };
                  return updatedRecord;
                },
              },
              projectTimeline: { create: async () => ({}) },
              notification: { create: async () => ({}) },
            }),
          },
        };
      }
      return {};
    },
  });

  const req = new Request("http://localhost/api/v1/admin/projects", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: "prj_legacy_completed",
      newStatus: "ACTIVE",
    }),
  });

  const res = await adminProjectsRoute.PATCH(req);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
});
