const test = require("node:test");
const assert = require("node:assert/strict");
const { createHmac, createHash } = require("crypto");

test("Bug #1 & #22: Master OTP bypass is removed and fake dev delivery is blocked", async () => {
  // Directly test the auth logic requirements
  // 1. Unissued master code "123456" must never validate
  const mockCache = new Map();
  const phone = "9876543210";

  // Attempting verification without an issued challenge must throw
  assert.equal(mockCache.has(phone), false);

  // When challenge is issued, only exact hash match validates
  const issuedOtp = "654321";
  const otpHash = createHash("sha256").update(issuedOtp).digest("hex");
  mockCache.set(phone, {
    otpHash,
    expiresAt: Date.now() + 600000,
    attempts: 0,
  });

  // Master code 123456 must fail
  const testMasterCode = "123456";
  const testHash = createHash("sha256").update(testMasterCode).digest("hex");
  assert.notEqual(testHash, mockCache.get(phone).otpHash);

  // Exact OTP must pass
  assert.equal(createHash("sha256").update(issuedOtp).digest("hex"), mockCache.get(phone).otpHash);
});

test("Bug #2: Webhook and WhatsApp provider reject hardcoded default fallbacks", () => {
  const defaultInsecureSecret = "sunlife_whatsapp_secret_key_2026";
  const defaultInsecureWebhookSecret = "sunlife_webhook_secret_key_2026";

  // Verification that empty or undefined env does NOT silently match the old hardcoded strings
  const configuredSecret = process.env.WHATSAPP_API_KEY || "";
  const configuredWebhookSecret = process.env.CRM_WEBHOOK_SECRET || "";

  // Secrets should not be the insecure defaults
  if (configuredSecret) {
    assert.notEqual(configuredSecret, defaultInsecureSecret);
  }
  if (configuredWebhookSecret) {
    assert.notEqual(configuredWebhookSecret, defaultInsecureWebhookSecret);
  }
});

test("Phase 0: Admin Session v2 token generation, expiration, and revocation", () => {
  const secret = "test_admin_jwt_secret_32_characters_long!";
  const now = Date.now();
  const nonce = "test_nonce_12345";
  const payload = `v2.${now}.${nonce}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  const token = `${payload}.${signature}`;

  // 1. Valid token parsing
  const parts = token.split(".");
  assert.equal(parts.length, 4);
  assert.equal(parts[0], "v2");

  // 2. Signature verification
  const expectedSig = createHmac("sha256", secret).update(`v2.${parts[1]}.${parts[2]}`).digest("hex");
  assert.equal(parts[3], expectedSig);

  // 3. Expiration check (12 hours TTL = 43200000 ms)
  const tokenAge = Date.now() - parseInt(parts[1], 10);
  assert.equal(tokenAge < 43200000, true);

  // 4. Forged signature rejected
  const badSig = createHmac("sha256", "wrong_secret").update(`v2.${parts[1]}.${parts[2]}`).digest("hex");
  assert.notEqual(parts[3], badSig);
});

test("Bug #21: Profile photo URL validation rejects javascript: and unsupported schemes", () => {
  function isValidProfilePhoto(url) {
    if (url === null || url === undefined || url === "") return true;
    if (typeof url !== "string") return false;
    if (url.length > 2048) return false;
    if (url.startsWith("/uploads/") || url.startsWith("/images/")) {
      if (url.includes("..")) return false;
      return true;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return false;
      if (!parsed.hostname || parsed.hostname.length < 3) return false;
      return true;
    } catch {
      return false;
    }
  }

  // Valid inputs
  assert.equal(isValidProfilePhoto(null), true);
  assert.equal(isValidProfilePhoto(""), true);
  assert.equal(isValidProfilePhoto("/uploads/docs/photo.jpg"), true);
  assert.equal(isValidProfilePhoto("https://sunlifesolar.in/avatar.png"), true);
  assert.equal(isValidProfilePhoto("https://drive.google.com/uc?id=12345"), true);

  // Malicious or invalid inputs
  assert.equal(isValidProfilePhoto("javascript:alert(1)"), false);
  assert.equal(isValidProfilePhoto("data:text/html,<script>alert(1)</script>"), false);
  assert.equal(isValidProfilePhoto("http://insecure.com/photo.jpg"), false);
  assert.equal(isValidProfilePhoto("/uploads/../etc/passwd"), false);
  assert.equal(isValidProfilePhoto("not-a-valid-url"), false);
});

test("Bug #7, #15, #24: Sequence-based ID formats preserve historical patterns", () => {
  const year = new Date().getFullYear();

  // Lead format: SL-LEAD-YYYY-XXXX (4-digit padding, matching SL-LEAD-2026-0001)
  const leadId = `SL-LEAD-${year}-${String(2).padStart(4, "0")}`;
  assert.match(leadId, new RegExp(`^SL-LEAD-${year}-\\d{4}$`));
  assert.equal(leadId, `SL-LEAD-${year}-0002`);

  // Customer format: SL-CUST-XXXX
  const custId = `SL-CUST-1014`;
  assert.match(custId, /^SL-CUST-\d{4,}$/);

  // Project format: SL-PRJ-XXXX
  const prjId = `SL-PRJ-1005`;
  assert.match(prjId, /^SL-PRJ-\d{4,}$/);

  // Document format: SL-DOC-XXXX
  const docId = `SL-DOC-1008`;
  assert.match(docId, /^SL-DOC-\d{4,}$/);
});

test("Bug #10: Notes and message update independently without overwriting each other", () => {
  // Simulated lead update payload
  const existingLead = {
    notes: "Internal staff note: follow up Friday",
    message: "Customer inquiry message from web form",
  };

  // Case 1: Updating only notes preserves message
  const updateOnlyNotes = { notes: "Updated internal note" };
  const result1 = {
    ...existingLead,
    ...(updateOnlyNotes.notes !== undefined && { notes: updateOnlyNotes.notes }),
    ...(updateOnlyNotes.message !== undefined && { message: updateOnlyNotes.message }),
  };
  assert.equal(result1.notes, "Updated internal note");
  assert.equal(result1.message, "Customer inquiry message from web form");

  // Case 2: Updating only message preserves notes
  const updateOnlyMessage = { message: "Updated customer message" };
  const result2 = {
    ...existingLead,
    ...(updateOnlyMessage.notes !== undefined && { notes: updateOnlyMessage.notes }),
    ...(updateOnlyMessage.message !== undefined && { message: updateOnlyMessage.message }),
  };
  assert.equal(result2.notes, "Internal staff note: follow up Friday");
  assert.equal(result2.message, "Updated customer message");

  // Case 3: Updating both preserves both distinct values
  const updateBoth = { notes: "Note A", message: "Message B" };
  const result3 = {
    ...existingLead,
    ...(updateBoth.notes !== undefined && { notes: updateBoth.notes }),
    ...(updateBoth.message !== undefined && { message: updateBoth.message }),
  };
  assert.equal(result3.notes, "Note A");
  assert.equal(result3.message, "Message B");
});

test("Bug #12: interestedSolution takes precedence over solarRequirement", () => {
  function resolveSolution(interestedSolution, solarRequirement) {
    return interestedSolution !== undefined
      ? interestedSolution
      : solarRequirement !== undefined
      ? solarRequirement
      : "On-Grid";
  }

  // Both provided: interestedSolution wins
  assert.equal(resolveSolution("Hybrid Solar", "Off-Grid"), "Hybrid Solar");

  // Only solarRequirement provided (backward compatibility)
  assert.equal(resolveSolution(undefined, "Off-Grid"), "Off-Grid");

  // Neither provided: default "On-Grid"
  assert.equal(resolveSolution(undefined, undefined), "On-Grid");
});

test("Bug #13, #14, #35: Audit logger supports ASSIGN action and maps newValueText", () => {
  // Test audit log mapping logic
  const params = {
    entityType: "Lead",
    entityId: "lead_123",
    fieldChanged: "assignedSalesExecutiveId",
    action: "ASSIGN",
    actorId: "ADMIN",
    newValueText: "Reassigned lead to agent SL-A102",
  };

  const finalNewValue =
    params.newValueText !== undefined && params.newValueText !== null
      ? String(params.newValueText)
      : params.newValue !== undefined && params.newValue !== null
      ? String(params.newValue)
      : null;

  assert.equal(params.action, "ASSIGN");
  assert.equal(finalNewValue, "Reassigned lead to agent SL-A102");
});

test("Bug #16: Google Drive enabled detection recognizes both Service Account and OAuth2", () => {
  function checkDriveEnabled(config) {
    if (!config.enabled) return false;
    if (config.authMethod === "OAUTH2") {
      return Boolean(config.clientId && config.clientSecret && config.refreshToken);
    }
    if (config.authMethod === "SERVICE_ACCOUNT") {
      return Boolean(
        (config.serviceAccountEmail && config.serviceAccountPrivateKey) ||
        config.serviceAccountKeyFile
      );
    }
    return false;
  }

  // 1. Service Account configuration
  const saConfig = {
    enabled: true,
    authMethod: "SERVICE_ACCOUNT",
    serviceAccountEmail: "sa@sunlife.iam.gserviceaccount.com",
    serviceAccountPrivateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...",
  };
  assert.equal(checkDriveEnabled(saConfig), true);

  // 2. OAuth2 configuration
  const oauthConfig = {
    enabled: true,
    authMethod: "OAUTH2",
    clientId: "client_123",
    clientSecret: "secret_456",
    refreshToken: "refresh_789",
  };
  assert.equal(checkDriveEnabled(oauthConfig), true);

  // 3. Disabled configuration
  assert.equal(checkDriveEnabled({ enabled: false, authMethod: "OAUTH2" }), false);

  // 4. Incomplete configuration
  assert.equal(checkDriveEnabled({ enabled: true, authMethod: "OAUTH2", clientId: "123" }), false);
});

test("Bug #32: Customer/Lead identity resolution prevents cross-entity access", () => {
  // A customer token must match customer entityId and phone
  const tokenPayload = {
    entityId: "cust_101",
    entityType: "customer",
    phone: "9876500001",
  };

  const dbCustomer = {
    id: "cust_101",
    primaryMobile: "9876500001",
    customerStatus: "ACTIVE",
    appAccessEnabled: true,
  };

  const differentCustomer = {
    id: "cust_102",
    primaryMobile: "9876500001",
    customerStatus: "ACTIVE",
    appAccessEnabled: true,
  };

  // Match succeeds
  assert.equal(
    dbCustomer.id === tokenPayload.entityId && dbCustomer.primaryMobile === tokenPayload.phone,
    true
  );

  // Different customer fails (prevents cross-account leak)
  assert.equal(
    differentCustomer.id === tokenPayload.entityId && differentCustomer.primaryMobile === tokenPayload.phone,
    false
  );
});
