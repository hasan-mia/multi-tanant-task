const bcrypt = require("bcryptjs");
const { Role, User } = require("../models");
const { v4: uuidv4 } = require("uuid");

const generateAdmin = async () => {
  const roles = [
    {
      id: uuidv4(),
      name: "admin",
      code: "ADMIN",
      description: "Administrator with management access",
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // Create or find roles
  const createdRoles = {};
  for (const roleData of roles) {
    let role = await Role.findOne({ where: { name: roleData.name } });
    if (!role) {
      role = await Role.create(roleData);
      console.log(`Created role: ${roleData.name}`);
    } else {
      await role.update({ code: roleData.code });
    }
    createdRoles[roleData.name] = role;
  }

  const users = [
    {
      email: "hasan@gmail.com",
      first_name: "Admin",
      last_name: "Admin",
      password: "hasan@123",
      roleName: "admin",
    },
  ];

  const createdUsers = [];

  for (const userData of users) {
    // Check if user already exists
    let user = await User.findOne({ where: { email: userData.email } });

    if (!user) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      user = await User.create({
        id: uuidv4(),
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        password_hash: hashedPassword,
        role_id: createdRoles[userData.roleName].id,
        status: "active",
      });

      console.log(
        `Created user: ${userData.email} (${userData.roleName}) with password: ${userData.password}`
      );
    }

    createdUsers.push(user);
  }

  return {
    roles: createdRoles,
    users: createdUsers,
    adminUser: createdUsers.find((u) => u.email === "hasan@gmail.com"),
    demoUser: createdUsers.find((u) => u.email === "demo@gmail.com"),
  };
};

module.exports = generateAdmin;
