'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('taxes', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, name: { type: Sequelize.STRING(100), allowNull: false }, rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, is_percentage: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('taxes', ['name'], { unique: true, name: 'idx_taxes_name_uq', where: { deleted_at: null } , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE taxes ADD CONSTRAINT chk_taxes_rate CHECK (rate >= 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('taxes');
	}
};
