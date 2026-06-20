'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('employee_positions', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, employee: { type: Sequelize.INTEGER, allowNull: false }, job_position: { type: Sequelize.INTEGER, allowNull: false }, cinema: { type: Sequelize.INTEGER, allowNull: false }, start_date: { type: Sequelize.DATEONLY, allowNull: false }, end_date: { type: Sequelize.DATEONLY, allowNull: true }, salary_base: { type: Sequelize.DECIMAL(10, 2), allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('employee_positions', ['employee'], { unique: true, name: 'idx_employee_positions_active_uq', where: { deleted_at: null, end_date: null } , transaction });
			await queryInterface.addConstraint('employee_positions', { fields: ['employee'], type: 'foreign key', name: 'fk_employee_positions_employee', references: { table: 'employees', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('employee_positions', { fields: ['job_position'], type: 'foreign key', name: 'fk_employee_positions_job_position', references: { table: 'job_positions', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('employee_positions', { fields: ['cinema'], type: 'foreign key', name: 'fk_employee_positions_cinema', references: { table: 'cinemas', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE employee_positions ADD CONSTRAINT chk_employee_positions_dates CHECK (end_date IS NULL OR end_date >= start_date);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('employee_positions');
	}
};
