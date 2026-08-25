const express = require("express");
const router = express.Router();

const seedRouter = require("./seedRoutes");
const localFileRouter = require("./localFileRoutes");
const authRouter = require("./authRoutes");
const roleRouter = require("./roleRoutes");
const userRouter = require("./userRoutes");
const projectRouter = require("./projectRoutes");
const taskRouter = require("./taskRoutes");
const reportRouter = require("./reportRoutes");
const organizationRouter = require("./organizationRoutes");
const permissionRouter = require("./permissionRoutes");

// Seed Route
router.use("/seed", seedRouter);

// File Upload Routes
router.use("/file", localFileRouter);

// Auth & Settings Routes
router.use("/auth", authRouter);
router.use("/roles", roleRouter);
router.use("/users", userRouter);
router.use("/projects", projectRouter);
router.use("/tasks", taskRouter);
router.use("/reports", reportRouter);
router.use("/organizations", organizationRouter);
router.use("/permissions", permissionRouter);

module.exports = router;
