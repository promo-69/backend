'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('permissions', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, action: { type: Sequelize.INTEGER, allowNull: false }, resource: { type: Sequelize.INTEGER, allowNull: false }, permission_type: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('permissions', ['action', 'resource', 'permission_type'], { unique: true, name: 'idx_permissions_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('permissions', { fields: ['action'], type: 'foreign key', name: 'fk_permissions_action', references: { table: 'actions', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('permissions', { fields: ['resource'], type: 'foreign key', name: 'fk_permissions_resource', references: { table: 'resources', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('permissions', { fields: ['permission_type'], type: 'foreign key', name: 'fk_permissions_permission_type', references: { table: 'permission_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('permissions');
	}
};
