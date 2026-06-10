'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('loyalty_levels', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, name: { type: Sequelize.STRING(100), allowNull: false }, required_points: { type: Sequelize.INTEGER, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('loyalty_levels', ['name'], { unique: true, name: 'idx_loyalty_levels_name_uq', where: { deleted_at: null } , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE loyalty_levels ADD CONSTRAINT chk_loyalty_levels_pts CHECK (required_points >= 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('loyalty_levels');
	}
};
