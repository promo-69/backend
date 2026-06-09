'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('movie_user_subscriptions', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, customer: { type: Sequelize.INTEGER, allowNull: false }, movie: { type: Sequelize.INTEGER, allowNull: false }, is_notified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }, created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('movie_user_subscriptions', ['customer', 'movie'], { unique: true, name: 'idx_movie_user_subscriptions_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('movie_user_subscriptions', { fields: ['customer'], type: 'foreign key', name: 'fk_movie_user_subscriptions_customer', references: { table: 'customers', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('movie_user_subscriptions', { fields: ['movie'], type: 'foreign key', name: 'fk_movie_user_subscriptions_movie', references: { table: 'movies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('movie_user_subscriptions');
	}
};
