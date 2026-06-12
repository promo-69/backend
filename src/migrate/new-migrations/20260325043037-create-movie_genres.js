'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('movie_genres', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, movie: { type: Sequelize.INTEGER, allowNull: false }, genre: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('movie_genres', ['movie', 'genre'], { unique: true, name: 'idx_movie_genres_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('movie_genres', { fields: ['movie'], type: 'foreign key', name: 'fk_movie_genres_movie', references: { table: 'movies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('movie_genres', { fields: ['genre'], type: 'foreign key', name: 'fk_movie_genres_genre', references: { table: 'genres', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('movie_genres');
	}
};
