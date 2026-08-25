const express = require("express");
const reportRouter = express.Router();
const { requireAuth, requireRole, requirePermission } = require("../middleware/authorization");
const controller = require("../controllers/reportController");

// Utilization reports require the explicit `reports.view` permission,
// which both ADMIN and MANAGER hold (MEMBER does not).
reportRouter.get(
  "/utilization",
  requireAuth,
  requirePermission("reports.view"),
  controller.getUtilization
);

module.exports = reportRouter;
