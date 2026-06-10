'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('users', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, person: { type: Sequelize.INTEGER, allowNull: false }, user_type: { type: Sequelize.INTEGER, allowNull: false }, role: { type: Sequelize.INTEGER, allowNull: true }, email: { type: Sequelize.STRING(100), allowNull: false }, password: { type: Sequelize.STRING(255), allowNull: false }, signup_code: { type: Sequelize.STRING(60), allowNull: true }, signup_verified_at: { type: Sequelize.DATE, allowNull: true }, created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, updated_at: { type: Sequelize.DATE, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('users', ['email', 'user_type'], { unique: true, name: 'idx_users_email_user_type_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('users', { fields: ['person'], type: 'foreign key', name: 'fk_users_people', references: { table: 'people', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('users', { fields: ['user_type'], type: 'foreign key', name: 'fk_users_user_type', references: { table: 'user_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('users', { fields: ['role'], type: 'foreign key', name: 'fk_users_role', references: { table: 'roles', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK ((user_type = 1 AND role IS NOT NULL) OR (user_type = 2 AND role IS NULL));`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('users');
	}
};
