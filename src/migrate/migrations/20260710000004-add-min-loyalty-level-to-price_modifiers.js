'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.addColumn(
				'price_modifiers',
				'min_loyalty_level',
				{ type: Sequelize.INTEGER, allowNull: true },
				{ transaction },
			);
			await queryInterface.addConstraint('price_modifiers', {
				fields: ['min_loyalty_level'],
				type: 'foreign key',
				name: 'fk_price_modifiers_min_loyalty_level',
				references: { table: 'loyalty_levels', field: 'id' },
				onDelete: 'SET NULL',
				onUpdate: 'CASCADE',
				transaction,
			});
		});
	},

	async down(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.removeConstraint('price_modifiers', 'fk_price_modifiers_min_loyalty_level', {
				transaction,
			});
			await queryInterface.removeColumn('price_modifiers', 'min_loyalty_level', { transaction });
		});
	},
};
