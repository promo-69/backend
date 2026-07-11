'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable(
				'loyalty_rewards',
				{
					id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
					name: { type: Sequelize.STRING(150), allowNull: false },
					description: { type: Sequelize.TEXT, allowNull: true },
					image_url: { type: Sequelize.STRING(255), allowNull: true },
					points_cost: { type: Sequelize.INTEGER, allowNull: false },
					required_loyalty_level: { type: Sequelize.INTEGER, allowNull: false },
					// Las promociones se configuran POR SUCURSAL (no global)
					cinema: { type: Sequelize.INTEGER, allowNull: false },
					// PRODUCT | COMBO | BLANK_TICKET | TWO_FOR_ONE
					reward_type: { type: Sequelize.STRING(30), allowNull: false },
					product: { type: Sequelize.INTEGER, allowNull: true },
					combo: { type: Sequelize.INTEGER, allowNull: true },
					// Cuántas unidades entrega el canje (2x1 => 2 vales)
					quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
					start_date: { type: Sequelize.DATEONLY, allowNull: true },
					end_date: { type: Sequelize.DATEONLY, allowNull: true },
					is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
					created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
					updated_at: { type: Sequelize.DATE, allowNull: true },
					deleted_at: { type: Sequelize.DATE, allowNull: true },
				},
				{ transaction },
			);

			await queryInterface.addIndex('loyalty_rewards', ['cinema', 'required_loyalty_level', 'is_active'], {
				name: 'idx_loyalty_rewards_cinema_level_active',
				transaction,
			});

			await queryInterface.addConstraint('loyalty_rewards', {
				fields: ['cinema'],
				type: 'foreign key',
				name: 'fk_loyalty_rewards_cinema',
				references: { table: 'cinemas', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('loyalty_rewards', {
				fields: ['required_loyalty_level'],
				type: 'foreign key',
				name: 'fk_loyalty_rewards_level',
				references: { table: 'loyalty_levels', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('loyalty_rewards', {
				fields: ['product'],
				type: 'foreign key',
				name: 'fk_loyalty_rewards_product',
				references: { table: 'products', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('loyalty_rewards', {
				fields: ['combo'],
				type: 'foreign key',
				name: 'fk_loyalty_rewards_combo',
				references: { table: 'combos', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});

			await queryInterface.sequelize.query(
				`ALTER TABLE loyalty_rewards ADD CONSTRAINT chk_loyalty_rewards_cost CHECK (points_cost > 0);`,
				{ transaction },
			);
			await queryInterface.sequelize.query(
				`ALTER TABLE loyalty_rewards ADD CONSTRAINT chk_loyalty_rewards_qty CHECK (quantity > 0);`,
				{ transaction },
			);
			// Coherencia tipo <-> referencia entregada
			await queryInterface.sequelize.query(
				`ALTER TABLE loyalty_rewards ADD CONSTRAINT chk_loyalty_rewards_type_ref CHECK (
					(reward_type = 'PRODUCT' AND product IS NOT NULL AND combo IS NULL) OR
					(reward_type = 'COMBO' AND combo IS NOT NULL AND product IS NULL) OR
					(reward_type IN ('BLANK_TICKET','TWO_FOR_ONE') AND product IS NULL AND combo IS NULL)
				);`,
				{ transaction },
			);
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable('loyalty_rewards');
	},
};
