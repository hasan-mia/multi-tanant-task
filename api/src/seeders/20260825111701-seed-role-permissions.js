"use strict";

// Seeds the role -> permission mapping for the three default assessment roles.
// ADMIN / MANAGER / MEMBER are DEFAULT roles, not hardcoded authorization
// rules: admins can later add roles or re-assign permissions via the API. This
// seeder only establishes the initial baseline.

const ROLE_PERMISSION_MAP = {
  ADMIN: [
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
  ],
  MANAGER: [
    "projects.view",
    "tasks.view",
    "tasks.assign",
    "tasks.update_status",
    "reports.view",
  ],
  MEMBER: ["tasks.view", "tasks.update_status"],
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { Role, Permission, RolePermission } = require("../models");

    const roles = await Role.findAll({
      where: { code: ["ADMIN", "MANAGER", "MEMBER"] },
    });
    const permissions = await Permission.findAll();

    const rows = [];
    for (const role of roles) {
      const codes = ROLE_PERMISSION_MAP[role.code] || [];
      for (const code of codes) {
        const perm = permissions.find((p) => p.code === code);
        if (perm) rows.push({ role_id: role.id, permission_id: perm.id });
      }
    }

    if (rows.length) {
      await RolePermission.bulkCreate(rows, { ignoreDuplicates: true });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("role_permissions", null, {});
  },
};
