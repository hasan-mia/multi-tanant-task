const { Op } = require("sequelize");
const { Role, Permission, RolePermission } = require("../models");
const { ErrorHandler } = require("../utils/utils");
const { initPermissions, invalidateRole } = require("../utils/permissions");

// Create Role (dynamic). Admins can later create arbitrary roles.
const createRole = async (data) => {
  const { name, code, description } = data;
  if (!name) throw new ErrorHandler("name is required", 400);

  const roleCode = (code || name).toUpperCase();
  const exists = await Role.findOne({
    where: { [Op.or]: [{ name }, { code: roleCode }] },
  });
  if (exists) throw new ErrorHandler("Role already exists", 409);

  return await Role.create({
    name,
    code: roleCode,
    description: description || null,
    is_active: data.is_active !== false,
  });
};

// Get All Roles (paginated)
const getAllRoles = async (query) => {
  const { page = 1, limit = 10 } = query || {};
  const offset = (page - 1) * limit;
  const { rows: data, count: total } = await Role.findAndCountAll({
    offset,
    limit,
    order: [["created_at", "DESC"]],
  });
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    page,
    limit,
    total,
    totalPages,
    nextPage: page < totalPages ? page + 1 : null,
  };
};

// Get Single Role by ID
const getRoleById = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) throw new ErrorHandler("Role not found", 404);
  return role;
};

// Role by ID including its assigned permissions.
const getRolePermissionsById = async (id) => {
  const role = await Role.findByPk(id, {
    include: [
      {
        model: Permission,
        as: "permissions",
        attributes: ["id", "code", "module", "action", "description"],
      },
    ],
  });
  if (!role) throw new ErrorHandler("Role not found", 404);
  return role;
};

// Update Role
const updateRole = async (id, data) => {
  const role = await Role.findByPk(id);
  if (!role) throw new ErrorHandler("Role not found", 404);

  if (data.name && data.name !== role.name) {
    const exists = await Role.findOne({ where: { name: data.name } });
    if (exists) throw new ErrorHandler("Name already exists", 400);
  }
  await role.update(data);
  return role;
};

// Delete Role (soft delete)
const deleteRole = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) throw new ErrorHandler("Role not found", 404);
  await role.destroy();
  return { message: "Role deleted successfully" };
};

// Replace a role's complete permission set, atomically.
//
// Accepts either `permissionIds` (array of integer Permission ids, preferred)
// or `permissions` (array of permission codes, for convenience). The old
// mappings are deleted and the new ones inserted inside a single transaction so
// a failure never leaves partial role-permission state.
const assignPermissions = async (roleId, idsOrCodes) => {
  const role = await Role.findByPk(roleId);
  if (!role) throw new ErrorHandler("Role not found", 404);
  if (!Array.isArray(idsOrCodes)) {
    throw new ErrorHandler("permissionIds must be an array", 400);
  }

  const byId =
    idsOrCodes.length > 0 && Number.isInteger(idsOrCodes[0]);

  const perms = byId
    ? await Permission.findAll({ where: { id: idsOrCodes } })
    : await Permission.findAll({ where: { code: idsOrCodes } });

  const found = new Set(
    perms.map((p) => (byId ? p.id : p.code))
  );
  const missing = idsOrCodes.filter((x) => !found.has(x));
  if (missing.length) {
    throw new ErrorHandler(
      `Unknown permissions: ${missing.join(", ")}`,
      400
    );
  }

  await RolePermission.sequelize.transaction(async (t) => {
    await RolePermission.destroy({
      where: { role_id: roleId },
      transaction: t,
    });
    if (perms.length) {
      await RolePermission.bulkCreate(
        perms.map((p) => ({ role_id: roleId, permission_id: p.id })),
        { ignoreDuplicates: true, transaction: t }
      );
    }
  });

  // Drop this role from the cache so the next request re-resolves from the DB.
  invalidateRole(roleId);

  return getRolePermissionsById(roleId);
};

// Permission catalog grouped by module for front-end consumption.
const listPermissions = async () => {
  const all = await Permission.findAll({ order: [["code", "ASC"]] });
  const grouped = {};
  for (const p of all) {
    const mod = p.module || "other";
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod].push({
      id: p.id,
      code: p.code,
      action: p.action,
      description: p.description,
    });
  }
  return grouped;
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById, // keep name for existing controller wiring
  getRolePermissionsById,
  updateRole,
  deleteRole, // keep name for existing controller wiring
  assignPermissions,
  listPermissions,
};
