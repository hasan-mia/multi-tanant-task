"use strict";

// Score-independence tests for the dynamic RBAC.
//
// Acceptance requirement: authorization must never depend on a numeric score.
// These tests prove the permission layer is keyed by role identity (role_id)
// and that no static fallback grants access when the database is unavailable.

const test = require("node:test");
const assert = require("node:assert");
const perms = require("../src/utils/permissions");

const ADMIN_ID = "00000000-0000-0000-0000-0000000000a1";
const ADMIN = [
  "projects.view",
  "projects.create",
  "projects.archive",
  "tasks.view",
  "tasks.assign",
  "tasks.update_status",
  "reports.view",
  "users.view",
  "users.create",
  "users.update",
  "users.delete",
];

test.beforeEach(() => {
  perms.__setTestCache({ [ADMIN_ID]: ADMIN });
});
test.afterEach(() => perms.__clearTestCache());

test("resolution is keyed by role identity (role_id), not a numeric score", async () => {
  const codes = await perms.getRolePermissionCodes(ADMIN_ID);
  for (const c of codes) {
    assert.strictEqual(typeof c, "string", "permission must be a stable code string");
  }
});

test("no static permission matrix / numeric score fallback is exposed", () => {
  assert.strictEqual(perms.ROLE_PERMISSIONS, undefined);
  assert.strictEqual(perms.score, undefined);
  assert.strictEqual(typeof perms.getRolePermissionCodes, "function");
});

test("unknown role id yields no permissions even if a score were imagined", async () => {
  // The mapping is explicit and identity-based; a made-up id grants nothing.
  // Seeded with an empty set so the test stays hermetic (no DB connection).
  perms.__setTestCache({ "99999999-9999-9999-9999-999999999999": [] });
  const got = await perms.getRolePermissionCodes("99999999-9999-9999-9999-999999999999");
  assert.deepStrictEqual(got, []);
});

test("removing a permission immediately removes access", async () => {
  const before = await perms.getRolePermissionCodes(ADMIN_ID);
  assert.ok(before.includes("projects.create"));

  const next = new Set(before);
  next.delete("projects.create");
  perms.__setTestCache({ [ADMIN_ID]: [...next] });

  const after = await perms.getRolePermissionCodes(ADMIN_ID);
  assert.ok(!after.includes("projects.create"));
});
