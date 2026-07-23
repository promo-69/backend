'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users_logins', 'device_id', {
      type: Sequelize.STRING(255),
      allowNull: true, // Allow null to be backward compatible with existing records
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users_logins', 'device_id');
  }
};
