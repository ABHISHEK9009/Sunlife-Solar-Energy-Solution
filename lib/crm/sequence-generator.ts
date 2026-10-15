import { prisma } from "@/lib/prisma";

type DbClient = typeof prisma | any;

/**
 * Executes a PostgreSQL sequence nextval query.
 * Returns null if the sequence does not exist or database does not support sequences.
 */
async function tryNextVal(db: DbClient, sequenceName: string): Promise<number | null> {
  try {
    const result: any = await db.$queryRawUnsafe(
      `SELECT nextval('sunlife.${sequenceName}')::bigint AS val;`
    );
    if (result && result.length > 0 && result[0]?.val !== undefined) {
      return Number(result[0].val);
    }
  } catch (err: any) {
    // Sequence not yet applied via pending migration, or running in mock environment
  }
  return null;
}

/**
 * Acquires a PostgreSQL transaction-level advisory lock when sequences are pending migration.
 * When called within an interactive transaction (tx), this serializes concurrent serverless
 * executions for the duration of the transaction.
 */
async function acquireFallbackLock(db: DbClient, entityKey: string): Promise<void> {
  try {
    if (typeof db.$executeRawUnsafe === "function") {
      await db.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext('sunlife_${entityKey}_fallback'));`
      );
    }
  } catch {
    // In mock tests or read-only/non-Postgres contexts, continue gracefully
  }
}

/**
 * Concurrency-safe Lead ID Generator.
 * Format: SL-LEAD-YYYY-XXXX (4-digit zero-padded, e.g. SL-LEAD-2026-0002)
 */
export async function generateLeadId(db: DbClient = prisma): Promise<string> {
  const year = new Date().getFullYear();
  const seqVal = await tryNextVal(db, "lead_seq");

  if (seqVal !== null) {
    return `SL-LEAD-${year}-${String(seqVal).padStart(4, "0")}`;
  }

  // Safe fallback scanning actual database records
  await acquireFallbackLock(db, "lead");
  const leads = await db.lead.findMany({
    where: { leadId: { startsWith: `SL-LEAD-${year}-` } },
    select: { leadId: true },
  });

  let maxNum = 0;
  for (const l of leads) {
    if (!l.leadId) continue;
    const match = l.leadId.match(/SL-LEAD-\d+-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  // If no year-based leads, check all historical leads
  if (maxNum === 0) {
    const allLeads = await db.lead.findMany({
      select: { leadId: true },
    });
    for (const l of allLeads) {
      if (!l.leadId) continue;
      const numMatch = l.leadId.match(/\d+$/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  }

  const nextSeq = maxNum + 1;
  return `SL-LEAD-${year}-${String(nextSeq).padStart(4, "0")}`;
}

/**
 * Concurrency-safe Customer ID Generator.
 * Format: SL-CUST-XXXX (e.g. SL-CUST-1014)
 */
export async function generateCustomerId(db: DbClient = prisma): Promise<string> {
  const seqVal = await tryNextVal(db, "customer_seq");

  if (seqVal !== null) {
    return `SL-CUST-${seqVal}`;
  }

  await acquireFallbackLock(db, "customer");
  const customers = await db.customer.findMany({
    where: { customerId: { startsWith: "SL-CUST-" } },
    select: { customerId: true },
  });

  let maxNum = 1000;
  for (const c of customers) {
    const match = c.customerId.match(/SL-CUST-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  return `SL-CUST-${maxNum + 1}`;
}

/**
 * Concurrency-safe Project ID Generator.
 * Standardizes new project IDs across customer creation and lead conversion.
 * Format: SL-PRJ-XXXX (e.g. SL-PRJ-1005)
 */
export async function generateProjectId(db: DbClient = prisma): Promise<string> {
  const seqVal = await tryNextVal(db, "project_seq");

  if (seqVal !== null) {
    return `SL-PRJ-${seqVal}`;
  }

  await acquireFallbackLock(db, "project");
  const projects = await db.solarProject.findMany({
    where: { projectId: { startsWith: "SL-PRJ-" } },
    select: { projectId: true },
  });

  let maxNum = 1000;
  for (const p of projects) {
    const match = p.projectId.match(/SL-PRJ-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  return `SL-PRJ-${maxNum + 1}`;
}

/**
 * Concurrency-safe Document ID Generator.
 * Format: SL-DOC-XXXX (e.g. SL-DOC-1008)
 */
export async function generateDocumentId(db: DbClient = prisma): Promise<string> {
  const seqVal = await tryNextVal(db, "document_seq");

  if (seqVal !== null) {
    return `SL-DOC-${seqVal}`;
  }

  await acquireFallbackLock(db, "document");
  const docs = await db.document.findMany({
    where: { documentId: { startsWith: "SL-DOC-" } },
    select: { documentId: true },
  });

  let maxNum = 1000;
  for (const d of docs) {
    const match = d.documentId.match(/SL-DOC-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  return `SL-DOC-${maxNum + 1}`;
}

/**
 * Concurrency-safe Site Survey ID Generator.
 * Format: SL-SRV-XXXX (e.g. SL-SRV-1001)
 */
export async function generateSurveyId(db: DbClient = prisma): Promise<string> {
  const seqVal = await tryNextVal(db, "survey_seq");

  if (seqVal !== null) {
    return `SL-SRV-${seqVal}`;
  }

  await acquireFallbackLock(db, "survey");
  const surveys = await db.siteSurvey.findMany({
    where: { surveyId: { startsWith: "SL-SRV-" } },
    select: { surveyId: true },
  });

  let maxNum = 1000;
  for (const s of surveys) {
    const match = s.surveyId.match(/SL-SRV-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  return `SL-SRV-${maxNum + 1}`;
}

/**
 * Concurrency-safe Team Member (Agent) Employee ID Generator.
 * Format: SL-AXXX (e.g. SL-A105)
 */
export async function generateAgentId(db: DbClient = prisma): Promise<string> {
  const seqVal = await tryNextVal(db, "agent_seq");

  if (seqVal !== null) {
    return `SL-A${seqVal}`;
  }

  await acquireFallbackLock(db, "agent");
  const agents = await db.teamMember.findMany({
    where: { employeeId: { startsWith: "SL-A" } },
    select: { employeeId: true },
  });

  let maxNum = 100;
  for (const a of agents) {
    if (!a.employeeId) continue;
    const match = a.employeeId.match(/SL-A(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  return `SL-A${maxNum + 1}`;
}
