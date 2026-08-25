const express = require('express');
const permissionRouter = express.Router();
const { requireAuth, requireRole } = require('../middleware/authorization');
const { listPermissions } = require('../controllers/permissionController');

// Permission catalog (all available permission codes). Admin only.
permissionRouter.get('/', requireAuth, requireRole('ADMIN'), listPermissions);

module.exports = permissionRouter;
