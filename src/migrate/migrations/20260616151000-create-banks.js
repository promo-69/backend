'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('banks', {
				id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
				name: { type: Sequelize.STRING(100), allowNull: false },
				code: { type: Sequelize.STRING(4), allowNull: true },
				deleted_at: { type: Sequelize.DATE, allowNull: true }
			}, { transaction });
			await queryInterface.addIndex('banks', ['code'], { unique: true, name: 'idx_banks_code_uq', where: { deleted_at: null }, transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('banks');
	}
};
