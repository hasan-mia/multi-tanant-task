"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "task_assignments",
      {
        task_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
        },
        assigned_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        indexes: [
          { fields: ["user_id"] },
          { fields: ["user_id", "task_id"] },
        ],
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("task_assignments");
  },
};
