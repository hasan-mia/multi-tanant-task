"use strict";

// Seeds the three assessment business roles with stable codes. The numeric
// `score` system has been removed; authorization is driven purely by the
// `code`/role enum (ADMIN / MANAGER / MEMBER).

const ROLES = [
  { name: "admin", code: "ADMIN", description: "Administrator with management access" },
  { name: "manager", code: "MANAGER", description: "Organization manager: projects, tasks and assignments" },
  { name: "member", code: "MEMBER", description: "Organization member: assigned tasks only" },
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const role of ROLES) {
      const [existing] = await queryInterface.sequelize.query(
        "SELECT id FROM roles WHERE code = ? LIMIT 1",
        { replacements: [role.code], type: Sequelize.QueryTypes.SELECT }
      );

      if (existing) {
        await queryInterface.sequelize.query(
          "UPDATE roles SET name = ?, description = ?, updated_at = ? WHERE id = ?",
          {
            replacements: [role.name, role.description, new Date(), existing.id],
            type: Sequelize.QueryTypes.UPDATE,
          }
        );
      } else {
        await queryInterface.sequelize.query(
          "INSERT INTO roles (id, name, code, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          {
            replacements: [
              require("uuid").v4(),
              role.name,
              role.code,
              role.description,
              true,
              new Date(),
              new Date(),
            ],
            type: Sequelize.QueryTypes.INSERT,
          }
        );
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "DELETE FROM roles WHERE code IN ('ADMIN','MANAGER','MEMBER')"
    );
  },
};
