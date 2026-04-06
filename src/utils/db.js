require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'loan_control',
  password: process.env.DB_PASS || 'admin123',
  port: process.env.DB_PORT || 5432,
});

async function init() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS borrowers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        notes TEXT,
        company_id INTEGER REFERENCES companies(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        borrower_id INTEGER NOT NULL REFERENCES borrowers(id),
        principal REAL NOT NULL,
        interest_rate REAL NOT NULL DEFAULT 0,
        interest_type TEXT DEFAULT 'simple',
        installments INTEGER DEFAULT 1,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        loan_date TIMESTAMP,
        due_date TIMESTAMP,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER NOT NULL REFERENCES loans(id),
        amount REAL NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        borrower_id INTEGER REFERENCES borrowers(id),
        company_id INTEGER REFERENCES companies(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`INSERT INTO companies (name) VALUES ('Padrao') ON CONFLICT (name) DO NOTHING;`);

    const adminExists = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminExists.rows.length === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await client.query(
        'INSERT INTO users (username, password, role, company_id) VALUES ($1, $2, $3, (SELECT id FROM companies LIMIT 1))',
        ['admin', hash, 'admin']
      );
    }

    console.log('Database initialized');
  } finally {
    client.release();
  }
}

async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    return result;
  } finally {
    // silent
  }
}

module.exports = { pool, query, init };
