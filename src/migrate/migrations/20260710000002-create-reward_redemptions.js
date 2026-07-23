'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable(
				'reward_redemptions',
				{
					id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
					reward: { type: Sequelize.INTEGER, allowNull: false },
					customer: { type: Sequelize.INTEGER, allowNull: false },
					order: { type: Sequelize.INTEGER, allowNull: false },
					points_spent: { type: Sequelize.INTEGER, allowNull: false },
					redeemed_at: {
						type: Sequelize.DATE,
						allowNull: false,
						defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
					},
					created_at: {
						type: Sequelize.DATE,
						allowNull: false,
						defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
					},
					deleted_at: { type: Sequelize.DATE, allowNull: true },
				},
				{ transaction },
			);

			await queryInterface.addIndex('reward_redemptions', ['reward'], {
				name: 'idx_reward_redemptions_reward',
				transaction,
			});
			await queryInterface.addIndex('reward_redemptions', ['customer'], {
				name: 'idx_reward_redemptions_customer',
				transaction,
			});

			await queryInterface.addConstraint('reward_redemptions', {
				fields: ['reward'],
				type: 'foreign key',
				name: 'fk_reward_redemptions_reward',
				references: { table: 'loyalty_rewards', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('reward_redemptions', {
				fields: ['customer'],
				type: 'foreign key',
				name: 'fk_reward_redemptions_customer',
				references: { table: 'customers', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('reward_redemptions', {
				fields: ['order'],
				type: 'foreign key',
				name: 'fk_reward_redemptions_order',
				references: { table: 'orders', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable('reward_redemptions');
	},
};
