const { Op, Sequelize } = require("sequelize");
const { Project, Task, TaskAssignment } = require("../models");
const { ErrorHandler } = require("../utils/utils");
const { parsePagination, buildMeta } = require("../utils/pagination");

const createProject = async ({ title, budget, status, orgId }) => {
  const project = await Project.create({
    title,
    budget: budget !== undefined ? budget : 0,
    status: status || "DRAFT",
    org_id: orgId,
  });

  return project;
};

const getProjects = async ({ orgId, page, limit }) => {
  const { rows, count } = await Project.findAndCountAll({
    where: { org_id: orgId },
    order: [["created_at", "DESC"]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return {
    data: rows,
    meta: buildMeta(page, limit, count),
  };
};

const getProjectById = async (id, orgId) => {
  const project = await Project.findOne({ where: { id, org_id: orgId } });
  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }
  return project;
};

const updateProject = async (id, orgId, data) => {
  const project = await getProjectById(id, orgId);

  const updatable = {};
  if (data.title !== undefined) updatable.title = data.title;
  if (data.budget !== undefined) updatable.budget = data.budget;
  if (data.status !== undefined) updatable.status = data.status;

  await project.update(updatable);
  return project;
};

const archiveProject = async (id, orgId) => {
  const project = await getProjectById(id, orgId);
  await project.update({ status: "ARCHIVED" });
  return project;
};

const getProjectTasks = async (
  projectId,
  orgId,
  {
    page,
    limit,
    status,
    priority,
    search,
    sortBy = "created_at",
    order = "DESC",
    userRole,
    userId,
  }
) => {
  // Verify tenant ownership of the project first.
  const project = await getProjectById(projectId, orgId);

  const where = { project_id: project.id };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.title = { [Op.like]: `%${search}%` };
  }

  // Members can only see tasks assigned to themselves (enforced at DB level).
  const include = [];
  if (userRole === "MEMBER") {
    include.push({
      model: TaskAssignment,
      as: "taskAssignments",
      where: { user_id: userId },
      required: true,
    });
  }

  let orderClause;
  if (sortBy === "priority") {
    orderClause = [
      Sequelize.literal("FIELD(priority, 'LOW', 'MEDIUM', 'HIGH')"),
      order,
    ];
  } else {
    orderClause = [[sortBy, order]];
  }

  const { rows, count } = await Task.findAndCountAll({
    where,
    include,
    order: orderClause,
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return {
    data: rows,
    meta: buildMeta(page, limit, count),
  };
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  archiveProject,
  getProjectTasks,
};
