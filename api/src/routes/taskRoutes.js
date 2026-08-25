const express = require("express");
const taskRouter = express.Router();
const { requireAuth, requireRole, requirePermission } = require("../middleware/authorization");
const validate = require("../middleware/validate");
const {
  assignTask,
  taskAssignees,
  updateTaskStatus,
} = require("../utils/validators");
const controller = require("../controllers/taskController");

taskRouter
  .post(
    "/:id/assign",
    requireAuth,
    requirePermission("tasks.assign"),
    assignTask,
    validate,
    controller.assignTask
  )
  .get(
    "/:id/assignees",
    requireAuth,
    requirePermission("tasks.view"),
    taskAssignees,
    validate,
    controller.getAssignees
  )
  .patch(
    "/:id/status",
    requireAuth,
    requirePermission("tasks.update_status"),
    updateTaskStatus,
    validate,
    controller.updateTaskStatus
  );

module.exports = taskRouter;
