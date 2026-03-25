// Cargar las variables de entorno del archivo .env en la raíz del proyecto
require('dotenv').config();

module.exports = {
    username: process.env.DB_POSTGRESQL_MAIN_USERNAME || 'postgres',
    password: process.env.DB_POSTGRESQL_MAIN_PASSWORD || 'root',
    database: process.env.DB_POSTGRESQL_MAIN_DATABASE || 'cineflix_db',
    host: process.env.DB_POSTGRESQL_MAIN_HOST || '127.0.0.1',
    port: process.env.DB_POSTGRESQL_MAIN_PORT || 5432,
    dialect: 'postgres',
    logging: true,
};
