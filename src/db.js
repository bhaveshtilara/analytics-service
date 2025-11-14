const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB,
  port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('🔥 Database connection error:', err.stack);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};