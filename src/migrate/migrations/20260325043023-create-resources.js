'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('resources', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, code: { type: Sequelize.STRING(100), allowNull: false }, description: { type: Sequelize.STRING(255), allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('resources', ['code'], { unique: true, name: 'idx_resources_code_uq', where: { deleted_at: null } , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('resources');
	}
};
