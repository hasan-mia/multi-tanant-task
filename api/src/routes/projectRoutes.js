const express = require("express");
const projectRouter = express.Router();
const { requireAuth, requireRole, requirePermission } = require("../middleware/authorization");
const validate = require("../middleware/validate");
const {
  createProject,
  createTask,
  updateProject,
  archiveProject,
  listTasks,
  getProject,
} = require("../utils/validators");
const controller = require("../controllers/projectController");

projectRouter
  .post(
    "/",
    requireAuth,
    requirePermission("projects.create"),
    createProject,
    validate,
    controller.createProject
  )
  .get("/", requireAuth, requirePermission("projects.view"), controller.getProjects)
  .get(
    "/:id",
    requireAuth,
    requirePermission("projects.view"),
    getProject,
    validate,
    controller.getProject
  )
  .patch(
    "/:id",
    requireAuth,
    requirePermission("projects.update"),
    updateProject,
    validate,
    controller.updateProject
  )
  .post(
    "/:id/archive",
    requireAuth,
    requirePermission("projects.archive"),
    archiveProject,
    validate,
    controller.archiveProject
  )
  .post(
    "/:projectId/tasks",
    requireAuth,
    requirePermission("tasks.create"),
    createTask,
    validate,
    controller.createTask
  )
  .get(
    "/:id/tasks",
    requireAuth,
    requirePermission("tasks.view"),
    listTasks,
    validate,
    controller.getProjectTasks
  );

module.exports = projectRouter;
