"use strict";

// Seeds the assessment (Project/Task) permissions using the canonical
// `module.action` naming convention (e.g. projects.create, tasks.assign).
// The legacy numeric `required_score` system has been removed; authorization is
// resolved dynamically from role_permissions. Codes are unique and stable.

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const permissions = [
      { code: "users.view", module: "users", action: "view", resource: null, description: "View organization users" },
      { code: "users.create", module: "users", action: "create", resource: null, description: "Create organization users" },
      { code: "users.update", module: "users", action: "update", resource: null, description: "Update organization users" },
      { code: "users.delete", module: "users", action: "delete", resource: null, description: "Delete organization users" },

      { code: "projects.view", module: "projects", action: "view", resource: null, description: "View projects" },
      { code: "projects.create", module: "projects", action: "create", resource: null, description: "Create projects" },
      { code: "projects.update", module: "projects", action: "update", resource: null, description: "Update projects" },
      { code: "projects.delete", module: "projects", action: "delete", resource: null, description: "Delete projects" },
      { code: "projects.archive", module: "projects", action: "archive", resource: null, description: "Archive projects" },

      { code: "tasks.view", module: "tasks", action: "view", resource: null, description: "View tasks" },
      { code: "tasks.create", module: "tasks", action: "create", resource: null, description: "Create tasks" },
      { code: "tasks.update", module: "tasks", action: "update", resource: null, description: "Update tasks" },
      { code: "tasks.delete", module: "tasks", action: "delete", resource: null, description: "Delete tasks" },
      { code: "tasks.assign", module: "tasks", action: "assign", resource: null, description: "Assign tasks to users" },
      { code: "tasks.update_status", module: "tasks", action: "update_status", resource: null, description: "Update task status" },

      { code: "reports.view", module: "reports", action: "view", resource: null, description: "View utilization reports" },
    ];

    await Promise.all(
      permissions.map((perm) =>
        queryInterface.sequelize.query(
          `INSERT IGNORE INTO permissions
           (code, module, action, resource, description, status, created_at, updated_at)
           VALUES (:code, :module, :action, :resource, :description, 'active', :created_at, :updated_at)`,
          {
            replacements: { ...perm, created_at: new Date(), updated_at: new Date() },
            type: queryInterface.sequelize.QueryTypes.INSERT,
          }
        )
      )
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "DELETE FROM permissions WHERE code IN ('users.view','users.create','users.update','users.delete','projects.view','projects.create','projects.update','projects.delete','projects.archive','tasks.view','tasks.create','tasks.update','tasks.delete','tasks.assign','tasks.update_status','reports.view')"
    );
  },
};
