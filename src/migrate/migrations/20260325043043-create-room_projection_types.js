'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('room_projection_types', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, room: { type: Sequelize.INTEGER, allowNull: false }, projection_type: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('room_projection_types', ['room', 'projection_type'], { unique: true, name: 'idx_room_projection_types_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('room_projection_types', { fields: ['room'], type: 'foreign key', name: 'fk_room_projection_types_room', references: { table: 'rooms', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('room_projection_types', { fields: ['projection_type'], type: 'foreign key', name: 'fk_room_projection_types_projection_type', references: { table: 'projection_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('room_projection_types');
	}
};
