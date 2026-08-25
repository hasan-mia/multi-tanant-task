const generateAdmin = require('./generateAdmin');

// Boot-time seeding helper. Role/permission/user data is primarily managed
// by the sequelize-cli seeders under src/seeders; this legacy helper only
// ensures an initial admin/demo user exists. It no longer uses any numeric
// score system.

const seedDatabase = async () => {
  try {
    try {
      await generateAdmin();
    } catch (error) {
      console.error('Error generating admin:', error);
    }

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
