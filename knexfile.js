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

  // -------------------------------
  // LOCAL DEVELOPMENT
  // -------------------------------
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

  // -------------------------------
  // RENDER PRODUCTION ENVIRONMENT
  // -------------------------------
  production: {
    ...baseConfig,
    connection: process.env.DATABASE_URL + '?sslmode=require',
    pool: { min: 2, max: 10 },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  // -------------------------------
  // AWS RDS ENVIRONMENT
  // (your teammate's configuration)
  // -------------------------------
  aws: {
    ...baseConfig,
    connection: {
      host: process.env.RDS_HOSTNAME,
      port: process.env.RDS_PORT || 5432,
      user: process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DB_NAME,
      ssl: { rejectUnauthorized: false }
    }
  }

};
