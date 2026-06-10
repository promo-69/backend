'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('special_events', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      age_classification: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'age_classifications', key: 'id' },
      },
      lifecycle_state: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1, // Próximamente
        references: { model: 'movie_lifecycle_states', key: 'id' },
      },
      trailer_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      poster_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      banner_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      release_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Índice único para títulos no eliminados
    await queryInterface.addIndex('special_events', ['title'], {
      unique: true,
      where: { deleted_at: null },
      name: 'idx_special_events_title_uq',
    });

    // Agregar columna special_event_id a showtimes
    await queryInterface.addColumn('showtimes', 'special_event_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'special_events', key: 'id' },
    });

    // Restricción CHECK: exactamente uno de movie o special_event_id debe ser no nulo
    await queryInterface.sequelize.query(`
      ALTER TABLE showtimes
      ADD CONSTRAINT chk_showtimes_target
      CHECK (
        (movie IS NOT NULL AND special_event_id IS NULL) OR
        (movie IS NULL AND special_event_id IS NOT NULL)
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE showtimes DROP CONSTRAINT chk_showtimes_target;
    `);
    await queryInterface.removeColumn('showtimes', 'special_event_id');
    await queryInterface.dropTable('special_events');
  },
};
