const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");

function load(file, globals) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = { exports: {}, Request, Response, URL, AbortController, Event, clearTimeout, ...globals };
  vm.runInNewContext(source, context);
  return context.exports;
}

test("reads bypass cache; only confirmed writes notify other views", async () => {
  const window = new EventTarget();
  window.setTimeout = setTimeout;
  let requestOptions;
  let response = new Response('{}');
  const api = load("lib/admin-live.ts", { window, fetch: async (_, options) => { requestOptions = options; return response; } });
  let changed = 0;
  window.addEventListener(api.ADMIN_DATA_CHANGED, () => changed++);
  await api.adminFetch("/api/team");
  assert.equal(requestOptions.cache, "no-store");
  assert.equal(changed, 0);
  response = new Response('{"error":"Save rejected"}', { status: 409 });
  await assert.rejects(api.adminFetch("/api/team", { method: "PUT" }), /Save rejected/);
  assert.equal(changed, 0);
  assert.equal(api.getAdminConnection().error, "Save rejected");
  response = new Response('{}');
  await api.adminFetch("/api/team", { method: "PUT" });
  assert.equal(changed, 1);
  assert.equal(api.getAdminConnection().error, "");
});

test("polling pauses while hidden/offline, avoids overlap, and cleans up", async () => {
  const window = new EventTarget();
  const document = new EventTarget();
  document.visibilityState = "visible";
  const navigator = { onLine: true };
  const effects = [];
  const timers = new Map();
  let id = 0;
  const hook = load("lib/use-live-refresh.ts", {
    window, document, navigator,
    setTimeout: (fn) => { timers.set(++id, fn); return id; }, clearTimeout: (key) => timers.delete(key),
    require: (name) => name === "react" ? { useRef: (value) => ({ current: value }), useEffect: (fn) => effects.push(fn) } : { ADMIN_DATA_CHANGED: "changed", ADMIN_CHANNEL: "channel" },
  });
  let calls = 0;
  let resolve;
  hook.useLiveRefresh(() => { calls++; return new Promise((done) => { resolve = done; }); });
  const cleanups = effects.map((fn) => fn());
  const fire = () => window.dispatchEvent(new Event("focus"));
  document.visibilityState = "hidden";
  fire(); assert.equal(calls, 0);
  document.visibilityState = "visible";
  navigator.onLine = false;
  fire(); assert.equal(calls, 0);
  navigator.onLine = true;
  fire(); fire(); assert.equal(calls, 1);
  resolve(); await new Promise(setImmediate);
  fire(); assert.equal(calls, 2);
  cleanups.forEach((fn) => fn?.());
  resolve(); await new Promise(setImmediate);
  fire(); assert.equal(calls, 2);
  assert.equal(timers.size, 0);
});

test("invalid bulk attendance rolls back earlier records", async () => {
  let committed = [];
  const prisma = {
    $transaction: async (run) => {
      const pending = [];
      const result = await run({ attendance: {
        findUnique: async () => null,
        upsert: async (operation) => {
          const row = { ...operation.create, updatedAt: new Date() };
          pending.push(row);
          return row;
        },
      } });
      committed = pending;
      return result;
    },
  };
  const route = load("app/api/attendance/route.ts", {
    console: { error() {} },
    require: (name) => name === "next/server" ? { NextResponse: { json: (body, init) => Response.json(body, init) } } : { prisma },
  });
  const records = [
    { memberId: "one", date: "2026-09-18", status: "Present" },
    { memberId: "two", date: "2026-09-18", status: "Invalid" },
  ];
  const request = (items) => new Request("http://localhost/api/attendance", { method: "PUT", body: JSON.stringify({ records: items }) });
  assert.equal((await route.PUT(request(records))).status, 400);
  assert.equal(committed.length, 0);
  assert.equal((await route.PUT(request(records.slice(0, 1)))).status, 200);
  assert.equal(committed.length, 1);
});
