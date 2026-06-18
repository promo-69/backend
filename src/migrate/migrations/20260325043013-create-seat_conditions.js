'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('seat_conditions', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, description: { type: Sequelize.STRING(255), allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('seat_conditions', ['description'], { unique: true, name: 'idx_seat_conditions_description_uq', where: { deleted_at: null } , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('seat_conditions');
	}
};
