// knexfile.js
require('dotenv').config();

const sharedDevConn = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'ella_rises_dev',
  port: process.env.DB_PORT || 5432
};

module.exports = {
  development: {
    client: 'pg',
    connection: sharedDevConn,
    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.RDS_HOSTNAME
      ? {
          host: process.env.RDS_HOSTNAME,
          user: process.env.RDS_USERNAME,
          password: process.env.RDS_PASSWORD,
          database: process.env.RDS_DB_NAME,
          port: process.env.RDS_PORT || 5432,
          ssl: { rejectUnauthorized: false }
        }
      : sharedDevConn,
    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  }
};


