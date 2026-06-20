'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('roles', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, code: { type: Sequelize.STRING(50), allowNull: false }, name: { type: Sequelize.STRING(100), allowNull: false }, description: { type: Sequelize.STRING(255), allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('roles', ['code'], { unique: true, name: 'idx_roles_code_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addIndex('roles', ['name'], { unique: true, name: 'idx_roles_name_uq', where: { deleted_at: null } , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('roles');
	}
};
