'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('inventories', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, cinema: { type: Sequelize.INTEGER, allowNull: false }, product: { type: Sequelize.INTEGER, allowNull: false }, minimum_stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('inventories', ['cinema', 'product'], { unique: true, name: 'idx_inventories_cinema_product_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('inventories', { fields: ['cinema'], type: 'foreign key', name: 'fk_inventories_cinema', references: { table: 'cinemas', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('inventories', { fields: ['product'], type: 'foreign key', name: 'fk_inventories_product', references: { table: 'products', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE inventories ADD CONSTRAINT chk_inventories_min_stock CHECK (minimum_stock >= 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('inventories');
	}
};
