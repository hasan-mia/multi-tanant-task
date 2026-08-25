const catchAsyncError = require("../middleware/catchAsyncError");
const { sendResponse, handleError } = require("../utils/utils");
const { parsePagination } = require("../utils/pagination");
const userService = require("../services/userService");

exports.createUser = catchAsyncError(async (req, res) => {
  try {
    const user = await userService.createUser({
      orgId: req.user.orgId,
      email: req.body.email,
      password: req.body.password,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      roleCode: req.body.role,
      phone: req.body.phone,
      status: req.body.status,
    });
    sendResponse(res, 201, true, "User created successfully", user, true);
  } catch (error) {
    handleError(res, error);
  }
});

exports.listUsers = catchAsyncError(async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const result = await userService.listUsers(req.user.orgId, {
      page,
      limit,
      search: req.query.search,
      status: req.query.status,
    });
    sendResponse(res, 200, true, "Users fetched successfully", result, true);
  } catch (error) {
    handleError(res, error);
  }
});

exports.getUser = catchAsyncError(async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user.orgId);
    sendResponse(res, 200, true, "User fetched successfully", user, true);
  } catch (error) {
    handleError(res, error);
  }
});

exports.updateUser = catchAsyncError(async (req, res) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.user.orgId,
      req.body,
      req.user.userId
    );
    sendResponse(res, 200, true, "User updated successfully", user, true);
  } catch (error) {
    handleError(res, error);
  }
});

exports.deleteUser = catchAsyncError(async (req, res) => {
  try {
    const result = await userService.deleteUser(
      req.params.id,
      req.user.orgId,
      req.user.userId
    );
    sendResponse(res, 200, true, "User deleted successfully", result, true);
  } catch (error) {
    handleError(res, error);
  }
});
