const { Op } = require("sequelize");
const { Task, Project, TaskAssignment, User } = require("../models");
const { ErrorHandler } = require("../utils/utils");
const { isValidTransition } = require("../utils/taskTransitions");

const createTask = async (
  projectId,
  orgId,
  { title, priority, status, due_date }
) => {
  const project = await Project.findOne({
    where: { id: projectId, org_id: orgId },
  });
  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }

  const task = await Task.create({
    project_id: project.id,
    title,
    priority: priority || "MEDIUM",
    status: status || "TODO",
    due_date: due_date || null,
  });

  return task;
};

const findTaskInOrg = async (taskId, orgId) => {
  const task = await Task.findByPk(taskId, {
    include: [{ model: Project, as: "project" }],
  });
  if (!task) {
    throw new ErrorHandler("Task not found", 404);
  }
  if (task.project.org_id !== orgId) {
    throw new ErrorHandler("Task not found", 404);
  }
  return task;
};

const assignTask = async (taskId, orgId, assigneeId) => {
  const task = await findTaskInOrg(taskId, orgId);

  const user = await User.findOne({
    where: { id: assigneeId, org_id: orgId },
  });
  if (!user) {
    throw new ErrorHandler(
      "User not found in your organization",
      404
    );
  }

  const existing = await TaskAssignment.findOne({
    where: { task_id: task.id, user_id: user.id },
  });
  if (existing) {
    throw new ErrorHandler("User is already assigned to this task", 409);
  }

  const assignment = await TaskAssignment.create({
    task_id: task.id,
    user_id: user.id,
  });

  return assignment;
};

const getAssignees = async (taskId, orgId) => {
  const task = await findTaskInOrg(taskId, orgId);

  const assignees = await User.findAll({
    attributes: ["id", "email", "first_name", "last_name", "avatar", "role_id"],
    include: [
      {
        model: TaskAssignment,
        as: "taskAssignments",
        where: { task_id: task.id },
        required: true,
        attributes: ["assigned_at"],
      },
    ],
  });

  return assignees;
};

const updateTaskStatus = async (taskId, orgId, userId, role, nextStatus) => {
  const result = await Task.sequelize.transaction(async (transaction) => {
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: "project" }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!task) {
      throw new ErrorHandler("Task not found", 404);
    }
    if (task.project.org_id !== orgId) {
      throw new ErrorHandler("Task not found", 404);
    }

    // Members may only update tasks assigned to themselves.
    if (role === "MEMBER") {
      const assignment = await TaskAssignment.findOne({
        where: { task_id: task.id, user_id: userId },
        transaction,
      });
      if (!assignment) {
        throw new ErrorHandler(
          "You are not assigned to this task",
          403
        );
      }
    }

    const currentStatus = task.status;

    if (!isValidTransition(role, currentStatus, nextStatus)) {
      throw new ErrorHandler(
        `Invalid status transition: ${currentStatus} -> ${nextStatus}`,
        422
      );
    }

    // Guarded atomic update to avoid race conditions.
    const [affectedRows] = await Task.update(
      { status: nextStatus },
      {
        where: { id: task.id, status: currentStatus },
        transaction,
      }
    );

    if (affectedRows !== 1) {
      throw new ErrorHandler(
        "Task status was modified concurrently. Please retry.",
        409
      );
    }

    return { id: task.id, status: nextStatus, previousStatus: currentStatus };
  });

  return result;
};

module.exports = {
  createTask,
  findTaskInOrg,
  assignTask,
  getAssignees,
  updateTaskStatus,
};
