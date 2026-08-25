const { Organization } = require("../models");
const { ErrorHandler } = require("../utils/utils");

const createOrganization = async ({ name }) => {
  const existing = await Organization.findOne({ where: { name } });
  if (existing) {
    throw new ErrorHandler("Organization name already exists", 409);
  }
  return Organization.create({ name });
};

const listOrganizations = async () => {
  return Organization.findAll({ order: [["created_at", "DESC"]] });
};

const getOrganization = async (id) => {
  const org = await Organization.findByPk(id);
  if (!org) throw new ErrorHandler("Organization not found", 404);
  return org;
};

module.exports = { createOrganization, listOrganizations, getOrganization };
