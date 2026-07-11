'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable(
				'blank_tickets',
				{
					id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
					code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
					reward: { type: Sequelize.INTEGER, allowNull: true },
					customer: { type: Sequelize.INTEGER, allowNull: false },
					// Orden del canje (Fase A)
					issue_order: { type: Sequelize.INTEGER, allowNull: false },
					issued_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
					expires_at: { type: Sequelize.DATE, allowNull: false },
					// ISSUED | REDEEMED | EXPIRED | REVERSED
					status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'ISSUED' },
					// Orden de taquilla que lo convirtió (Fase B)
					redeemed_order: { type: Sequelize.INTEGER, allowNull: true },
					redeemed_at: { type: Sequelize.DATE, allowNull: true },
					created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
					updated_at: { type: Sequelize.DATE, allowNull: true },
					deleted_at: { type: Sequelize.DATE, allowNull: true },
				},
				{ transaction },
			);

			await queryInterface.addIndex('blank_tickets', ['code'], {
				name: 'idx_blank_tickets_code',
				unique: true,
				transaction,
			});
			await queryInterface.addIndex('blank_tickets', ['customer', 'status'], {
				name: 'idx_blank_tickets_customer_status',
				transaction,
			});

			await queryInterface.addConstraint('blank_tickets', {
				fields: ['reward'],
				type: 'foreign key',
				name: 'fk_blank_tickets_reward',
				references: { table: 'loyalty_rewards', field: 'id' },
				onDelete: 'SET NULL',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('blank_tickets', {
				fields: ['customer'],
				type: 'foreign key',
				name: 'fk_blank_tickets_customer',
				references: { table: 'customers', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('blank_tickets', {
				fields: ['issue_order'],
				type: 'foreign key',
				name: 'fk_blank_tickets_issue_order',
				references: { table: 'orders', field: 'id' },
				onDelete: 'RESTRICT',
				onUpdate: 'CASCADE',
				transaction,
			});
			await queryInterface.addConstraint('blank_tickets', {
				fields: ['redeemed_order'],
				type: 'foreign key',
				name: 'fk_blank_tickets_redeemed_order',
				references: { table: 'orders', field: 'id' },
				onDelete: 'SET NULL',
				onUpdate: 'CASCADE',
				transaction,
			});
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable('blank_tickets');
	},
};
