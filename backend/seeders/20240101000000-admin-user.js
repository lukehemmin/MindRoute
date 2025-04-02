'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if admin user already exists
    const adminUsers = await queryInterface.sequelize.query(
      `SELECT * FROM "users" WHERE "role" = 'admin'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (adminUsers.length > 0) {
      console.log('Admin user already exists, skipping seed');
      return;
    }

    await queryInterface.bulkInsert('users', [{
      id: 1,
      email: 'admin@example.com',
      password: await bcrypt.hash('examplepassword', 10),
      name: '관리자',
      role: 'admin',
      "isActive": true,
      "emailVerified": true,
      "createdAt": new Date(),
      "updatedAt": new Date()
    }], {});
    
    console.log('Admin user created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { email: 'admin@example.com' }, {});
  }
}; 