'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('room_events', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, booking: { type: Sequelize.INTEGER, allowNull: false }, event_type: { type: Sequelize.INTEGER, allowNull: false }, name: { type: Sequelize.STRING(255), allowNull: false }, organizer: { type: Sequelize.STRING(255), allowNull: true }, description: { type: Sequelize.TEXT, allowNull: true }, currency: { type: Sequelize.INTEGER, allowNull: false }, price: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('room_events', ['booking'], { unique: true, name: 'idx_room_events_booking_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('room_events', { fields: ['booking'], type: 'foreign key', name: 'fk_room_events_booking', references: { table: 'room_bookings', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('room_events', { fields: ['event_type'], type: 'foreign key', name: 'fk_room_events_event_type', references: { table: 'booking_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('room_events', { fields: ['currency'], type: 'foreign key', name: 'fk_room_events_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('room_events');
	}
};
