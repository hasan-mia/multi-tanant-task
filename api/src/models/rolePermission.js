"use strict";

// Join table mapping roles -> permissions (dynamic, DB-driven).
module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      role_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        references: { model: "roles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      permission_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "permissions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "role_permissions",
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ["permission_id"] }],
    }
  );

  RolePermission.associate = (models) => {
    RolePermission.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "Role",
    });
    RolePermission.belongsTo(models.Permission, {
      foreignKey: "permission_id",
      as: "Permission",
    });
  };

  return RolePermission;
};
