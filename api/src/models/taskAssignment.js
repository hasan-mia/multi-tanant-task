"use strict";

module.exports = (sequelize, DataTypes) => {
  const TaskAssignment = sequelize.define(
    "TaskAssignment",
    {
      task_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "task_assignments",
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["user_id", "task_id"] },
      ],
    }
  );

  TaskAssignment.associate = (models) => {
    TaskAssignment.belongsTo(models.Task, {
      foreignKey: "task_id",
      as: "task",
    });
    TaskAssignment.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return TaskAssignment;
};
