"use strict";

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define(
    "Organization",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      tableName: "organizations",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Organization.associate = (models) => {
    Organization.hasMany(models.User, {
      foreignKey: "org_id",
      as: "users",
    });
    Organization.hasMany(models.Project, {
      foreignKey: "org_id",
      as: "projects",
    });
  };

  return Organization;
};
