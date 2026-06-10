'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable(
				'customer_favorite_genres',
				{
					id: {
						type: Sequelize.INTEGER,
						primaryKey: true,
						autoIncrement: true,
						allowNull: false,
					},
					customer: {
						type: Sequelize.INTEGER,
						allowNull: false,
						references: {
							model: 'customers',
							key: 'id',
						},
						onUpdate: 'CASCADE',
						onDelete: 'CASCADE',
					},
					genre: {
						type: Sequelize.INTEGER,
						allowNull: false,
						references: {
							model: 'genres',
							key: 'id',
						},
						onUpdate: 'CASCADE',
						onDelete: 'CASCADE',
					},
					created_at: {
						type: Sequelize.DATE,
						allowNull: false,
						defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
					},
				},
				{ transaction }
			);

			await queryInterface.addIndex('customer_favorite_genres', ['customer', 'genre'], {
				unique: true,
				name: 'idx_customer_genres_uq',
				transaction,
			});
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('customer_favorite_genres');
	},
};
