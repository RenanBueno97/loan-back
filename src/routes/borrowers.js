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
    paid_installments: paidInstallments, pending_installments: Math.max(0, n - paidInstallments), schedule
  };
}

// GET all - admin sees all, cliente sees only own borrower
router.get('/', async (req, res) => {
  let borrowers;
  if (req.user.role === 'cliente' && req.user.borrower_id) {
    borrowers = await query('SELECT * FROM borrowers WHERE id = $1 ORDER BY created_at DESC', [req.user.borrower_id]);
  } else {
    borrowers = await query('SELECT * FROM borrowers ORDER BY created_at DESC');
  }
  res.json(borrowers.rows);
});

// GET single - admin any, cliente only own
router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM borrowers WHERE id = $1', [req.params.id]);
  const borrower = rows[0];
  if (!borrower) return res.status(404).json({ error: 'Borrower not found' });
  if (req.user.role === 'cliente' && req.user.borrower_id && req.user.borrower_id !== borrower.id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  const loansResult = await query(`
    SELECT loans.*, COALESCE(SUM(payments.amount), 0) as total_paid
    FROM loans LEFT JOIN payments ON payments.loan_id = loans.id
    WHERE loans.borrower_id = $1 GROUP BY loans.id ORDER BY loans.created_at DESC
  `, [req.params.id]);
  const loans = loansResult.rows;
  const loansWithBalance = [];
  for (const loan of loans) {
    loansWithBalance.push({ ...loan, ...await calcBalance(loan) });
  }
  res.json({ ...borrower, loans: loansWithBalance });
});

// POST/PUT/DELETE - admin only
router.post('/', requireAdmin, async (req, res) => {
  const { name, phone, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const { rows } = await query(
    'INSERT INTO borrowers (name, phone, address, notes) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, phone || null, address || null, notes || null]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { rows: existing } = await query('SELECT * FROM borrowers WHERE id = $1', [req.params.id]);
  if (existing.length === 0) return res.status(404).json({ error: 'Borrower not found' });

  const borrower = existing[0];
  const { name, phone, address, notes } = req.body;
  const { rows } = await query(
    'UPDATE borrowers SET name = $1, phone = $2, address = $3, notes = $4 WHERE id = $5 RETURNING *',
    [name || borrower.name, phone ?? null, address ?? null, notes ?? null, borrower.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { rowCount } = await query('DELETE FROM borrowers WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Borrower not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
