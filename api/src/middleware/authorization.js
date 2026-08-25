const { ErrorHandler } = require("../utils/utils");
const { isAuthenticated } = require("./auth");
const {
  getRolePermissionCodes,
  initPermissions,
  refreshPermissions,
} = require("../utils/permissions");

// Re-export requireAuth for a clean, symmetrical API.
exports.requireAuth = isAuthenticated;

// Role-based guard. Accepts stable role codes (ADMIN, MANAGER, MEMBER, ...).
// Reserved for specific business rules that genuinely require a particular role
// (e.g. only ADMIN may manage roles). Generic authorization is permission-based
// via requirePermission.
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const userRole = String(req.user.role || "").toUpperCase();
    const allowed = roles.map((r) => String(r).toUpperCase());

    if (!allowed.includes(userRole)) {
      return next(
        new ErrorHandler(
          `Access denied. Required role: ${allowed.join(" or ")}`,
          403
        )
      );
    }

    next();
  };
};

// Permission-based guard. Resolves the user's role through the canonical,
// database-driven chain:
//
//   req.user.roleId -> Role -> RolePermission -> Permission.code
//
// The database is the source of truth. If it is unavailable the resolution
// fails safely (no permissions granted). No static fallback is used.
exports.requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    try {
      const roleId = req.user.roleId || req.user.role_id;
      const perms = await getRolePermissionCodes(roleId);
      if (!perms.includes(permission)) {
        return next(
          new ErrorHandler(`Forbidden: requires '${permission}'`, 403)
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

exports.initPermissions = initPermissions;
exports.refreshPermissions = refreshPermissions;
