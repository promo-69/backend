'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('banks', 'api_url', {
        type: Sequelize.STRING(256),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('bank_accounts', 'api_key', {
        type: Sequelize.STRING(256),
        allowNull: true,
      }, { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('banks', 'api_url', { transaction });
      await queryInterface.removeColumn('bank_accounts', 'api_key', { transaction });
    });
  }
};
