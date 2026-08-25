const { Op, Sequelize } = require("sequelize");
const { Project, Organization, Task, TaskAssignment, User } = require("../models");
const { ErrorHandler } = require("../utils/utils");
const { parsePagination, buildMeta } = require("../utils/pagination");

const createProject = async ({ title, budget, status, orgId }) => {
  if (orgId) {
    const org = await Organization.findByPk(orgId);
    if (!org) throw new ErrorHandler("Organization not found", 404);
  }

  const project = await Project.create({
    title,
    budget: budget !== undefined ? budget : 0,
    status: status || "DRAFT",
    org_id: orgId,
  });

  return project;
};

const getProjects = async ({ orgId, scopeOrgId, allOrgs, page, limit }) => {
  const where = {};
  // "all" (admin only) returns every tenant's projects. Otherwise an explicit
  // orgId filters by that org, and the default scopes to the caller's tenant.
  if (orgId && orgId !== "all") where.org_id = orgId;
  else if (scopeOrgId && !allOrgs) where.org_id = scopeOrgId;

  const { rows, count } = await Project.findAndCountAll({
    where,
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name"],
        required: false,
      },
    ],
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

const getProjectById = async (id, orgId, scopeOrgId) => {
  const where = { id };
  const scope = orgId || scopeOrgId;
  if (scope) where.org_id = scope;

  const project = await Project.findOne({
    where,
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name"],
        required: false,
      },
    ],
  });
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
  if (data.org_id !== undefined) {
    if (data.org_id) {
      const org = await Organization.findByPk(data.org_id);
      if (!org) throw new ErrorHandler("Organization not found", 404);
    }
    updatable.org_id = data.org_id;
  }

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

  // Always expose the task's assignees so clients can render "who is assigned"
  // directly in the task table without a second round-trip per task.
  include.push({
    model: User,
    as: "assignees",
    attributes: ["id", "first_name", "last_name", "email", "avatar"],
    through: { attributes: [] },
    required: false,
  });

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
