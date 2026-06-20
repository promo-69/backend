'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('user_permissions', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, user: { type: Sequelize.INTEGER, allowNull: false }, permission: { type: Sequelize.INTEGER, allowNull: false }, is_granted: { type: Sequelize.BOOLEAN, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('user_permissions', ['user', 'permission'], { unique: true, name: 'idx_user_permissions_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('user_permissions', { fields: ['user'], type: 'foreign key', name: 'fk_user_permissions_user', references: { table: 'users', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('user_permissions', { fields: ['permission'], type: 'foreign key', name: 'fk_user_permissions_permission', references: { table: 'permissions', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('user_permissions');
	}
};
