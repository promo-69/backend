'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('customers', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, person: { type: Sequelize.INTEGER, allowNull: false }, loyalty_level: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 }, level_progress_points: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }, registration_date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('customers', ['person'], { unique: true, name: 'idx_customers_people_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('customers', { fields: ['person'], type: 'foreign key', name: 'fk_customers_people', references: { table: 'people', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('customers', { fields: ['loyalty_level'], type: 'foreign key', name: 'fk_customers_loyalty_level', references: { table: 'loyalty_levels', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE customers ADD CONSTRAINT chk_customers_progress CHECK (level_progress_points >= 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('customers');
	}
};
