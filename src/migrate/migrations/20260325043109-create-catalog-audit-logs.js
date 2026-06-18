'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('catalog_audit_logs', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			table_name: {
				type: Sequelize.STRING(100),
				allowNull: false,
				comment: 'Nombre de la tabla afectada (cinemas, rooms, seats, movies, etc.)',
			},
			record_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				comment: 'ID del registro afectado en la tabla de origen',
			},
			action: {
				type: Sequelize.STRING(10),
				allowNull: false,
				comment: 'Operación realizada: CREATE, UPDATE, DELETE',
			},
			changed_by: {
				type: Sequelize.INTEGER,
				allowNull: true,
				comment: 'ID del usuario (users.id) que ejecutó la operación. NULL si fue el sistema.',
			},
			previous_data: {
				type: Sequelize.JSONB,
				allowNull: true,
				comment: 'Estado del registro ANTES del cambio. NULL en operaciones CREATE.',
			},
			new_data: {
				type: Sequelize.JSONB,
				allowNull: true,
				comment: 'Estado del registro DESPUÉS del cambio. NULL en operaciones DELETE.',
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		await queryInterface.addIndex('catalog_audit_logs', ['table_name'], {
			name: 'idx_audit_logs_table_name',
		});
		await queryInterface.addIndex('catalog_audit_logs', ['record_id'], {
			name: 'idx_audit_logs_record_id',
		});
		await queryInterface.addIndex('catalog_audit_logs', ['changed_by'], {
			name: 'idx_audit_logs_changed_by',
		});
		await queryInterface.addIndex('catalog_audit_logs', ['table_name', 'record_id'], {
			name: 'idx_audit_logs_table_record',
		});
		await queryInterface.addIndex('catalog_audit_logs', ['created_at'], {
			name: 'idx_audit_logs_created_at',
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable('catalog_audit_logs');
	},
};
