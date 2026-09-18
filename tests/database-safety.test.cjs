const { test } = require("node:test");
const assert = require("node:assert/strict");
const { checkedEnvironment } = require("../scripts/with-sunlife-env.cjs");

const approved = "postgresql://user:password@ep-autumn-forest-ayafh9sa-pooler.c-5.us-east-2.aws.neon.tech/database";
const forbidden = "postgresql://user:password@ep-gentle-king-apfztpuu-pooler.c-7.us-east-1.aws.neon.tech/database";

test("project configuration overrides a foreign inherited database without mutating the shell", () => {
  const shell = { DATABASE_URL: forbidden, DIRECT_URL: forbidden, PATH: "keep" };
  const result = checkedEnvironment(shell, { DATABASE_URL: approved });
  assert.equal(result.DATABASE_URL, approved);
  assert.equal(result.DIRECT_URL, undefined);
  assert.equal(result.PATH, "keep");
  assert.equal(shell.DATABASE_URL, forbidden);
});

test("foreign, missing, malformed, and misleading hostnames are blocked before launching tools", () => {
  for (const value of [forbidden, "invalid", undefined, approved.replace(".neon.tech", ".neon.tech.attacker.test")]) {
    assert.throws(() => checkedEnvironment({ DATABASE_URL: value }, null));
  }
  assert.throws(() => checkedEnvironment({ DATABASE_URL: approved, DIRECT_URL: forbidden }, null));
  assert.throws(() => checkedEnvironment({ DATABASE_URL: approved }, { DATABASE_URL: forbidden }));
});

test("approved deployment environment works when no project .env is present", () => {
  assert.equal(checkedEnvironment({ DATABASE_URL: approved }, null).DATABASE_URL, approved);
});
