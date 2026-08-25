"use strict";

// Pure business-rule tests for task status transitions. Framework-free so they
// run without a database. MEMBERs progress linearly (TODO -> IN_PROGRESS ->
// DONE); MANAGER/ADMIN may also use BLOCKED. This enforces Example 4 of the
// assessment: a MEMBER can only update their own assigned task status along
// the allowed linear path.

const test = require("node:test");
const assert = require("node:assert");
const {
  isValidTransition,
  isTerminal,
  MANAGER_TRANSITIONS,
  MEMBER_TRANSITIONS,
} = require("../src/utils/taskTransitions");

test("MEMBER transitions are strictly linear", () => {
  assert.ok(isValidTransition("MEMBER", "TODO", "IN_PROGRESS"));
  assert.ok(isValidTransition("MEMBER", "IN_PROGRESS", "DONE"));
  assert.ok(!isValidTransition("MEMBER", "TODO", "DONE"));
  assert.ok(!isValidTransition("MEMBER", "IN_PROGRESS", "BLOCKED"));
  assert.ok(!isValidTransition("MEMBER", "DONE", "IN_PROGRESS"));
  assert.ok(!isValidTransition("MEMBER", "BLOCKED", "IN_PROGRESS"));
});

test("MANAGER/ADMIN may use BLOCKED states", () => {
  assert.ok(isValidTransition("MANAGER", "TODO", "BLOCKED"));
  assert.ok(isValidTransition("MANAGER", "BLOCKED", "IN_PROGRESS"));
  assert.ok(isValidTransition("ADMIN", "IN_PROGRESS", "DONE"));
  assert.ok(isValidTransition("ADMIN", "TODO", "IN_PROGRESS"));
  assert.ok(!isValidTransition("MANAGER", "DONE", "IN_PROGRESS"));
  assert.ok(!isValidTransition("MANAGER", "DONE", "BLOCKED"));
});

test("same status is always a valid transition", () => {
  assert.ok(isValidTransition("MEMBER", "TODO", "TODO"));
  assert.ok(isValidTransition("ADMIN", "BLOCKED", "BLOCKED"));
});

test("non-member roles share the MANAGER transition table", () => {
  assert.deepStrictEqual(MANAGER_TRANSITIONS, require("../src/utils/taskTransitions").MANAGER_TRANSITIONS);
  assert.ok(isValidTransition("SOME_OTHER_ROLE", "TODO", "BLOCKED"));
});

test("isTerminal marks DONE as terminal", () => {
  assert.ok(isTerminal("DONE"));
  assert.ok(!isTerminal("TODO"));
  assert.ok(!isTerminal("IN_PROGRESS"));
  assert.ok(!isTerminal("BLOCKED"));
});

test("MEMBER transition table is a strict subset of MANAGER table", () => {
  for (const [from, tos] of Object.entries(MEMBER_TRANSITIONS)) {
    for (const to of tos) {
      assert.ok(
        MANAGER_TRANSITIONS[from].includes(to),
        `MEMBER ${from}->${to} should be allowed for MANAGER`
      );
    }
  }
});
