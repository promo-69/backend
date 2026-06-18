'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('invoice_sequences', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, cinema: { type: Sequelize.INTEGER, allowNull: false }, prefix: { type: Sequelize.STRING(10), allowNull: false }, current_value: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('invoice_sequences', ['cinema'], { unique: true, name: 'idx_invoice_sequences_cinema_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addIndex('invoice_sequences', ['prefix'], { unique: true, name: 'idx_invoice_sequences_prefix_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('invoice_sequences', { fields: ['cinema'], type: 'foreign key', name: 'fk_invoice_sequences_cinema', references: { table: 'cinemas', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('invoice_sequences');
	}
};
