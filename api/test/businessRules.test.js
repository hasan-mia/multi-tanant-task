"use strict";

const test = require("node:test");
const assert = require("node:assert");
const {
  isValidTransition,
  isTerminal,
} = require("../src/utils/taskTransitions");
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
const MANAGER = ["projects.view", "tasks.view", "tasks.assign", "tasks.update_status", "reports.view"];
const MEMBER = ["tasks.view", "tasks.update_status"];

test.beforeEach(() => {
  perms.__setTestCache({ [ADMIN_ID]: ALL, [MANAGER_ID]: MANAGER, [MEMBER_ID]: MEMBER });
});
test.afterEach(() => perms.__clearTestCache());

test("manager transitions: TODO -> IN_PROGRESS allowed", () => {
  assert.strictEqual(isValidTransition("MANAGER", "TODO", "IN_PROGRESS"), true);
});

test("manager transitions: TODO -> DONE blocked", () => {
  assert.strictEqual(isValidTransition("MANAGER", "TODO", "DONE"), false);
});

test("manager transitions: IN_PROGRESS -> DONE allowed", () => {
  assert.strictEqual(isValidTransition("MANAGER", "IN_PROGRESS", "DONE"), true);
});

test("manager transitions: BLOCKED -> IN_PROGRESS allowed", () => {
  assert.strictEqual(isValidTransition("MANAGER", "BLOCKED", "IN_PROGRESS"), true);
});

test("member transitions: only linear TODO -> IN_PROGRESS -> DONE", () => {
  assert.strictEqual(isValidTransition("MEMBER", "TODO", "IN_PROGRESS"), true);
  assert.strictEqual(isValidTransition("MEMBER", "IN_PROGRESS", "DONE"), true);
  assert.strictEqual(isValidTransition("MEMBER", "TODO", "DONE"), false);
  assert.strictEqual(isValidTransition("MEMBER", "TODO", "BLOCKED"), false);
});

test("same status is always a valid (no-op) transition", () => {
  assert.strictEqual(isValidTransition("ADMIN", "TODO", "TODO"), true);
});

test("DONE is terminal", () => {
  assert.strictEqual(isTerminal("DONE"), true);
  assert.strictEqual(isTerminal("TODO"), false);
});

test("permission matrix matches the seeded spec (module.action)", async () => {
  const admin = await perms.getRolePermissionCodes(ADMIN_ID);
  for (const p of ALL) {
    assert.ok(admin.includes(p), `ADMIN should have ${p}`);
  }

  const manager = await perms.getRolePermissionCodes(MANAGER_ID);
  for (const p of MANAGER) {
    assert.ok(manager.includes(p), `MANAGER should have ${p}`);
  }
  assert.strictEqual(manager.includes("projects.create"), false);
  assert.strictEqual(manager.includes("users.create"), false);

  const member = await perms.getRolePermissionCodes(MEMBER_ID);
  assert.deepStrictEqual([...member].sort(), [...MEMBER].sort());
});

test("an unknown role id gets no permissions (fail-closed)", async () => {
  perms.__setTestCache({ nope: [] });
  const got = await perms.getRolePermissionCodes("nope");
  assert.deepStrictEqual(got, []);
});
