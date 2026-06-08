'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('cinemas', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, name: { type: Sequelize.STRING(255), allowNull: false }, address: { type: Sequelize.TEXT, allowNull: true }, phone: { type: Sequelize.STRING(50), allowNull: true }, opening_time: { type: Sequelize.TIME, allowNull: false }, closing_time: { type: Sequelize.TIME, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('cinemas', ['name'], { unique: true, name: 'idx_cinemas_name_uq', where: { deleted_at: null } , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE cinemas ADD CONSTRAINT chk_cinemas_times CHECK (closing_time > opening_time);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('cinemas');
	}
};
