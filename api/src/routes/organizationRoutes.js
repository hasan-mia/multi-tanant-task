const express = require("express");
const orgRouter = express.Router();
const { requireAuth, requireRole } = require("../middleware/authorization");
const validate = require("../middleware/validate");
const {
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
} = require("../utils/validators");
const controller = require("../controllers/organizationController");

orgRouter
  .post(
    "/",
    requireAuth,
    requireRole("ADMIN"),
    createOrganization,
    validate,
    controller.createOrganization
  )
  .get("/", requireAuth, controller.listOrganizations)
  .get("/:id", requireAuth, getOrganization, validate, controller.getOrganization)
  .put(
    "/:id",
    requireAuth,
    requireRole("ADMIN"),
    updateOrganization,
    validate,
    controller.updateOrganization
  )
  .delete(
    "/:id",
    requireAuth,
    requireRole("ADMIN"),
    deleteOrganization,
    validate,
    controller.deleteOrganization
  );

module.exports = orgRouter;
