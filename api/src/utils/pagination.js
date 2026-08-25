// Reusable pagination helper for list endpoints.
// Returns a normalized { page, limit, offset } object and a meta builder.

const parsePagination = (query = {}) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
});

module.exports = { parsePagination, buildMeta };
