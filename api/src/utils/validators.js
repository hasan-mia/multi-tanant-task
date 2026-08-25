const { body, param, query } = require("express-validator");

const PROJECT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];
const ROLE_CODES = ["ADMIN", "MANAGER", "MEMBER"];

const uuidParam = (name) =>
  param(name)
    .isUUID()
    .withMessage(`${name} must be a valid UUID`);

const pagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit 1-100"),
];

const login = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const refresh = [
  body("refreshToken").notEmpty().withMessage("refreshToken is required"),
];

const createOrganization = [
  body("name").trim().notEmpty().withMessage("Organization name is required").isLength({ max: 255 }),
];

const updateOrganization = [
  uuidParam("id"),
  body("name").trim().notEmpty().withMessage("Organization name is required").isLength({ max: 255 }),
];

const deleteOrganization = [uuidParam("id")];

const createProject = [
  body("title").trim().notEmpty().withMessage("Project title is required").isLength({ max: 255 }),
  body("budget").optional().isDecimal().withMessage("Budget must be numeric"),
  body("status").optional().isIn(PROJECT_STATUSES).withMessage(`status must be one of ${PROJECT_STATUSES.join(", ")}`),
  body("org_id").optional().isUUID().withMessage("org_id must be a valid UUID"),
];

const updateProject = [
  uuidParam("id"),
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty").isLength({ max: 255 }),
  body("budget").optional().isDecimal().withMessage("Budget must be numeric"),
  body("status").optional().isIn(PROJECT_STATUSES).withMessage(`status must be one of ${PROJECT_STATUSES.join(", ")}`),
  body("org_id").optional().isUUID().withMessage("org_id must be a valid UUID"),
];

const archiveProject = [uuidParam("id")];

const createTask = [
  uuidParam("projectId"),
  body("title").trim().notEmpty().withMessage("Task title is required").isLength({ max: 255 }),
  body("priority").optional().isIn(TASK_PRIORITIES).withMessage(`priority must be one of ${TASK_PRIORITIES.join(", ")}`),
  body("status").optional().isIn(TASK_STATUSES).withMessage(`status must be one of ${TASK_STATUSES.join(", ")}`),
  body("due_date").optional().isISO8601().withMessage("due_date must be a valid date"),
];

const assignTask = [
  uuidParam("id"),
  body("userId").isUUID().withMessage("userId must be a valid UUID"),
];

const taskAssignees = [uuidParam("id")];

const updateTaskStatus = [
  uuidParam("id"),
  body("status").isIn(TASK_STATUSES).withMessage(`status must be one of ${TASK_STATUSES.join(", ")}`),
];

const listTasks = [
  uuidParam("id"),
  ...pagination,
  query("status").optional().isIn(TASK_STATUSES).withMessage("Invalid status filter"),
  query("priority").optional().isIn(TASK_PRIORITIES).withMessage("Invalid priority filter"),
  query("search").optional().isString(),
  query("sortBy").optional().isIn(["due_date", "priority", "status", "title", "created_at"]),
  query("order").optional().isIn(["ASC", "DESC"]),
];

const createUser = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("first_name").trim().notEmpty().withMessage("first_name is required"),
  body("last_name").trim().notEmpty().withMessage("last_name is required"),
  body("role").isIn(ROLE_CODES).withMessage(`role must be one of ${ROLE_CODES.join(", ")}`),
  body("phone").optional().isString(),
];

const updateUser = [
  uuidParam("id"),
  body("email").optional().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("first_name").optional().trim().notEmpty(),
  body("last_name").optional().trim().notEmpty(),
  body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(ROLE_CODES).withMessage(`role must be one of ${ROLE_CODES.join(", ")}`),
  body("status").optional().isIn(["pending", "active", "suspended"]),
  body("phone").optional().isString(),
  body("org_id").not().exists().withMessage("org_id cannot be changed via request body"),
];

const getUser = [uuidParam("id")];

const deleteUser = [uuidParam("id")];

const getProject = [uuidParam("id")];

const getOrganization = [uuidParam("id")];

const getTask = [uuidParam("id")];

const deleteTask = [uuidParam("id")];

const unassignTask = [uuidParam("id"), uuidParam("userId")];

const utilizationReport = [...pagination];

module.exports = {
  login,
  refresh,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  createProject,
  updateProject,
  archiveProject,
  createTask,
  assignTask,
  taskAssignees,
  updateTaskStatus,
  listTasks,
  pagination,
  createUser,
  updateUser,
  getUser,
  getProject,
  getOrganization,
  getTask,
  deleteTask,
  unassignTask,
  deleteUser,
  utilizationReport,
};
