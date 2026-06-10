'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('job_positions', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, title: { type: Sequelize.STRING(255), allowNull: false }, description: { type: Sequelize.STRING(255), allowNull: true }, is_pensionable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('job_positions', ['title'], { unique: true, name: 'idx_job_positions_title_uq', where: { deleted_at: null } , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('job_positions');
	}
};
