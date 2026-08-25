const express = require("express");
const taskRouter = express.Router();
const { requireAuth, requireRole, requirePermission } = require("../middleware/authorization");
const validate = require("../middleware/validate");
const {
  assignTask,
  taskAssignees,
  updateTaskStatus,
  deleteTask,
  unassignTask,
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
  .delete(
    "/:id/assign/:userId",
    requireAuth,
    requirePermission("tasks.assign"),
    unassignTask,
    validate,
    controller.unassignTask
  )
  .get(
    "/:id/assignees",
    requireAuth,
    requirePermission("tasks.view"),
    taskAssignees,
    validate,
    controller.getAssignees
  )
  .delete(
    "/:id",
    requireAuth,
    requirePermission("tasks.delete"),
    deleteTask,
    validate,
    controller.deleteTask
  )
  .patch(
    "/:id/status",
    requireAuth,
    requirePermission("tasks.update_status"),
    updateTaskStatus,
    validate,
    controller.updateTaskStatus
  )
  .get(
    "/assigned",
    requireAuth,
    requirePermission("tasks.view"),
    controller.getMyTasks
  );

module.exports = taskRouter;
