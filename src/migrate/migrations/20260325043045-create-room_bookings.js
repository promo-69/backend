'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('room_bookings', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, room: { type: Sequelize.INTEGER, allowNull: false }, start_time: { type: Sequelize.DATE, allowNull: false }, end_time: { type: Sequelize.DATE, allowNull: false }, booking_type: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('room_bookings', ['room', 'start_time'], { name: 'idx_room_bookings_room_time' , transaction });
			await queryInterface.addConstraint('room_bookings', { fields: ['room'], type: 'foreign key', name: 'fk_room_bookings_room', references: { table: 'rooms', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('room_bookings', { fields: ['booking_type'], type: 'foreign key', name: 'fk_room_bookings_booking_type', references: { table: 'booking_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE room_bookings ADD CONSTRAINT chk_room_bookings_no_overlap EXCLUDE USING gist ( room WITH =, tstzrange(start_time, end_time) WITH && ) WHERE (deleted_at IS NULL);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('room_bookings');
	}
};
