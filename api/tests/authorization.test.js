"use strict";

// Centralized authorization middleware tests.
// Verifies requireAuth / requireRole / requirePermission behave per the
// database-driven permission model (no score, no static fallback).

const test = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const {
  requireAuth,
  requireRole,
  requirePermission,
} = require("../src/middleware/authorization");
const perms = require("../src/utils/permissions");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

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

const validToken = (payload = { userId: "u1", orgId: "o1", role: "ADMIN" }) =>
  "Bearer " + jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5m" });

const run = (mw, req) =>
  new Promise((resolve) => {
    const res = {};
    const p = mw(req, res, (err) => resolve(err || null));
    if (p && typeof p.catch === "function") p.catch((e) => resolve(e));
  });

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

test("requireAuth denies an unauthenticated request (401)", async () => {
  const err = await run(requireAuth, { headers: {}, user: undefined });
  assert.ok(err instanceof Error);
  assert.strictEqual(err.statusCode, 401);
});

test("requireAuth allows a request with a valid access token", async () => {
  const err = await run(requireAuth, {
    headers: { authorization: validToken() },
    method: "GET",
    user: undefined,
  });
  assert.strictEqual(err, null);
});

test("requireRole('ADMIN') allows ADMIN and denies MANAGER/MEMBER", async () => {
  assert.strictEqual(
    await run(requireRole("ADMIN"), { user: { role: "ADMIN" } }),
    null
  );
  const mgr = await run(requireRole("ADMIN"), { user: { role: "MANAGER" } });
  assert.strictEqual(mgr.statusCode, 403);
  const mem = await run(requireRole("ADMIN"), { user: { role: "MEMBER" } });
  assert.strictEqual(mem.statusCode, 403);
});

test("requirePermission('projects.create'): ADMIN yes, MANAGER/MEMBER no", async () => {
  assert.strictEqual(
    await run(requirePermission("projects.create"), {
      user: { roleId: ADMIN_ID, role: "ADMIN", orgId: "o1" },
    }),
    null
  );
  const mgr = await run(requirePermission("projects.create"), {
    user: { roleId: MANAGER_ID, role: "MANAGER", orgId: "o1" },
  });
  assert.strictEqual(mgr.statusCode, 403);
  const mem = await run(requirePermission("projects.create"), {
    user: { roleId: MEMBER_ID, role: "MEMBER", orgId: "o1" },
  });
  assert.strictEqual(mem.statusCode, 403);
});

test("requirePermission('tasks.assign'): MANAGER yes, MEMBER no", async () => {
  assert.strictEqual(
    await run(requirePermission("tasks.assign"), {
      user: { roleId: MANAGER_ID, role: "MANAGER", orgId: "o1" },
    }),
    null
  );
  const mem = await run(requirePermission("tasks.assign"), {
    user: { roleId: MEMBER_ID, role: "MEMBER", orgId: "o1" },
  });
  assert.strictEqual(mem.statusCode, 403);
});

test("requirePermission('tasks.view'): MEMBER yes", async () => {
  assert.strictEqual(
    await run(requirePermission("tasks.view"), {
      user: { roleId: MEMBER_ID, role: "MEMBER", orgId: "o1" },
    }),
    null
  );
});

test("DB failure / empty cache does NOT grant access via static fallback", async () => {
  // Simulate the role having no permission mapping loaded (e.g. DB unavailable
  // at load time): cache present but the role maps to an empty set.
  perms.__setTestCache({ [ADMIN_ID]: [] });
  const admin = await run(requirePermission("projects.create"), {
    user: { roleId: ADMIN_ID, role: "ADMIN", orgId: "o1" },
  });
  assert.strictEqual(admin.statusCode, 403);
});

test("role codes are case-insensitive in requireRole", async () => {
  assert.strictEqual(
    await run(requireRole("ADMIN"), { user: { role: "admin" } }),
    null
  );
});
