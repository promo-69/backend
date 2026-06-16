'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('employees', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, person: { type: Sequelize.INTEGER, allowNull: false }, employee_code: { type: Sequelize.STRING(50), allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('employees', ['person'], { unique: true, name: 'idx_employees_people_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addIndex('employees', ['employee_code'], { unique: true, name: 'idx_employees_code_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('employees', { fields: ['person'], type: 'foreign key', name: 'fk_employees_people', references: { table: 'people', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('employees');
	}
};
