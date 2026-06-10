'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('movie_languages', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, movie: { type: Sequelize.INTEGER, allowNull: false }, language: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('movie_languages', ['movie', 'language'], { unique: true, name: 'idx_movie_languages_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('movie_languages', { fields: ['movie'], type: 'foreign key', name: 'fk_movie_languages_movie', references: { table: 'movies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('movie_languages', { fields: ['language'], type: 'foreign key', name: 'fk_movie_languages_language', references: { table: 'languages', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('movie_languages');
	}
};
