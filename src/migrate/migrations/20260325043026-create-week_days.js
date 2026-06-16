'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('week_days', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, description: { type: Sequelize.STRING(50), allowNull: false }, day_number: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('week_days', ['day_number'], { unique: true, name: 'idx_week_days_day_number_uq', where: { deleted_at: null } , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE week_days ADD CONSTRAINT chk_week_days_range CHECK (day_number BETWEEN 1 AND 7);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('week_days');
	}
};
