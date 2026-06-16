'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('role_permissions', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, role: { type: Sequelize.INTEGER, allowNull: false }, permission: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('role_permissions', ['role', 'permission'], { unique: true, name: 'idx_role_permissions_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('role_permissions', { fields: ['role'], type: 'foreign key', name: 'fk_role_permissions_role', references: { table: 'roles', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('role_permissions', { fields: ['permission'], type: 'foreign key', name: 'fk_role_permissions_permission', references: { table: 'permissions', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('role_permissions');
	}
};
