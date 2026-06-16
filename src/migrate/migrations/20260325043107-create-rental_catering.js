'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('rental_catering', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, rental_request: { type: Sequelize.INTEGER, allowNull: false }, line_type: { type: Sequelize.INTEGER, allowNull: false }, product: { type: Sequelize.INTEGER, allowNull: true }, combo: { type: Sequelize.INTEGER, allowNull: true }, quantity: { type: Sequelize.INTEGER, allowNull: false }, original_unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: true }, unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: true }, quoted_exchange_rate: { type: Sequelize.INTEGER, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addConstraint('rental_catering', { fields: ['rental_request'], type: 'foreign key', name: 'fk_rental_catering_request', references: { table: 'rental_requests', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rental_catering', { fields: ['product'], type: 'foreign key', name: 'fk_rental_catering_product', references: { table: 'products', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rental_catering', { fields: ['combo'], type: 'foreign key', name: 'fk_rental_catering_combo', references: { table: 'combos', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rental_catering', { fields: ['line_type'], type: 'foreign key', name: 'fk_rental_catering_line_type', references: { table: 'line_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rental_catering', { fields: ['quoted_exchange_rate'], type: 'foreign key', name: 'fk_rental_catering_quoted_exchange_rate', references: { table: 'exchange_rates', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE rental_catering ADD CONSTRAINT chk_rental_catering_logic CHECK (quantity > 0 AND
				((line_type = 1 AND product IS NOT NULL AND combo IS NULL) OR
				(line_type = 2 AND product IS NULL AND combo IS NOT NULL))
			);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('rental_catering');
	}
};
