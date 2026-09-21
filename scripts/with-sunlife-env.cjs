// Never inherit another project's database when running this project's tools.
const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");
const { spawnSync } = require("node:child_process");

// Both pooler (for app connections) and non-pooler (for migrations) are valid
const EXPECTED_HOSTS = [
  "ep-autumn-forest-ayafh9sa-pooler.c-5.us-east-2.aws.neon.tech",
  "ep-autumn-forest-ayafh9sa.c-5.us-east-2.aws.neon.tech",
];

function checkedEnvironment(shellEnv, fileEnv) {
  const env = { ...shellEnv };
  // Inspect the inherited values, but explicitly replace them with project values.
  // No process or database client is started until the final target is verified.
  if (fileEnv) {
    for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
      delete env[key];
      if (fileEnv[key]) env[key] = fileEnv[key];
    }
  }
  if (!env.DATABASE_URL) throw new Error("Sunlife DATABASE_URL is missing.");
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    if (!env[key]) continue;
    const url = new URL(env[key]);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !EXPECTED_HOSTS.includes(url.hostname)) {
      throw new Error(`${key} is not the approved Sunlife database. Operation blocked.`);
    }
  }
  return env;
}

module.exports = { checkedEnvironment };

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, "..");
    const envFile = path.join(root, ".env");
    const env = checkedEnvironment(process.env, fs.existsSync(envFile) ? parseEnv(fs.readFileSync(envFile, "utf8")) : null);
    const [command, ...args] = process.argv.slice(2);
    const entries = { next: "next/dist/bin/next", prisma: "prisma/build/index.js", "check-db": "./check-database.cjs" };
    if (!entries[command]) throw new Error("Use next, prisma, or check-db.");
    console.log("Verified Sunlife database target; using project .env when present.");
    const result = spawnSync(process.execPath, [require.resolve(entries[command]), ...args], { cwd: root, env, stdio: "inherit" });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
