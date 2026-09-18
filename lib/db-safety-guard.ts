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

  // Optional: warn if not connecting to a known Sunlife host
  const isKnownHost = ALLOWED_HOSTS.some(host => databaseUrl.includes(host));
  if (!isKnownHost && databaseUrl) {
    console.warn(
      `⚠️  WARNING: DATABASE_URL does not match any known Sunlife Solar database.\n` +
      `   Please verify the connection is correct before proceeding.`
    );
  }
}

// Auto-run on import
assertSunlifeDatabase();
