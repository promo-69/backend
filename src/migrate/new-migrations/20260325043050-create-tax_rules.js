'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('tax_rules', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, tax: { type: Sequelize.INTEGER, allowNull: false }, tax_scope: { type: Sequelize.INTEGER, allowNull: false }, cinema: { type: Sequelize.INTEGER, allowNull: true }, line_type: { type: Sequelize.INTEGER, allowNull: true }, product_category: { type: Sequelize.INTEGER, allowNull: true }, product: { type: Sequelize.INTEGER, allowNull: true }, combo: { type: Sequelize.INTEGER, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('tax_rules', ['tax_scope'], { name: 'idx_tax_rules_scope' , transaction });
			await queryInterface.addIndex('tax_rules', ['cinema'], { name: 'idx_tax_rules_cinema' , transaction });
			await queryInterface.addConstraint('tax_rules', { fields: ['tax'], type: 'foreign key', name: 'fk_tax_rules_tax', references: { table: 'taxes', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('tax_rules', { fields: ['cinema'], type: 'foreign key', name: 'fk_tax_rules_cinema', references: { table: 'cinemas', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('tax_rules', { fields: ['line_type'], type: 'foreign key', name: 'fk_tax_rules_line_type', references: { table: 'line_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('tax_rules', { fields: ['product_category'], type: 'foreign key', name: 'fk_tax_rules_product_category', references: { table: 'product_categories', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('tax_rules', { fields: ['product'], type: 'foreign key', name: 'fk_tax_rules_product', references: { table: 'products', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('tax_rules', { fields: ['combo'], type: 'foreign key', name: 'fk_tax_rules_combo', references: { table: 'combos', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE tax_rules ADD CONSTRAINT chk_tax_rules_logic CHECK (
				((tax_scope = 1 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND line_type IS NULL) OR
				(tax_scope = 2) OR
				(tax_scope = 3 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND line_type IS NULL))
			);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('tax_rules');
	}
};
