const express = require("express");
const userRouter = express.Router();
const { requireAuth, requireRole } = require("../middleware/authorization");
const validate = require("../middleware/validate");
const {
  createUser,
  updateUser,
  getUser,
  deleteUser,
} = require("../utils/validators");
const controller = require("../controllers/userController");

userRouter
  .get("/", requireAuth, requireRole("ADMIN", "MANAGER"), controller.listUsers)
  .post(
    "/",
    requireAuth,
    requireRole("ADMIN"),
    createUser,
    validate,
    controller.createUser
  )
  .get("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), getUser, validate, controller.getUser)
  .patch(
    "/:id",
    requireAuth,
    requireRole("ADMIN"),
    updateUser,
    validate,
    controller.updateUser
  )
  .delete(
    "/:id",
    requireAuth,
    requireRole("ADMIN"),
    deleteUser,
    validate,
    controller.deleteUser
  );

module.exports = userRouter;
