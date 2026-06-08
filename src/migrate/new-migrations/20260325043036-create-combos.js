'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('combos', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, cinema: { type: Sequelize.INTEGER, allowNull: false }, name: { type: Sequelize.STRING(255), allowNull: false }, sku: { type: Sequelize.STRING(100), allowNull: false }, description: { type: Sequelize.STRING(255), allowNull: false }, image_url: { type: Sequelize.STRING(500), allowNull: true }, currency: { type: Sequelize.INTEGER, allowNull: false }, price: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, earned_loyalty_points: { type: Sequelize.INTEGER, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('combos', ['sku'], { unique: true, name: 'idx_combos_sku_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addIndex('combos', ['cinema', 'name'], { unique: true, name: 'idx_combos_name_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('combos', { fields: ['currency'], type: 'foreign key', name: 'fk_combos_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('combos', { fields: ['cinema'], type: 'foreign key', name: 'fk_combos_cinema', references: { table: 'cinemas', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('combos');
	}
};
