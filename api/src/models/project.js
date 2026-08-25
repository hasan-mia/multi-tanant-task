"use strict";

module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      org_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      budget: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      status: {
        type: DataTypes.ENUM("DRAFT", "ACTIVE", "ARCHIVED"),
        allowNull: false,
        defaultValue: "DRAFT",
      },
    },
    {
      tableName: "projects",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["org_id"] },
        { fields: ["org_id", "status"] },
      ],
    }
  );

  Project.associate = (models) => {
    Project.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization",
    });
    Project.hasMany(models.Task, {
      foreignKey: "project_id",
      as: "tasks",
    });
  };

  return Project;
};
