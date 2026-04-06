const express = require('express');
const router = express.Router();
const { query } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');

async function calcBalance(loan) {
  const { rows } = await query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE loan_id = $1', [loan.id]);
  const paid = rows[0].total || 0;
  const n = loan.installments || 1;
  const interest = loan.interest_type === 'compound'
    ? loan.principal * Math.pow(1 + loan.interest_rate / 100, n) - loan.principal
    : loan.principal * (loan.interest_rate / 100) * n;
  const totalDebt = loan.principal + interest;
  const remaining = Math.max(0, totalDebt - paid);
  const installmentAmount = n > 1 ? +((totalDebt / n).toFixed(2)) : totalDebt;
  const paidInstallments = installmentAmount > 0 ? Math.floor(paid / installmentAmount + 0.0001) : 0;
  const pendingInstallments = Math.max(0, n - paidInstallments);
  const baseDate = loan.loan_date || loan.created_at;
  const schedule = [];
  if (baseDate) {
    const dateStr = baseDate instanceof Date ? baseDate.toISOString() : String(baseDate);
    const parts = dateStr.split(/[-T: ]/);
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    for (let i = 1; i <= n; i++) {
      const dueDate = new Date(year, month - 1 + i, day);
      const dd = String(dueDate.getDate()).padStart(2, '0');
      const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
      const yy = dueDate.getFullYear();
      schedule.push({ number: i, due_date: `${yy}-${mm}-${dd}`, amount: +installmentAmount.toFixed(2) });
    }
  }
  return {
    totalDebt: +totalDebt.toFixed(2), paid: +paid.toFixed(2), remaining: +remaining.toFixed(2),
    installments: n, installment_amount: +installmentAmount.toFixed(2),
    paid_installments: paidInstallments, pending_installments: pendingInstallments, schedule
  };
}

router.get('/', async (req, res) => {
  let whereClause = '';
  let params = [];
  if (req.user.role === 'cliente' && req.user.borrower_id) {
    whereClause = 'WHERE loans.borrower_id = $1';
    params = [req.user.borrower_id];
  }
  const { rows: loans } = await query(`
    SELECT loans.*, borrowers.name as borrower_name
    FROM loans JOIN borrowers ON borrowers.id = loans.borrower_id
    ${whereClause} ORDER BY loans.created_at DESC
  `, params);
  const result = [];
  for (const loan of loans) {
    result.push({ ...loan, ...await calcBalance(loan) });
  }
  res.json(result);
});

router.get('/:id', async (req, res) => {
  const { rows } = await query(`
    SELECT loans.*, borrowers.name as borrower_name
    FROM loans JOIN borrowers ON borrowers.id = loans.borrower_id
    WHERE loans.id = $1
  `, [req.params.id]);
  const loan = rows[0];
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  if (req.user.role === 'cliente' && req.user.borrower_id && loan.borrower_id !== req.user.borrower_id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  const paymentsResult = await query('SELECT * FROM payments WHERE loan_id = $1 ORDER BY payment_date DESC', [req.params.id]);
  res.json({ ...loan, ...await calcBalance(loan), payments: paymentsResult.rows });
});

router.post('/', requireAdmin, async (req, res) => {
  const { borrower_id, principal, interest_rate = 0, interest_type = 'simple', installments = 1, loan_date, due_date, notes } = req.body;
  if (!borrower_id || principal == null) return res.status(400).json({ error: 'Borrower ID and principal are required' });
  const borrower = await query('SELECT * FROM borrowers WHERE id = $1', [borrower_id]);
  if (borrower.rows.length === 0) return res.status(404).json({ error: 'Borrower not found' });

  const { rows } = await query(`
    INSERT INTO loans (borrower_id, principal, interest_rate, interest_type, installments, loan_date, due_date, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `, [borrower_id, principal, interest_rate, interest_type, installments || 1, loan_date || null, due_date || null, notes || null]);

  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { rows: existingRows } = await query('SELECT * FROM loans WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Loan not found' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  const { principal, interest_rate, interest_type, due_date, status, notes, pay_off } = req.body;
  await query(`
    UPDATE loans SET principal = $1, interest_rate = $2, interest_type = $3, due_date = $4, status = $5, notes = $6
    WHERE id = $7
  `, [
    principal ?? existing.principal,
    interest_rate ?? existing.interest_rate,
    interest_type ?? existing.interest_type,
    due_date ?? existing.due_date,
    status ?? existing.status,
    notes ?? existing.notes,
    req.params.id
  ]);

  if (status === 'paid' && (pay_off === true || pay_off === undefined) && (existing.installments || 1) > 1 && existing.status !== 'paid') {
    const n = existing.installments || 1;
    const interest = existing.interest_type === 'compound'
      ? existing.principal * Math.pow(1 + existing.interest_rate / 100, n) - existing.principal
      : existing.principal * (existing.interest_rate / 100) * n;
    const totalDebt = existing.principal + interest;
    const { rows: paidRows } = await query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE loan_id = $1', [req.params.id]);
    const alreadyPaid = (paidRows[0].total || 0);
    const remaining = totalDebt - alreadyPaid;
    if (remaining > 0) {
      await query('INSERT INTO payments (loan_id, amount, notes) VALUES ($1, $2, $3)', [req.params.id, +remaining.toFixed(2), 'Quitacao antecipada']);
    }
  }
  const { rows } = await query('SELECT * FROM loans WHERE id = $1', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await query('DELETE FROM payments WHERE loan_id = $1', [req.params.id]);
  const { rowCount } = await query('DELETE FROM loans WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Loan not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
