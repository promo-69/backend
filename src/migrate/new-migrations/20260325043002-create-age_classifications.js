'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('age_classifications', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, description: { type: Sequelize.STRING(255), allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('age_classifications', ['description'], { unique: true, name: 'idx_age_classifications_description_uq', where: { deleted_at: null } , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('age_classifications');
	}
};
