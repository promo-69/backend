'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('movies', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, title: { type: Sequelize.STRING(255), allowNull: false }, duration_minutes: { type: Sequelize.INTEGER, allowNull: false }, age_classification: { type: Sequelize.INTEGER, allowNull: false }, lifecycle_state: { type: Sequelize.INTEGER, allowNull: false }, synopsis: { type: Sequelize.TEXT, allowNull: false }, trailer_url: { type: Sequelize.STRING(255), allowNull: true }, poster_url: { type: Sequelize.STRING(255), allowNull: true }, banner_url: { type: Sequelize.STRING(255), allowNull: true }, release_date: { type: Sequelize.DATEONLY, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('movies', ['title'], { unique: true, name: 'idx_movies_title_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('movies', { fields: ['age_classification'], type: 'foreign key', name: 'fk_movies_age_classification', references: { table: 'age_classifications', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('movies', { fields: ['lifecycle_state'], type: 'foreign key', name: 'fk_movies_lifecycle_state', references: { table: 'movie_lifecycle_states', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE movies ADD CONSTRAINT chk_movies_duration CHECK (duration_minutes > 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('movies');
	}
};
