// db/knex.js
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
console.log('Knex using environment:', environment);   // add this line

const knex = require('knex')(knexConfig[environment]);

module.exports = knex;






