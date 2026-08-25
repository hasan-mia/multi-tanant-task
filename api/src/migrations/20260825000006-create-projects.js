"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "projects",
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.UUIDV4,
        },
        org_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        budget: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
          defaultValue: 0.0,
        },
        status: {
          type: Sequelize.ENUM("DRAFT", "ACTIVE", "ARCHIVED"),
          allowNull: false,
          defaultValue: "DRAFT",
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
      },
      {
        indexes: [
          { fields: ["org_id"] },
          { fields: ["org_id", "status"] },
        ],
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("projects");
  },
};
