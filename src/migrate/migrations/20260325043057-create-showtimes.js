'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('showtimes', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, booking: { type: Sequelize.INTEGER, allowNull: false }, movie: { type: Sequelize.INTEGER, allowNull: false }, projection_type: { type: Sequelize.INTEGER, allowNull: false }, language: { type: Sequelize.INTEGER, allowNull: false }, currency: { type: Sequelize.INTEGER, allowNull: false }, price: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, earned_loyalty_points: { type: Sequelize.INTEGER, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('showtimes', ['booking'], { unique: true, name: 'idx_showtimes_booking_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addIndex('showtimes', ['movie'], { name: 'idx_showtimes_movie' , transaction });
			await queryInterface.addConstraint('showtimes', { fields: ['booking'], type: 'foreign key', name: 'fk_showtimes_booking', references: { table: 'room_bookings', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('showtimes', { fields: ['movie'], type: 'foreign key', name: 'fk_showtimes_movie', references: { table: 'movies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('showtimes', { fields: ['projection_type'], type: 'foreign key', name: 'fk_showtimes_projection_type', references: { table: 'projection_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('showtimes', { fields: ['currency'], type: 'foreign key', name: 'fk_showtimes_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('showtimes');
	}
};
