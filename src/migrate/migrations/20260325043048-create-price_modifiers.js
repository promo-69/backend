'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('price_modifiers', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, description: { type: Sequelize.STRING(255), allowNull: false }, operation_type: { type: Sequelize.INTEGER, allowNull: false }, is_percentage: { type: Sequelize.BOOLEAN, allowNull: false }, value: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, currency: { type: Sequelize.INTEGER, allowNull: true }, modifier_scope: { type: Sequelize.INTEGER, allowNull: false }, audience_category: { type: Sequelize.INTEGER, allowNull: true }, week_day: { type: Sequelize.INTEGER, allowNull: true }, seat_category: { type: Sequelize.INTEGER, allowNull: true }, projection_type: { type: Sequelize.INTEGER, allowNull: true }, product_category: { type: Sequelize.INTEGER, allowNull: true }, product: { type: Sequelize.INTEGER, allowNull: true }, combo: { type: Sequelize.INTEGER, allowNull: true }, cinema: { type: Sequelize.INTEGER, allowNull: true }, start_date: { type: Sequelize.DATEONLY, allowNull: true }, end_date: { type: Sequelize.DATEONLY, allowNull: true }, start_time: { type: Sequelize.TIME, allowNull: true }, end_time: { type: Sequelize.TIME, allowNull: true }, line_type: { type: Sequelize.INTEGER, allowNull: true }, booking_type: { type: Sequelize.INTEGER, allowNull: true }, movie: { type: Sequelize.INTEGER, allowNull: true }, room_type: { type: Sequelize.INTEGER, allowNull: true }, target_currency: { type: Sequelize.INTEGER, allowNull: true }, target_currency_condition: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('price_modifiers', ['start_date', 'end_date'], { name: 'idx_price_modifiers_dates' , transaction });
			await queryInterface.addIndex('price_modifiers', ['modifier_scope'], { name: 'idx_price_modifiers_scope' , transaction });
			await queryInterface.addIndex('price_modifiers', ['cinema'], { name: 'idx_price_modifiers_cinema' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['modifier_scope'], type: 'foreign key', name: 'fk_price_modifiers_modifier_scope', references: { table: 'modifier_scopes', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['audience_category'], type: 'foreign key', name: 'fk_price_modifiers_audience_category', references: { table: 'audience_categories', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['week_day'], type: 'foreign key', name: 'fk_price_modifiers_week_day', references: { table: 'week_days', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['seat_category'], type: 'foreign key', name: 'fk_price_modifiers_seat_category', references: { table: 'seat_categories', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['projection_type'], type: 'foreign key', name: 'fk_price_modifiers_projection_type', references: { table: 'projection_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['product_category'], type: 'foreign key', name: 'fk_price_modifiers_product_category', references: { table: 'product_categories', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['product'], type: 'foreign key', name: 'fk_price_modifiers_product', references: { table: 'products', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['combo'], type: 'foreign key', name: 'fk_price_modifiers_combo', references: { table: 'combos', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['operation_type'], type: 'foreign key', name: 'fk_price_modifiers_operation_type', references: { table: 'operation_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['cinema'], type: 'foreign key', name: 'fk_price_modifiers_cinema', references: { table: 'cinemas', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['line_type'], type: 'foreign key', name: 'fk_price_modifiers_line_type', references: { table: 'line_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['booking_type'], type: 'foreign key', name: 'fk_price_modifiers_booking_type', references: { table: 'booking_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['movie'], type: 'foreign key', name: 'fk_price_modifiers_movie', references: { table: 'movies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['room_type'], type: 'foreign key', name: 'fk_price_modifiers_room_type', references: { table: 'room_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['currency'], type: 'foreign key', name: 'fk_price_modifiers_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('price_modifiers', { fields: ['target_currency'], type: 'foreign key', name: 'fk_price_modifiers_target_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE price_modifiers ADD CONSTRAINT chk_price_modifiers_currency CHECK (is_percentage = true OR currency IS NOT NULL);`, { transaction });
			await queryInterface.sequelize.query(`ALTER TABLE price_modifiers ADD CONSTRAINT chk_price_modifiers_logic CHECK (value > 0 AND
             ((modifier_scope = 1 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND line_type IS NULL) OR
             (modifier_scope = 2 AND audience_category IS NULL AND seat_category IS NULL AND projection_type IS NULL) OR
             (modifier_scope = 3 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND audience_category IS NULL AND seat_category IS NULL AND projection_type IS NULL AND line_type IS NULL))
            );`, { transaction });
			await queryInterface.sequelize.query(`ALTER TABLE price_modifiers ADD CONSTRAINT chk_price_modifiers_dates CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);`, { transaction });
			await queryInterface.sequelize.query(`ALTER TABLE price_modifiers ADD CONSTRAINT chk_price_modifiers_times CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('price_modifiers');
	}
};
