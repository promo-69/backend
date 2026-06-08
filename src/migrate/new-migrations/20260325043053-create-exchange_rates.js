'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('exchange_rates', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, currency: { type: Sequelize.INTEGER, allowNull: false }, rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, user: { type: Sequelize.INTEGER, allowNull: false }, created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('exchange_rates', ['currency', 'created_at'], { name: 'idx_exchange_rates_currency_date' , transaction });
			await queryInterface.addConstraint('exchange_rates', { fields: ['currency'], type: 'foreign key', name: 'fk_exchange_rates_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('exchange_rates', { fields: ['user'], type: 'foreign key', name: 'fk_exchange_rates_user', references: { table: 'users', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE exchange_rates ADD CONSTRAINT chk_exchange_rates_rate CHECK (rate > 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('exchange_rates');
	}
};
