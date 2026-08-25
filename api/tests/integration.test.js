"use strict";

// Database-backed integration tests (skipped by default).
//
// These verify the runtime concerns that pure unit tests cannot:
//   1. Cross-tenant isolation: an ADMIN in Org A cannot read Org B data.
//   2. Utilization report metrics (total/completed/overdue/completion-rate).
//   3. Refresh-token rotation + reuse rejection.
//   4. Dynamic role creation + permission assignment (module.action codes).
//   5. Permissions are resolved from role_permissions (DB source of truth).
//
// They require a live database with the migrations applied. Run with:
//   DB_INTEGRATION=1 npm test
// Without that flag they are skipped so `npm test` stays green offline.

const test = require("node:test");
const assert = require("node:assert");

const enabled = process.env.DB_INTEGRATION === "1";

const { sequelize, Role, User, Organization, Project, Task, TaskAssignment } =
  require("../src/models");
const { ErrorHandler } = require("../src/utils/utils");
const perms = require("../src/utils/permissions");
const projectService = require("../src/services/projectService");
const taskService = require("../src/services/taskService");
const reportService = require("../src/services/reportService");

// Find or create a role by stable code (reuses seeded roles when present).
const upsertRole = async (code, name) => {
  const [role] = await Role.findOrCreate({
    where: { code },
    defaults: { name, code, description: "test role", is_active: true },
  });
  return role;
};

// Look up a permission id by its stable code.
const permissionId = async (code) => {
  const { Permission } = require("../src/models");
  const p = await Permission.findOne({ where: { code } });
  return p ? p.id : null;
};

test(
  "cross-tenant: ADMIN from Org A cannot access Org B projects/tasks/reports",
  { skip: !enabled },
  async () => {
    const orgA = await Organization.create({ name: `it_org_a_${Date.now()}` });
    const orgB = await Organization.create({ name: `it_org_b_${Date.now()}` });
    const adminRole = await upsertRole("ADMIN", "admin");

    const userA = await User.create({
      email: `ita_${Date.now()}@example.com`,
      password: "x",
      first_name: "A",
      last_name: "A",
      role_id: adminRole.id,
      org_id: orgA.id,
    });
    const userB = await User.create({
      email: `itb_${Date.now()}@example.com`,
      password: "x",
      first_name: "B",
      last_name: "B",
      role_id: adminRole.id,
      org_id: orgB.id,
    });

    const projB = await Project.create({
      title: "Org B project",
      org_id: orgB.id,
      status: "ACTIVE",
    });
    const taskB = await Task.create({
      project_id: projB.id,
      title: "Org B task",
      status: "TODO",
    });
    await TaskAssignment.create({ task_id: taskB.id, user_id: userB.id });

    await assert.rejects(
      () => projectService.getProjectById(projB.id, orgA.id),
      (err) => err instanceof ErrorHandler && err.statusCode === 404
    );

    await assert.rejects(
      () => taskService.findTaskInOrg(taskB.id, orgA.id),
      (err) => err instanceof ErrorHandler && err.statusCode === 404
    );

    const report = await reportService.getUtilization({ orgId: orgA.id, page: 1, limit: 50 });
    const ids = report.data.map((r) => r.userId);
    assert.ok(!ids.includes(userB.id), "Org B user must not appear in Org A report");
    assert.ok(ids.includes(userA.id), "Org A user must appear in its own report");

    await TaskAssignment.destroy({ where: { task_id: taskB.id } });
    await Task.destroy({ where: { id: taskB.id } });
    await Project.destroy({ where: { id: projB.id } });
    await User.destroy({ where: { id: [userA.id, userB.id] } });
    await Organization.destroy({ where: { id: [orgA.id, orgB.id] } });
  }
);

test(
  "utilization report: computes total/completed/overdue/completionRate per org",
  { skip: !enabled },
  async () => {
    const org = await Organization.create({ name: `util_org_${Date.now()}` });
    const adminRole = await upsertRole("ADMIN", "admin");
    const memberRole = await upsertRole("MEMBER", "member");

    const reporter = await User.create({
      email: `util_r_${Date.now()}@example.com`,
      password: "x",
      first_name: "Rep",
      last_name: "Ter",
      role_id: memberRole.id,
      org_id: org.id,
    });
    const other = await User.create({
      email: `util_o_${Date.now()}@example.com`,
      password: "x",
      first_name: "Oth",
      last_name: "Er",
      role_id: memberRole.id,
      org_id: org.id,
    });

    const project = await Project.create({
      title: "Util project",
      org_id: org.id,
      status: "ACTIVE",
    });

    const past = new Date(Date.now() - 86400000);
    const future = new Date(Date.now() + 86400000);

    const t1 = await Task.create({ project_id: project.id, title: "t1", status: "DONE", due_date: past });
    const t2 = await Task.create({ project_id: project.id, title: "t2", status: "IN_PROGRESS", due_date: past });
    const t3 = await Task.create({ project_id: project.id, title: "t3", status: "TODO", due_date: future });
    const t4 = await Task.create({ project_id: project.id, title: "t4", status: "DONE", due_date: future });
    const t5 = await Task.create({ project_id: project.id, title: "t5", status: "DONE", due_date: past });

    await TaskAssignment.create({ task_id: t1.id, user_id: reporter.id });
    await TaskAssignment.create({ task_id: t2.id, user_id: reporter.id });
    await TaskAssignment.create({ task_id: t3.id, user_id: reporter.id });
    await TaskAssignment.create({ task_id: t4.id, user_id: reporter.id });
    await TaskAssignment.create({ task_id: t5.id, user_id: other.id });

    const report = await reportService.getUtilization({ orgId: org.id, page: 1, limit: 50 });
    const row = report.data.find((r) => r.userId === reporter.id);

    assert.ok(row, "reporter must appear in their org's report");
    assert.strictEqual(row.totalTasks, 4);
    assert.strictEqual(row.completedTasks, 2);
    assert.strictEqual(row.overdueTasks, 1);
    assert.strictEqual(row.completionRate, 50);

    const otherRow = report.data.find((r) => r.userId === other.id);
    assert.strictEqual(otherRow.totalTasks, 1);

    await TaskAssignment.destroy({ where: { task_id: [t1.id, t2.id, t3.id, t4.id, t5.id] } });
    await Task.destroy({ where: { id: [t1.id, t2.id, t3.id, t4.id, t5.id] } });
    await Project.destroy({ where: { id: project.id } });
    await User.destroy({ where: { id: [reporter.id, other.id] } });
    await Organization.destroy({ where: { id: org.id } });
  }
);

test(
  "refresh token rotation: issues a new pair and rejects a reused token",
  { skip: !enabled },
  async () => {
    const org = await Organization.create({ name: `rt_org_${Date.now()}` });
    const adminRole = await upsertRole("ADMIN", "admin");
    const user = await User.create({
      email: `rt_${Date.now()}@example.com`,
      password: "x",
      first_name: "Rt",
      last_name: "User",
      role_id: adminRole.id,
      org_id: org.id,
    });

    const tokenService = require("../src/services/tokenService");

    const { accessToken, refreshToken } = await tokenService.issueTokenPair(user);
    assert.ok(accessToken, "access token issued");
    assert.ok(refreshToken, "refresh token issued");

    const rotated = await tokenService.rotateRefreshToken(refreshToken);
    assert.ok(rotated.accessToken, "rotated access token issued");
    assert.ok(rotated.refreshToken, "rotated refresh token issued");
    assert.notStrictEqual(rotated.refreshToken, refreshToken, "refresh token must change");

    const canDetectReuse = !!process.env.REDIS_HOST;
    if (canDetectReuse) {
      await assert.rejects(
        () => tokenService.rotateRefreshToken(refreshToken),
        (err) => err.statusCode === 403
      );
    }

    await User.destroy({ where: { id: user.id } });
    await Organization.destroy({ where: { id: org.id } });
  }
);

test(
  "dynamic roles: admin can create a role and assign permissions at runtime",
  { skip: !enabled },
  async () => {
    const roleService = require("../src/services/roleService");
    const { Role: RoleModel } = require("../src/models");

    // Use a unique code so repeated runs never collide with leftover data.
    const code = `VIEWER_${Date.now()}`;

    // Clean any leftover role from a previous interrupted run.
    const leftover = await RoleModel.findOne({ where: { code } });
    if (leftover) await leftover.destroy();

    // Create a brand-new role at runtime (not one of the 3 default roles).
    const role = await roleService.createRole({
      name: `viewer_${Date.now()}`,
      code,
      description: "Read-only viewer",
    });
    assert.strictEqual(role.code, code);

    // Assign a single permission dynamically via permissionIds.
    const pid = await permissionId("projects.view");
    assert.ok(pid, "projects.view permission must exist");
    const updated = await roleService.assignPermissions(role.id, [pid]);
    const codes = updated.permissions.map((p) => p.code);
    assert.ok(codes.includes("projects.view"));
    assert.ok(!codes.includes("projects.create"));

    // The permission matrix now resolves the new role from the DB.
    const resolved = await perms.getRolePermissionCodes(role.id);
    assert.ok(resolved.includes("projects.view"));
    assert.ok(!resolved.includes("projects.create"));

    // Removing the permission immediately removes access.
    await roleService.assignPermissions(role.id, []);
    const after = await perms.getRolePermissionCodes(role.id);
    assert.ok(!after.includes("projects.view"));

    // Catalog lists all available permission codes (module.action convention).
    const catalog = await roleService.listPermissions();
    assert.ok(catalog.projects.some((p) => p.code === "projects.create"));

    await role.destroy();
  }
);

test(
  "member can update only tasks assigned to themselves (resource restriction)",
  { skip: !enabled },
  async () => {
    const org = await Organization.create({ name: `mem_org_${Date.now()}` });
    const memberRole = await upsertRole("MEMBER", "member");

    const m1 = await User.create({
      email: `mem1_${Date.now()}@example.com`,
      password: "x",
      first_name: "M1",
      last_name: "U",
      role_id: memberRole.id,
      org_id: org.id,
    });
    const m2 = await User.create({
      email: `mem2_${Date.now()}@example.com`,
      password: "x",
      first_name: "M2",
      last_name: "U",
      role_id: memberRole.id,
      org_id: org.id,
    });

    const project = await Project.create({
      title: "Member restriction project",
      org_id: org.id,
      status: "ACTIVE",
    });
    const task = await Task.create({
      project_id: project.id,
      title: "Shared task",
      status: "TODO",
    });
    // Task is assigned to m2 only.
    await TaskAssignment.create({ task_id: task.id, user_id: m2.id });

    // m1 (MEMBER, permission tasks.update_status) is NOT assigned -> denied.
    await assert.rejects(
      () => taskService.updateTaskStatus(task.id, org.id, m1.id, "MEMBER", "IN_PROGRESS"),
      (err) => err instanceof ErrorHandler && err.statusCode === 403
    );

    // m2 (assigned) is allowed to progress linearly.
    const res = await taskService.updateTaskStatus(
      task.id,
      org.id,
      m2.id,
      "MEMBER",
      "IN_PROGRESS"
    );
    assert.strictEqual(res.status, "IN_PROGRESS");

    await TaskAssignment.destroy({ where: { task_id: task.id } });
    await Task.destroy({ where: { id: task.id } });
    await Project.destroy({ where: { id: project.id } });
    await User.destroy({ where: { id: [m1.id, m2.id] } });
    await Organization.destroy({ where: { id: org.id } });
  }
);

// Best-effort teardown so the pool closes cleanly when integration runs.
test.after(async () => {
  if (!enabled) return;
  await sequelize.close();
  try {
    const redis = require("../src/config/redis").redis;
    if (redis && typeof redis.quit === "function") await redis.quit();
  } catch (_) {
    /* redis optional */
  }
  // The DB/Redis connection pools keep the event loop alive; exit explicitly so
  // the gated (DB_INTEGRATION=1) run does not hang after all tests complete.
  process.exit(0);
});
