require('dotenv').config();

module.exports = {
    username: process.env.DB_POSTGRESQL_MAIN_USERNAME,
    password: process.env.DB_POSTGRESQL_MAIN_PASSWORD,
    database: process.env.DB_POSTGRESQL_MAIN_DATABASE,
    host: process.env.DB_POSTGRESQL_MAIN_HOST || 'db',
    port: process.env.DB_POSTGRESQL_MAIN_PORT,
    dialect: 'postgres',
    logging: true,
    ...(process.env.DB_POSTGRESQL_MAIN_SSL === 'true'
        ? {
              dialectOptions: {
                  ssl: {
                      require: true,
                      rejectUnauthorized: false,
                  },
              },
          }
        : {}),
};
