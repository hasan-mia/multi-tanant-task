"use strict";

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH"),
        allowNull: false,
        defaultValue: "MEDIUM",
      },
      status: {
        type: DataTypes.ENUM("TODO", "IN_PROGRESS", "DONE", "BLOCKED"),
        allowNull: false,
        defaultValue: "TODO",
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "tasks",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["project_id"] },
        { fields: ["status"] },
        { fields: ["priority"] },
        { fields: ["due_date"] },
      ],
    }
  );

  Task.associate = (models) => {
    Task.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });
    Task.hasMany(models.TaskAssignment, {
      foreignKey: "task_id",
      as: "taskAssignments",
    });
    Task.belongsToMany(models.User, {
      through: models.TaskAssignment,
      foreignKey: "task_id",
      otherKey: "user_id",
      as: "assignees",
    });
  };

  return Task;
};
