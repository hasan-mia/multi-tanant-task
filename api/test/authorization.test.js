"use strict";

// Authorization middleware behavior (pure unit, seeded cache — no DB).
const test = require("node:test");
const assert = require("node:assert");
const { getRolePermissionCodes, getRoleCode } = require("../src/utils/permissions");
const { requireRole, requirePermission } = require("../src/middleware/authorization");

const ADMIN_ID = "00000000-0000-0000-0000-0000000000a1";
const MANAGER_ID = "00000000-0000-0000-0000-0000000000b1";
const MEMBER_ID = "00000000-0000-0000-0000-0000000000c1";

const ALL = [
  "users.view",
  "users.create",
  "users.update",
  "users.delete",
  "projects.view",
  "projects.create",
  "projects.update",
  "projects.delete",
  "projects.archive",
  "tasks.view",
  "tasks.create",
  "tasks.update",
  "tasks.delete",
  "tasks.assign",
  "tasks.update_status",
  "reports.view",
];
const MANAGER = ["projects.view", "tasks.view", "tasks.assign", "tasks.update_status", "reports.view"];
const MEMBER = ["tasks.view", "tasks.update_status"];

const perms = require("../src/utils/permissions");
const runMw = (mw, user) =>
  new Promise((resolve) => {
    mw({ user }, {}, (err) => resolve(err || null));
  });

test.beforeEach(() => {
  perms.__setTestCache({ [ADMIN_ID]: ALL, [MANAGER_ID]: MANAGER, [MEMBER_ID]: MEMBER });
});
test.afterEach(() => perms.__clearTestCache());

test("ADMIN permissions are exactly the seeded list (no auto-inheritance from elsewhere)", async () => {
  const got = await getRolePermissionCodes(ADMIN_ID);
  assert.deepStrictEqual([...got].sort(), [...ALL].sort());
});

test("MANAGER has tasks.assign/tasks.update_status but not projects.create", async () => {
  const got = await getRolePermissionCodes(MANAGER_ID);
  assert.ok(got.includes("tasks.assign"));
  assert.ok(got.includes("tasks.update_status"));
  assert.ok(got.includes("reports.view"));
  assert.strictEqual(got.includes("projects.create"), false);
});

test("MEMBER has only tasks.view + tasks.update_status", async () => {
  const got = await getRolePermissionCodes(MEMBER_ID);
  assert.deepStrictEqual([...got].sort(), [...MEMBER].sort());
});

test("getRoleCode resolves a Role object to an uppercase code", () => {
  assert.strictEqual(getRoleCode({ code: "ADMIN" }), "ADMIN");
  assert.strictEqual(getRoleCode({ name: "admin" }), "ADMIN");
  assert.strictEqual(getRoleCode({ name: "manager" }), "MANAGER");
});

test("requireRole allows matching role and rejects others (403)", async () => {
  assert.strictEqual(await runMw(requireRole("ADMIN"), { role: "ADMIN" }), null);
  assert.strictEqual((await runMw(requireRole("ADMIN"), { role: "MANAGER" })).statusCode, 403);
  assert.strictEqual(
    (await runMw(requireRole("ADMIN", "MANAGER"), { role: "MEMBER" })).statusCode,
    403
  );
});

test("requirePermission: MANAGER can tasks.assign, MEMBER cannot", async () => {
  assert.strictEqual(
    await runMw(requirePermission("tasks.assign"), { roleId: MANAGER_ID, role: "MANAGER" }),
    null
  );
  assert.strictEqual(
    (await runMw(requirePermission("tasks.assign"), { roleId: MEMBER_ID, role: "MEMBER" })).statusCode,
    403
  );
});

test("requirePermission: ADMIN can projects.create, MEMBER cannot", async () => {
  assert.strictEqual(
    await runMw(requirePermission("projects.create"), { roleId: ADMIN_ID, role: "ADMIN" }),
    null
  );
  assert.strictEqual(
    (await runMw(requirePermission("projects.create"), { roleId: MEMBER_ID, role: "MEMBER" })).statusCode,
    403
  );
});

test("Authorization fails closed when the role has no mapped permissions (no static fallback)", async () => {
  // Cache present, but the role maps to an empty set (e.g. DB unavailable at
  // load time or no permissions assigned): access must be denied.
  perms.__setTestCache({ [ADMIN_ID]: [] });
  assert.strictEqual(
    (await runMw(requirePermission("projects.create"), { roleId: ADMIN_ID, role: "ADMIN" })).statusCode,
    403
  );
});
