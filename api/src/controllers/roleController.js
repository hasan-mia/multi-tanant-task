const { sendResponse, handleError } = require('../utils/utils');
const catchAsyncError = require('../middleware/catchAsyncError');
const {
  createRole,
  getAllRoles,
  getRoleById,
  getRolePermissionsById,
  updateRole,
  deleteRole,
  assignPermissions,
} = require('../services/roleService');

// Create Role
exports.createRole = catchAsyncError(async (req, res) => {
  try {
    const data = await createRole(req.body);
    sendResponse(res, 201, true, 'Role created successfully', data, true);
  } catch (error) {
    handleError(res, error);
  }
});

// Get All Roles with Pagination
exports.getAllRoles = catchAsyncError(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const data = await getAllRoles({ page, limit });
    sendResponse(res, 200, true, 'Roles fetched successfully', data, false);
  } catch (error) {
    handleError(res, error);
  }
});

// Get Single Role by ID
exports.getRoleById = catchAsyncError(async (req, res) => {
  try {
    const data = await getRoleById(req.params.id);
    sendResponse(res, 200, true, 'Role fetched successfully', data, true);
  } catch (error) {
    handleError(res, error);
  }
});

// Update Role by ID
exports.updateRole = catchAsyncError(async (req, res) => {
  try {
    const data = await updateRole(req.params.id, req.body);
    sendResponse(res, 202, true, 'Role updated successfully', data, true);
  } catch (error) {
    handleError(res, error);
  }
});

// Delete Role by ID
exports.deleteRole = catchAsyncError(async (req, res) => {
  try {
    const result = await deleteRole(req.params.id);
    sendResponse(res, 200, true, result.message);
  } catch (error) {
    handleError(res, error);
  }
});

// Get a role with its assigned permissions
exports.getRolePermissions = catchAsyncError(async (req, res) => {
  try {
    const data = await getRolePermissionsById(req.params.id);
    sendResponse(res, 200, true, 'Role permissions fetched successfully', data, true);
  } catch (error) {
    handleError(res, error);
  }
});

// Assign (replace) a role's permissions — admin only
exports.assignRolePermissions = catchAsyncError(async (req, res) => {
  try {
    const data = await assignPermissions(
      req.params.id,
      req.body.permissionIds || req.body.permissions
    );
    sendResponse(res, 200, true, 'Role permissions updated successfully', data, true);
  } catch (error) {
    handleError(res, error);
  }
});
