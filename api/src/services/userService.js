const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { User, Role } = require("../models");
const { ErrorHandler } = require("../utils/utils");
const { parsePagination, buildMeta } = require("../utils/pagination");
const ROLE_CODES = ["ADMIN", "MANAGER", "MEMBER"];

// Resolve a business role CODE (e.g. "ADMIN") to the persisted Role row.
// Falls back to the legacy `name` lookup for backward compatibility.
const resolveRole = async (roleCode) => {
  const code = String(roleCode).toUpperCase();
  let role = await Role.findOne({ where: { code } });
  if (!role) {
    role = await Role.findOne({ where: { name: code.toLowerCase() } });
  }
  if (!role) {
    throw new ErrorHandler(`Invalid role: ${roleCode}`, 400);
  }
  return role;
};

const createUser = async ({
  orgId,
  email,
  password,
  first_name,
  last_name,
  roleCode,
  phone,
  status,
}) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ErrorHandler("Email already exists", 409);
  }

  const role = await resolveRole(roleCode);
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password_hash: hashedPassword,
    first_name,
    last_name,
    phone: phone || null,
    role_id: role.id,
    org_id: orgId, // always derived from the authenticated admin's context
    status: status || "active",
  });

  return sanitize(user);
};

const listUsers = async (orgId, { page, limit, search, status }) => {
  const where = { org_id: orgId };
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: { exclude: ["password_hash"] },
    include: [{ model: Role, as: "roleRecord", attributes: ["id", "name"] }],
    order: [["created_at", "DESC"]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return {
    data: rows,
    meta: buildMeta(page, limit, count),
  };
};

const getUserById = async (id, orgId) => {
  const user = await User.findOne({
    where: { id, org_id: orgId },
    attributes: { exclude: ["password_hash"] },
    include: [{ model: Role, as: "roleRecord", attributes: ["id", "name"] }],
  });
  if (!user) throw new ErrorHandler("User not found", 404);
  return user;
};

const updateUser = async (id, orgId, data, requesterId) => {
  const user = await User.findOne({ where: { id, org_id: orgId } });
  if (!user) throw new ErrorHandler("User not found", 404);

  if (id === requesterId && data.role) {
    throw new ErrorHandler("You cannot change your own role", 403);
  }

  const updatable = {};
  if (data.email !== undefined) updatable.email = data.email;
  if (data.first_name !== undefined) updatable.first_name = data.first_name;
  if (data.last_name !== undefined) updatable.last_name = data.last_name;
  if (data.phone !== undefined) updatable.phone = data.phone;
  if (data.status !== undefined) updatable.status = data.status;

  if (data.role !== undefined) {
    const role = await resolveRole(data.role);
    updatable.role_id = role.id;
  }

  if (data.password !== undefined) {
    updatable.password_hash = await bcrypt.hash(data.password, 10);
  }

  await user.update(updatable);
  return getUserById(id, orgId);
};

const deleteUser = async (id, orgId, requesterId) => {
  if (id === requesterId) {
    throw new ErrorHandler("You cannot delete your own account", 403);
  }
  const user = await User.findOne({ where: { id, org_id: orgId } });
  if (!user) throw new ErrorHandler("User not found", 404);
  await user.destroy();
  return { id };
};

// Strip sensitive fields before returning.
const sanitize = (user) => {
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password_hash;
  return obj;
};

module.exports = {
  ROLE_CODES,
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};
