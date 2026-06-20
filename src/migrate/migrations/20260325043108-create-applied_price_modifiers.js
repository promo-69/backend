'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable(
				'applied_price_modifiers',
				{
					id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
					price_modifier: { type: Sequelize.INTEGER, allowNull: false },
					order: { type: Sequelize.INTEGER, allowNull: true },
					ticket: { type: Sequelize.INTEGER, allowNull: true },
					order_line: { type: Sequelize.INTEGER, allowNull: true },
					rental_request: { type: Sequelize.INTEGER, allowNull: true },
					rental_catering: { type: Sequelize.INTEGER, allowNull: true },
					applied_amount_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
					deleted_at: { type: Sequelize.DATE, allowNull: true },
				},
				{ transaction },
			);
			await queryInterface.addConstraint('applied_price_modifiers', {
				fields: ['price_modifier'],
				type: 'foreign key',
				name: 'fk_applied_modifiers_rule',
				references: { table: 'price_modifiers', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('applied_price_modifiers', {
				fields: ['order'],
				type: 'foreign key',
				name: 'fk_applied_modifiers_order',
				references: { table: 'orders', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('applied_price_modifiers', {
				fields: ['ticket'],
				type: 'foreign key',
				name: 'fk_applied_modifiers_ticket',
				references: { table: 'tickets', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('applied_price_modifiers', {
				fields: ['order_line'],
				type: 'foreign key',
				name: 'fk_applied_modifiers_order_line',
				references: { table: 'order_lines', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('applied_price_modifiers', {
				fields: ['rental_request'],
				type: 'foreign key',
				name: 'fk_applied_modifiers_rental_req',
				references: { table: 'rental_requests', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('applied_price_modifiers', {
				fields: ['rental_catering'],
				type: 'foreign key',
				name: 'fk_applied_modifiers_rental_cat',
				references: { table: 'rental_catering', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.sequelize.query(
				`ALTER TABLE applied_price_modifiers ADD CONSTRAINT chk_applied_modifiers_target CHECK (num_nonnulls("order", ticket, order_line, rental_request, rental_catering) = 1);`,
				{ transaction },
			);
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('applied_price_modifiers');
	},
};
