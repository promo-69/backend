'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('users_logins', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, user: { type: Sequelize.INTEGER, allowNull: false }, device: { type: Sequelize.STRING(500), allowNull: true }, jti: { type: Sequelize.STRING(255), allowNull: false }, expires_at: { type: Sequelize.DATE, allowNull: false }, created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, updated_at: { type: Sequelize.DATE, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('users_logins', ['jti'], { unique: true, name: 'idx_users_logins_jti_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addIndex('users_logins', ['user'], { name: 'idx_users_logins_user' , transaction });
			await queryInterface.addConstraint('users_logins', { fields: ['user'], type: 'foreign key', name: 'fk_users_logins_user', references: { table: 'users', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('users_logins');
	}
};
