'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('seats', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, room: { type: Sequelize.INTEGER, allowNull: false }, row_identifier: { type: Sequelize.STRING(2), allowNull: false }, column_number: { type: Sequelize.INTEGER, allowNull: false }, seat_category: { type: Sequelize.INTEGER, allowNull: false }, seat_condition: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('seats', ['room', 'row_identifier', 'column_number'], { unique: true, name: 'idx_seats_room_row_col_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('seats', { fields: ['room'], type: 'foreign key', name: 'fk_seats_room', references: { table: 'rooms', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('seats', { fields: ['seat_category'], type: 'foreign key', name: 'fk_seats_seat_category', references: { table: 'seat_categories', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('seats', { fields: ['seat_condition'], type: 'foreign key', name: 'fk_seats_seat_condition', references: { table: 'seat_conditions', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE seats ADD CONSTRAINT chk_seats_col CHECK (column_number > 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('seats');
	}
};
