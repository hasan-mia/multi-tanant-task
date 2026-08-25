const catchAsyncError = require("../middleware/catchAsyncError");
const { sendResponse, handleError } = require("../utils/utils");
const { parsePagination } = require("../utils/pagination");
const projectService = require("../services/projectService");
const taskService = require("../services/taskService");

exports.createProject = catchAsyncError(async (req, res) => {
  try {
    const project = await projectService.createProject({
      title: req.body.title,
      budget: req.body.budget,
      status: req.body.status,
      orgId: req.user.orgId,
    });
    sendResponse(res, 201, true, "Project created successfully", project, true);
  } catch (error) {
    handleError(res, error);
  }
});

exports.getProjects = catchAsyncError(async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const result = await projectService.getProjects({
      orgId: req.user.orgId,
      page,
      limit,
    });
    sendResponse(res, 200, true, "Projects fetched successfully", result, true);
  } catch (error) {
    handleError(res, error);
  }
});

exports.getProject = catchAsyncError(async (req, res) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user.orgId
    );
    sendResponse(res, 200, true, "Project fetched successfully", project, true);
  } catch (error) {
    handleError(res, error);
  }
});

exports.updateProject = catchAsyncError(async (req, res) => {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.user.orgId,
      req.body
    );
    sendResponse(res, 200, true, "Project updated successfully", project, true);
  } catch (error) {
    handleError(res, error);
  }
});

exports.archiveProject = catchAsyncError(async (req, res) => {
  try {
    const project = await projectService.archiveProject(
      req.params.id,
      req.user.orgId
    );
    sendResponse(res, 200, true, "Project archived successfully", project, true);
  } catch (error) {
    handleError(res, error);
  }
});

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

exports.getProjectTasks = catchAsyncError(async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const result = await projectService.getProjectTasks(
      req.params.id,
      req.user.orgId,
      {
        page,
        limit,
        status: req.query.status,
        priority: req.query.priority,
        search: req.query.search,
        sortBy: req.query.sortBy || "created_at",
        order: req.query.order || "DESC",
        userRole: req.user.role,
        userId: req.user.userId,
      }
    );
    sendResponse(res, 200, true, "Tasks fetched successfully", result, true);
  } catch (error) {
    handleError(res, error);
  }
});
