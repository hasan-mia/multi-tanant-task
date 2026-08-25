"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "permissions",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        module: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        action: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        resource: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: true,
          unique: true,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        status: {
          type: Sequelize.STRING(15),
          allowNull: false,
          defaultValue: "active",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      },
      {
        indexes: [
          {
            name: "unique_permission_code",
            unique: true,
            fields: ["code"],
          },
          {
            name: "unique_permission",
            unique: true,
            fields: ["module", "action", "resource"],
          },
        ],
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("permissions");
  },
};
