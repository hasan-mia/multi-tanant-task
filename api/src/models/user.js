"use strict";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      org_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "organizations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      role_id: {
        type: DataTypes.UUID,
        references: { model: "roles", key: "id" },
      },
      status: {
        type: DataTypes.ENUM("pending", "active", "suspended"),
        defaultValue: "active",
      },
      otp: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      last_login: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "roleRecord",
    });
    User.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization",
    });
    User.hasMany(models.TaskAssignment, {
      foreignKey: "user_id",
      as: "taskAssignments",
    });
    User.belongsToMany(models.Task, {
      through: models.TaskAssignment,
      foreignKey: "user_id",
      otherKey: "task_id",
      as: "assignedTasks",
    });
  };

  return User;
};
