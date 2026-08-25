module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define(
    'Permission',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      resource: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.STRING(15),
        defaultValue: 'active',
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'permissions',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
      indexes: [
        {
          name: 'unique_permission_code',
          unique: true,
          fields: ['code'],
        },
        {
          name: 'unique_permission',
          unique: true,
          fields: ['module', 'action', 'resource'],
        },
      ],
    }
  );

  Permission.associate = (models) => {
    Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      foreignKey: "permission_id",
      otherKey: "role_id",
      as: "roles",
    });
  };

  return Permission;
};
