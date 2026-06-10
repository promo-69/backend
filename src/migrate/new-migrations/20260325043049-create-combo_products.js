'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('combo_products', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, combo: { type: Sequelize.INTEGER, allowNull: false }, product: { type: Sequelize.INTEGER, allowNull: false }, quantity: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('combo_products', ['combo', 'product'], { unique: true, name: 'idx_combo_products_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('combo_products', { fields: ['combo'], type: 'foreign key', name: 'fk_combo_products_combo', references: { table: 'combos', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('combo_products', { fields: ['product'], type: 'foreign key', name: 'fk_combo_products_product', references: { table: 'products', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE combo_products ADD CONSTRAINT chk_combo_products_qty CHECK (quantity > 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('combo_products');
	}
};
