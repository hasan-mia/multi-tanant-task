"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "role_permissions",
      {
        role_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          references: { model: "roles", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        permission_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: "permissions", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      {
        indexes: [{ fields: ["permission_id"] }],
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("role_permissions");
  },
};
