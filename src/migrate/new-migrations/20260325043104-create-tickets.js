'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('tickets', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, order: { type: Sequelize.INTEGER, allowNull: false }, booking: { type: Sequelize.INTEGER, allowNull: false }, seat: { type: Sequelize.INTEGER, allowNull: false }, audience_category: { type: Sequelize.INTEGER, allowNull: false }, original_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, price: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, quoted_exchange_rate: { type: Sequelize.INTEGER, allowNull: false }, validation_time: { type: Sequelize.DATE, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('tickets', ['booking', 'seat'], { unique: true, name: 'idx_tickets_booking_seat_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addIndex('tickets', ['order'], { name: 'idx_tickets_order' , transaction });
			await queryInterface.addConstraint('tickets', { fields: ['order'], type: 'foreign key', name: 'fk_tickets_order', references: { table: 'orders', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('tickets', { fields: ['booking'], type: 'foreign key', name: 'fk_tickets_booking', references: { table: 'room_bookings', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('tickets', { fields: ['seat'], type: 'foreign key', name: 'fk_tickets_seat', references: { table: 'seats', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('tickets', { fields: ['audience_category'], type: 'foreign key', name: 'fk_tickets_audience_category', references: { table: 'audience_categories', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('tickets', { fields: ['quoted_exchange_rate'], type: 'foreign key', name: 'fk_tickets_quoted_exchange_rate', references: { table: 'exchange_rates', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE tickets ADD CONSTRAINT chk_tickets_prices CHECK (original_price >= 0 AND price >= 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('tickets');
	}
};
