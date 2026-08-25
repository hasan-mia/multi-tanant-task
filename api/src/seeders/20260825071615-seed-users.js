"use strict";

const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Resolve the demo organization created by the organizations seeder.
    const orgs = await queryInterface.sequelize.query(
      "SELECT id, name FROM organizations",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const orgMap = orgs.reduce((acc, o) => {
      acc[o.name] = o.id;
      return acc;
    }, {});
    const demoOrgId = orgMap["Demo Organization"];

    const roles = await queryInterface.sequelize.query(
      "SELECT id, name FROM roles",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleMap = roles.reduce((acc, role) => {
      acc[role.name] = role.id;
      return acc;
    }, {});

    // Stable role code per legacy role name (assessment module uses the enum).
    const roleCode = (name) => {
      const map = { admin: "ADMIN", manager: "MANAGER", member: "MEMBER" };
      return map[String(name).toLowerCase()] || null;
    };

    const hashedPassword = await bcrypt.hash("password123", 10);

    const generatePhone = () => faker.phone.number().substring(0, 20);

    const users = [
      {
        id: uuidv4(),
        avatar: faker.image.avatar(),
        email: "admin@example.com",
        password_hash: hashedPassword,
        first_name: "Admin",
        last_name: "User",
        phone: generatePhone(),
        role_id: roleMap["admin"],
        org_id: demoOrgId,
        status: "active",
        email_verified: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        avatar: faker.image.avatar(),
        email: "manager@example.com",
        password_hash: hashedPassword,
        first_name: "Manager",
        last_name: "User",
        phone: generatePhone(),
        role_id: roleMap["manager"],
        org_id: demoOrgId,
        status: "active",
        email_verified: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        avatar: faker.image.avatar(),
        email: "member@example.com",
        password_hash: hashedPassword,
        first_name: "Member",
        last_name: "User",
        phone: generatePhone(),
        role_id: roleMap["member"],
        org_id: demoOrgId,
        status: "active",
        email_verified: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // A few extra org members so reports have data.
    const businessRoles = ["admin", "manager", "member"];
    for (let i = 0; i < 10; i++) {
      const roleName =
        businessRoles[Math.floor(Math.random() * businessRoles.length)];
      users.push({
        id: uuidv4(),
        avatar: faker.image.avatar(),
        email: faker.internet.email().toLowerCase(),
        password_hash: hashedPassword,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        phone: generatePhone(),
        role_id: roleMap[roleName],
        org_id: demoOrgId,
        status: "active",
        email_verified: faker.datatype.boolean(),
        last_login: faker.date.recent({ days: 30 }),
        created_at: faker.date.past({ years: 1 }),
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert("users", users, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  },
};
