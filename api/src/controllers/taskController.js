const catchAsyncError = require("../middleware/catchAsyncError");
const { sendResponse, handleError } = require("../utils/utils");
const taskService = require("../services/taskService");

exports.createTask = catchAsyncError(async (req, res) => {
  try {
    const task = await taskService.createTask(
      req.params.projectId,
      req.user.orgId,
      {
        title: req.body.title,
        priority: req.body.priority,
        status: req.body.status,
        due_date: req.body.due_date,
      }
    );
    sendResponse(res, 201, true, "Task created successfully", task, true);
  } catch (error) {
    handleError(res, error);
  }
});

exports.assignTask = catchAsyncError(async (req, res) => {
  try {
    const assignment = await taskService.assignTask(
      req.params.id,
      req.user.orgId,
      req.body.userId
    );
    sendResponse(
      res,
      201,
      true,
      "Task assigned successfully",
      assignment,
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});

exports.getAssignees = catchAsyncError(async (req, res) => {
  try {
    const assignees = await taskService.getAssignees(
      req.params.id,
      req.user.orgId
    );
    sendResponse(
      res,
      200,
      true,
      "Assignees fetched successfully",
      assignees,
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});

exports.updateTaskStatus = catchAsyncError(async (req, res) => {
  try {
    const result = await taskService.updateTaskStatus(
      req.params.id,
      req.user.orgId,
      req.user.userId,
      req.user.role,
      req.body.status
    );
    sendResponse(
      res,
      200,
      true,
      "Task status updated successfully",
      result,
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});
