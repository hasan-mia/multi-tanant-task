"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "organizations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "roles", key: "id" },
      },
      status: {
        type: Sequelize.ENUM("pending", "active", "suspended"),
        allowNull: false,
        defaultValue: "active",
      },
      otp: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      last_login: {
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
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("users");
  },
};
