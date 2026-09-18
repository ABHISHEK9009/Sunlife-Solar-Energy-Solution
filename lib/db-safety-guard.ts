/**
 * DATABASE SAFETY GUARD — Sunlife Solar
 * 
 * Prevents accidental connection to the Bima Headquarter database.
 * Import this at the top of any database script, seed file, or migration helper.
 */

const FORBIDDEN_HOSTS = [
  "ep-gentle-king-apfztpuu-pooler.c-7.us-east-1.aws.neon.tech",
];

const ALLOWED_HOSTS = [
  "ep-autumn-forest-ayafh9sa-pooler.c-5.us-east-2.aws.neon.tech",
];

export function assertSunlifeDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL || "";
  const directUrl = process.env.DIRECT_URL || "";

  for (const url of [databaseUrl, directUrl]) {
    if (!url) continue;

    for (const forbidden of FORBIDDEN_HOSTS) {
      if (url.includes(forbidden)) {
        throw new Error(
          `\n🚨 CRITICAL SAFETY BLOCK 🚨\n` +
          `Sunlife Solar attempted to connect to the Bima Headquarter database.\n` +
          `Forbidden host detected: ${forbidden}\n` +
          `This operation has been BLOCKED to prevent data corruption.\n` +
          `Please verify your DATABASE_URL environment variable.\n`
        );
      }
    }
  }

  for (const [name, value] of [["DATABASE_URL", databaseUrl], ["DIRECT_URL", directUrl]]) {
    if (!value) continue;
    let url: URL;
    try { url = new URL(value); }
    catch { throw new Error(`${name} is invalid. Database connection blocked.`); }
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !ALLOWED_HOSTS.includes(url.hostname)) {
      throw new Error(`${name} is not the approved Sunlife database. Connection blocked.`);
    }
  }
}

// Auto-run on import
assertSunlifeDatabase();
