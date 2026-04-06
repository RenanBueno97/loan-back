-- Loan Control Database Schema
-- This file is also handled by src/utils/db.js init() at runtime,
-- but serves as a standalone reference and backup for Docker.

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
