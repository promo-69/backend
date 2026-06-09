'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('rental_requests', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, customer: { type: Sequelize.INTEGER, allowNull: false }, order: { type: Sequelize.INTEGER, allowNull: true }, booking: { type: Sequelize.INTEGER, allowNull: true }, room: { type: Sequelize.INTEGER, allowNull: false }, event_type: { type: Sequelize.INTEGER, allowNull: false }, requested_start_time: { type: Sequelize.DATE, allowNull: false }, requested_end_time: { type: Sequelize.DATE, allowNull: false }, event_name: { type: Sequelize.STRING(255), allowNull: false }, event_description: { type: Sequelize.TEXT, allowNull: true }, status: { type: Sequelize.INTEGER, allowNull: false }, currency: { type: Sequelize.INTEGER, allowNull: true }, price: { type: Sequelize.DECIMAL(10, 2), allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('rental_requests', ['customer', 'requested_start_time'], { name: 'idx_rentals_customer_time' , transaction });
			await queryInterface.addConstraint('rental_requests', { fields: ['customer'], type: 'foreign key', name: 'fk_rental_requests_customer', references: { table: 'customers', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rental_requests', { fields: ['room'], type: 'foreign key', name: 'fk_rental_requests_room', references: { table: 'rooms', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rental_requests', { fields: ['booking'], type: 'foreign key', name: 'fk_rental_requests_booking', references: { table: 'room_bookings', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rental_requests', { fields: ['event_type'], type: 'foreign key', name: 'fk_rental_requests_event_type', references: { table: 'booking_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rental_requests', { fields: ['currency'], type: 'foreign key', name: 'fk_rental_requests_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rental_requests', { fields: ['order'], type: 'foreign key', name: 'fk_rental_requests_order', references: { table: 'orders', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('rental_requests');
	}
};
