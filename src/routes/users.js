const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all users - admin only
router.get('/', requireAdmin, async (req, res) => {
  const { rows } = await query(`
    SELECT u.id, u.username, u.role, u.created_at,
           b.name as borrower_name
    FROM users u
    LEFT JOIN borrowers b ON b.id = u.borrower_id
    ORDER BY u.created_at DESC
  `);
  res.json(rows);
});

// POST create user - admin only
router.post('/', requireAdmin, async (req, res) => {
  const { username, password, role, borrower_id } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password e role sao obrigatorios' });
  }

  const existing = await query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Nome de usuario ja existe' });
  }

  if (role === 'cliente' && borrower_id) {
    const borrower = await query('SELECT id FROM borrowers WHERE id = $1', [borrower_id]);
    if (borrower.rows.length === 0) {
      return res.status(400).json({ error: 'Cliente nao encontrado' });
    }
  }

  const hash = bcrypt.hashSync(password, 10);
  const { rows } = await query(
    'INSERT INTO users (username, password, role, borrower_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role, borrower_id',
    [username, hash, role, borrower_id || null]
  );
  res.status(201).json(rows[0]);
});

// PUT update user - admin only
router.put('/:id', requireAdmin, async (req, res) => {
  const { rows: existing } = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (existing.length === 0) return res.status(404).json({ error: 'Usuario nao encontrado' });

  const user = existing[0];
  const { password, role, borrower_id } = req.body;

  if (role || borrower_id !== undefined) {
    await query(
      'UPDATE users SET role = $1, borrower_id = $2 WHERE id = $3',
      [role || user.role, borrower_id ?? user.borrower_id, user.id]
    );
  }
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
  }

  const { rows } = await query('SELECT id, username, role, borrower_id FROM users WHERE id = $1', [user.id]);
  res.json(rows[0]);
});

// DELETE user - admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Usuario nao encontrado' });
  res.json({ message: 'Usuario removido' });
});

module.exports = router;
