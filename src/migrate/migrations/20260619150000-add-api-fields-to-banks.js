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

      // Seed api_url for Banky (id 20)
      await queryInterface.sequelize.query(`
        UPDATE banks 
        SET api_url = 'https://cineflix-banky.onrender.com/api/external/transactions' 
        WHERE id = 20 AND code = '0201'
      `, { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('banks', 'api_url', { transaction });
      await queryInterface.removeColumn('bank_accounts', 'api_key', { transaction });
    });
  }
};
