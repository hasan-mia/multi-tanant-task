"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const organizations = [
      {
        id: uuidv4(),
        name: "Demo Organization",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("organizations", organizations, {
      ignoreDuplicates: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("organizations", null, {});
  },
};
