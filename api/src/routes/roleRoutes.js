const express = require('express');
const roleRouter = express.Router();
const { requireAuth, requireRole } = require('../middleware/authorization');
const {
  createRole,
  getAllRoles,
  getRoleById,
  getRolePermissions,
  updateRole,
  deleteRole,
  assignRolePermissions,
} = require('../controllers/roleController');

// Role/permission management is ADMIN-only and uses the explicit role code
// (no numeric score checks). Roles and their permissions are dynamic.
roleRouter
  .post('/', requireAuth, requireRole('ADMIN'), createRole)
  .get('/', requireAuth, requireRole('ADMIN'), getAllRoles)
  .get('/:id', requireAuth, requireRole('ADMIN'), getRoleById)
  .get('/:id/permissions', requireAuth, requireRole('ADMIN'), getRolePermissions)
  .put('/:id/permissions', requireAuth, requireRole('ADMIN'), assignRolePermissions)
  .put('/:id', requireAuth, requireRole('ADMIN'), updateRole)
  .delete('/:id', requireAuth, requireRole('ADMIN'), deleteRole);

module.exports = roleRouter;
