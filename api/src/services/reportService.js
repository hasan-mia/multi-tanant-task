const { Sequelize } = require("sequelize");
const { User } = require("../models");
const { parsePagination, buildMeta } = require("../utils/pagination");

const getUtilization = async ({ orgId, page, limit }) => {
  const sql = `
    SELECT
      u.id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName,
      u.email AS email,
      COALESCE(COUNT(DISTINCT ta.task_id), 0) AS totalTasks,
      COALESCE(SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END), 0) AS completedTasks,
      COALESCE(SUM(CASE WHEN t.due_date < NOW() AND t.status <> 'DONE' THEN 1 ELSE 0 END), 0) AS overdueTasks
    FROM users u
    LEFT JOIN task_assignments ta ON ta.user_id = u.id
    LEFT JOIN tasks t ON t.id = ta.task_id
    LEFT JOIN projects p ON p.id = t.project_id AND p.org_id = :orgId
    WHERE u.org_id = :orgId
    GROUP BY u.id, u.first_name, u.last_name, u.email
    ORDER BY u.first_name ASC, u.last_name ASC
    LIMIT :limit OFFSET :offset
  `;

  const rows = await User.sequelize.query(sql, {
    replacements: { orgId, limit, offset: (page - 1) * limit },
    type: Sequelize.QueryTypes.SELECT,
  });

  const totalUsers = await User.count({ where: { org_id: orgId } });

  const data = rows.map((row) => {
    const total = Number(row.totalTasks) || 0;
    const completed = Number(row.completedTasks) || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      userId: row.userId,
      name: `${row.firstName} ${row.lastName}`.trim(),
      email: row.email,
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: Number(row.overdueTasks) || 0,
      completionRate,
    };
  });

  return {
    data,
    meta: buildMeta(page, limit, totalUsers),
  };
};

module.exports = { getUtilization };
