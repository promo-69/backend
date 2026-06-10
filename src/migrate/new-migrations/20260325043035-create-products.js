'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('products', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, name: { type: Sequelize.STRING(255), allowNull: false }, sku: { type: Sequelize.STRING(100), allowNull: false }, image_url: { type: Sequelize.STRING(500), allowNull: true }, product_category: { type: Sequelize.INTEGER, allowNull: false }, currency: { type: Sequelize.INTEGER, allowNull: false }, price: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, earned_loyalty_points: { type: Sequelize.INTEGER, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('products', ['sku'], { unique: true, name: 'idx_products_sku_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('products', { fields: ['product_category'], type: 'foreign key', name: 'fk_products_product_category', references: { table: 'product_categories', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('products', { fields: ['currency'], type: 'foreign key', name: 'fk_products_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('products');
	}
};
