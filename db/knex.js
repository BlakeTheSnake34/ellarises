// db/knex.js
require('dotenv').config();

const knexConfig = require('../knexfile');

// default to development locally, EB will set NODE_ENV=production
const environment = process.env.NODE_ENV || 'development';

const knex = require('knex')(knexConfig[environment]);

module.exports = knex;

