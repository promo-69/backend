'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('rooms', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, cinema: { type: Sequelize.INTEGER, allowNull: false }, room_type: { type: Sequelize.INTEGER, allowNull: false }, name: { type: Sequelize.STRING(100), allowNull: false }, grid_rows: { type: Sequelize.INTEGER, allowNull: false }, grid_columns: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('rooms', ['cinema', 'name'], { unique: true, name: 'idx_rooms_cinema_name_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('rooms', { fields: ['cinema'], type: 'foreign key', name: 'fk_rooms_cinema', references: { table: 'cinemas', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('rooms', { fields: ['room_type'], type: 'foreign key', name: 'fk_rooms_room_type', references: { table: 'room_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE rooms ADD CONSTRAINT chk_rooms_capacity CHECK (grid_rows > 0 AND grid_columns > 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('rooms');
	}
};
