// knexfile.js
require('dotenv').config();

const baseConfig = {
  client: 'pg',
  migrations: {
    directory: './db/migrations'
  },
  seeds: {
    directory: './db/seeds'
  }
};

module.exports = {

  // -----------------------------------
  // LOCAL DEVELOPMENT
  // -----------------------------------
  development: {
    ...baseConfig,
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'ella_rises_dev'
    }
  },

  // -----------------------------------
  // PRODUCTION (ELASTIC BEANSTALK + RDS)
  // -----------------------------------
  production: {
    ...baseConfig,
    connection: {
      host: process.env.DB_HOST,       // <-- RDS endpoint from EB env vars
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }  // required for AWS RDS
    },
    pool: { min: 2, max: 10 },
    migrations: { tableName: 'knex_migrations' }
  }

};
