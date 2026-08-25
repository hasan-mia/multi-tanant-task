// Centralized RBAC for the Project/Task module.
//
// Authorization is ALWAYS resolved dynamically from the `role_permissions`
// join table (role -> permission), never from a hard-coded static matrix.
//
// The database is the single source of truth. A small in-memory cache is used
// purely as a performance optimization AFTER a successful DB load. It is never
// used as a fallback: if the database is unavailable and the cache cannot be
// loaded, authorization fails safely (deny) — no static permissions are ever
// granted.

const { Role, Permission, RolePermission } = require("../models");

// roleId -> Set(permission codes). null means "not loaded yet" (fail-closed).
let rolePermCache = null;

const loadPermissions = async () => {
  const map = new Map();
  const rows = await RolePermission.findAll({
    include: [{ model: Permission, as: "Permission", attributes: ["code"] }],
  });
  for (const r of rows) {
    const roleId = r.role_id || (r.Role && r.Role.id);
    const permCode = r.Permission && r.Permission.code;
    if (!roleId || !permCode) continue;
    if (!map.has(roleId)) map.set(roleId, new Set());
    map.get(roleId).add(permCode);
  }
  rolePermCache = map;
};

// Called at boot and after any role/permission mutation. If the DB is
// unreachable the cache is left as null so authorization fails closed.
const initPermissions = async () => {
  try {
    await loadPermissions();
  } catch (_) {
    rolePermCache = null;
  }
};

const refreshPermissions = initPermissions;

// Drop a single role from the cache (called after a permission mutation so the
// next request re-resolves from the database). Pass null to clear everything.
const invalidateRole = (roleId) => {
  if (rolePermCache && roleId) rolePermCache.delete(roleId);
  else if (!roleId) rolePermCache = null;
};

// Resolve the permission codes granted to a role.
//
// The DB is the source of truth. If the cache already holds the role (from a
// prior successful load) we use it as a performance optimization; otherwise we
// load it live. Any database failure yields an empty set — authorization is
// denied, never granted via stale/static data.
const getRolePermissionCodes = async (roleId) => {
  if (!roleId) return [];

  if (rolePermCache && rolePermCache.has(roleId)) {
    return [...rolePermCache.get(roleId)];
  }

  try {
    const rows = await RolePermission.findAll({
      where: { role_id: roleId },
      include: [{ model: Permission, as: "Permission", attributes: ["code"] }],
    });
    const codes = rows
      .map((r) => r.Permission && r.Permission.code)
      .filter(Boolean);
    if (rolePermCache) rolePermCache.set(roleId, new Set(codes));
    return codes;
  } catch (_) {
    // DB unavailable: fail safe (deny). Never grant via static fallback.
    return [];
  }
};

// Translate a role object/name/string into a stable uppercase code. Retained
// only for token issuance convenience; authorization never uses a static map.
const getRoleCode = (role) => {
  if (typeof role === "string") return role.toUpperCase();
  if (role && role.code) return String(role.code).toUpperCase();
  if (role && role.name) return String(role.name).toUpperCase();
  return null;
};

// Test-only helpers: seed/clear the in-memory cache without a database so the
// authorization logic can be exercised in pure unit tests.
const __setTestCache = (map) => {
  rolePermCache = new Map();
  for (const [id, codes] of Object.entries(map || {})) {
    rolePermCache.set(id, new Set(codes));
  }
};
const __clearTestCache = () => {
  rolePermCache = null;
};

module.exports = {
  initPermissions,
  refreshPermissions,
  invalidateRole,
  getRolePermissionCodes,
  getRoleCode,
  __setTestCache,
  __clearTestCache,
};
