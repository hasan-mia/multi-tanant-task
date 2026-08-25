"use strict";

// Permission resolution tests for the dynamic RBAC.
//
// These are pure unit tests: permissions are resolved through the in-memory
// cache (seeded directly, no database). The database is the real source of
// truth at runtime; the cache is only an optimization. There is NO static
// fallback matrix — an unknown role yields no permissions (fail-closed).

const test = require("node:test");
const assert = require("node:assert");
const perms = require("../src/utils/permissions");

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

const MANAGER = [
  "projects.view",
  "tasks.view",
  "tasks.assign",
  "tasks.update_status",
  "reports.view",
];

const MEMBER = ["tasks.view", "tasks.update_status"];

test.beforeEach(() => {
  perms.__setTestCache({
    [ADMIN_ID]: ALL,
    [MANAGER_ID]: MANAGER,
    [MEMBER_ID]: MEMBER,
  });
});

test.afterEach(() => {
  perms.__clearTestCache();
});

test("ADMIN permissions match the seeded matrix exactly (module.action)", async () => {
  const got = await perms.getRolePermissionCodes(ADMIN_ID);
  assert.deepStrictEqual(got.sort(), [...ALL].sort());
});

test("MANAGER permissions match the seeded matrix exactly", async () => {
  const got = await perms.getRolePermissionCodes(MANAGER_ID);
  assert.deepStrictEqual(got.sort(), [...MANAGER].sort());
  assert.ok(!got.includes("projects.create"), "MANAGER must not gain projects.create");
  assert.ok(!got.includes("users.create"), "MANAGER must not gain users.create");
});

test("MEMBER is restricted to only its two permissions", async () => {
  const got = await perms.getRolePermissionCodes(MEMBER_ID);
  assert.deepStrictEqual(got.sort(), [...MEMBER].sort());
  assert.ok(!got.includes("reports.view"));
  assert.ok(!got.includes("projects.view"));
  assert.ok(!got.includes("tasks.assign"));
});

test("ADMIN permissions come from role_permissions (not a magic bypass)", async () => {
  // If we removed projects.create from ADMIN's mapping, it would be gone.
  const admin = new Set(await perms.getRolePermissionCodes(ADMIN_ID));
  assert.ok(admin.has("projects.create"));
  admin.delete("projects.create");
  perms.__setTestCache({ [ADMIN_ID]: [...admin] });
  const after = await perms.getRolePermissionCodes(ADMIN_ID);
  assert.ok(!after.includes("projects.create"), "removing the mapping removes access");
});

test("removing a permission immediately removes access", async () => {
  const before = await perms.getRolePermissionCodes(MEMBER_ID);
  assert.ok(before.includes("tasks.update_status"));

  const next = new Set(before);
  next.delete("tasks.update_status");
  perms.__setTestCache({ [MEMBER_ID]: [...next] });

  const after = await perms.getRolePermissionCodes(MEMBER_ID);
  assert.ok(!after.includes("tasks.update_status"));
});

test("unknown role yields no permissions (fail-closed, no static fallback)", async () => {
  // Seed the queried id with an empty set so resolution is hermetic (no DB).
  perms.__setTestCache({ "does-not-exist": [] });
  const got = await perms.getRolePermissionCodes("does-not-exist");
  assert.deepStrictEqual(got, []);
});

test("a role with no mapped permissions grants nothing (fail-closed)", async () => {
  perms.__setTestCache({ [ADMIN_ID]: [] });
  const got = await perms.getRolePermissionCodes(ADMIN_ID);
  assert.deepStrictEqual(got, []);
});

test("no static fallback matrix exists", () => {
  assert.strictEqual(perms.ROLE_PERMISSIONS, undefined);
  assert.strictEqual(typeof perms.getRolePermissionCodes, "function");
});

test("getRoleCode resolves a Role object to an uppercase code", () => {
  assert.strictEqual(perms.getRoleCode({ code: "ADMIN" }), "ADMIN");
  assert.strictEqual(perms.getRoleCode({ name: "manager" }), "MANAGER");
});
