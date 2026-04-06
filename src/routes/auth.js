const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password sao obrigatorios' });
  }

  const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, borrower_id: user.borrower_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role, borrower_id: user.borrower_id } });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout realizado' });
});

router.get('/me', authenticate, async (req, res) => {
  const { rows } = await query('SELECT id, username, role, borrower_id FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });
  res.json(user);
});

module.exports = router;
