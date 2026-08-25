const express = require("express");
const orgRouter = express.Router();
const { requireAuth, requireRole } = require("../middleware/authorization");
const validate = require("../middleware/validate");
const { createOrganization, getOrganization } = require("../utils/validators");
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
  .get("/:id", requireAuth, getOrganization, validate, controller.getOrganization);

module.exports = orgRouter;
