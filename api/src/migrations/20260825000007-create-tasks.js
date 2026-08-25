"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "tasks",
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.UUIDV4,
        },
        project_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        priority: {
          type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH"),
          allowNull: false,
          defaultValue: "MEDIUM",
        },
        status: {
          type: Sequelize.ENUM("TODO", "IN_PROGRESS", "DONE", "BLOCKED"),
          allowNull: false,
          defaultValue: "TODO",
        },
        due_date: {
          type: Sequelize.DATE,
          allowNull: true,
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
          { fields: ["project_id"] },
          { fields: ["status"] },
          { fields: ["priority"] },
          { fields: ["due_date"] },
        ],
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("tasks");
  },
};
