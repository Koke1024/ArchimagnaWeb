console.dir(process.env);

const db = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.REACT_APP_DB_HOST,
    user: process.env.REACT_APP_DB_USER,
    password: process.env.REACT_APP_DB_PASSWORD,
    database: process.env.REACT_APP_DB_NAME,
  },
});

module.exports = db;