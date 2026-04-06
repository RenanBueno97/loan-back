const express = require('express');
const router = express.Router();
const { query } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');

router.post('/', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  const { loan_id, amount, notes } = req.body;
  if (!loan_id || amount == null || isNaN(Number(amount))) return res.status(400).json({ error: 'Loan ID and amount are required and must be a valid number' });
  const cleanAmount = Number(amount);

  const { rows: loanRows } = await query('SELECT * FROM loans WHERE id = $1', [loan_id]);
  const loan = loanRows[0];
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  const { rows: paidRows } = await query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE loan_id = $1', [loan_id]);
  const totalPaid = (paidRows[0].total || 0) + cleanAmount;
  const n = loan.installments || 1;
  const interest = loan.interest_type === 'compound'
    ? loan.principal * Math.pow(1 + loan.interest_rate / 100, n) - loan.principal
    : loan.principal * (loan.interest_rate / 100) * n;
  const totalDebt = loan.principal + interest;
  const newStatus = totalPaid >= totalDebt ? 'paid' : 'active';

  await query('INSERT INTO payments (loan_id, amount, notes) VALUES ($1, $2, $3)', [loan_id, cleanAmount, notes || null]);
  await query('UPDATE loans SET status = $1 WHERE id = $2', [newStatus, loan_id]);

  res.status(201).json({ loan_id, amount: cleanAmount, notes });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { rows: paymentRows } = await query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
  const payment = paymentRows[0];
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  await query('DELETE FROM payments WHERE id = $1', [req.params.id]);
  const { rows: sumRows } = await query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE loan_id = $1', [payment.loan_id]);
  const { rows: loanRows } = await query('SELECT * FROM loans WHERE id = $1', [payment.loan_id]);
  const loan = loanRows[0];
  const n = loan.installments || 1;
  const interest = loan.interest_type === 'compound'
    ? loan.principal * Math.pow(1 + loan.interest_rate / 100, n) - loan.principal
    : loan.principal * (loan.interest_rate / 100) * n;
  if (sumRows[0].total < loan.principal + interest) {
    await query('UPDATE loans SET status = $1 WHERE id = $2', ['active', payment.loan_id]);
  }
  res.json({ message: 'Payment deleted' });
});

module.exports = router;
