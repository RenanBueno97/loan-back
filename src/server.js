const express = require('express');
const cors = require('cors');
const { authenticate, requireAdmin } = require('./middleware/auth');
const { query, init } = require('./utils/db');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const borrowersRouter = require('./routes/borrowers');
const loansRouter = require('./routes/loans');
const paymentsRouter = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public auth routes
app.use('/api/auth', authRouter);

// All other routes require authentication
app.use('/api/users', authenticate, usersRouter);
app.use('/api/borrowers', authenticate, borrowersRouter);
app.use('/api/loans', authenticate, loansRouter);
app.use('/api/payments', authenticate, paymentsRouter);

// Dashboard summary
app.get('/api/dashboard', authenticate, async (req, res) => {
  const { user } = req;

  let whereClause = '';
  let params = [];
  if (user.role === 'cliente' && user.borrower_id) {
    whereClause = `WHERE loans.borrower_id = $1`;
    params = [user.borrower_id];
  }

  const totalBorrowersResult = await query(
    `SELECT COUNT(*) as count FROM borrowers WHERE id IN (SELECT borrower_id FROM loans ${whereClause})`, params
  );
  const totalBorrowers = parseInt(totalBorrowersResult.rows[0].count);

  const activeLoansResult = await query(
    `SELECT COUNT(*) as count FROM loans WHERE status = 'active' ${whereClause ? 'AND borrower_id = $1' : ''}`,
    whereClause ? params : []
  );
  const activeLoans = parseInt(activeLoansResult.rows[0].count);

  const activeLoanDataResult = await query(
    `SELECT * FROM loans WHERE status = 'active' ${whereClause ? 'AND borrower_id = $1' : ''}`,
    whereClause ? params : []
  );
  const activeLoanData = activeLoanDataResult.rows;

  let totalInvested = 0;
  let totalExpected = 0;
  let totalCollected = 0;
  let totalInstallments = 0;
  let paidInstallments = 0;

  for (const loan of activeLoanData) {
    if (loan) {
      const paymentsResult = await query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE loan_id = $1', [loan.id]);
      const paid = paymentsResult.rows[0].total || 0;
      const n = loan.installments || 1;
      const interest = loan.interest_type === 'compound'
        ? loan.principal * Math.pow(1 + loan.interest_rate / 100, n) - loan.principal
        : loan.principal * (loan.interest_rate / 100) * n;
      const totalDebt = loan.principal + interest;
      totalInvested += loan.principal;
      totalExpected += totalDebt;
      totalCollected += paid;
      totalInstallments += n;
      const installmentAmount = totalDebt / n;
      paidInstallments += Math.floor(paid / installmentAmount);
    }
  }

  res.json({
    totalBorrowers,
    activeLoans,
    totalInvested: +totalInvested.toFixed(2),
    totalExpected: +totalExpected.toFixed(2),
    totalCollected: +totalCollected.toFixed(2),
    totalPending: +(totalExpected - totalCollected).toFixed(2),
    totalInstallments,
    paidInstallments,
    pendingInstallments: totalInstallments - paidInstallments
  });
});

init().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
