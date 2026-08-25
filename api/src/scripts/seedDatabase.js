const generateUsers = require('./generateUsers');

const seedDatabase = async () => {
  try {
    try {
      await generateUsers();
    } catch (error) {
      console.error('Error generating users:', error);
    }

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
