const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { db, createId } = require('./dataStore');
const { signToken, requireAuth, requireRole } = require('./middleware/auth');
const { calculateFine } = require('./services/fineService');
const { notify } = require('./services/notificationService');
const { mockPay, createRazorpayOrder } = require('./services/paymentService');

const app = express();
app.use(express.json());
app.use(helmet());
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

const swaggerDocument = YAML.load('./docs/openapi.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

function addAudit(action, actorId, metadata = {}) {
  db.auditLogs.push({
    id: createId('audit'),
    action,
    actorId,
    metadata,
    createdAt: new Date().toISOString(),
  });
}

function firstAvailableCopy(bookId) {
  return db.bookCopies.find((copy) => copy.bookId === bookId && copy.status === 'available');
}

app.post('/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['student', 'librarian', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (db.users.some((u) => u.email === email)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  const user = {
    id: createId('user'),
    name,
    email,
    role,
    passwordHash: await bcrypt.hash(password, 8),
  };
  db.users.push(user);
  res.status(201).json({ id: user.id, email: user.email, role: user.role });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  return res.json({ token: signToken(user) });
});

app.get('/books', (req, res) => {
  const data = db.books.map((b) => ({
    ...b,
    copies: db.bookCopies.filter((c) => c.bookId === b.id),
  }));
  res.json(data);
});

app.post('/books', requireAuth, requireRole('librarian', 'admin'), (req, res) => {
  const book = {
    id: createId('book'),
    title: req.body.title,
    author: req.body.author,
    isbn: req.body.isbn,
  };
  db.books.push(book);
  res.status(201).json(book);
});

app.put('/books/:id', requireAuth, requireRole('librarian', 'admin'), (req, res) => {
  const book = db.books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  Object.assign(book, req.body);
  return res.json(book);
});

app.delete('/books/:id', requireAuth, requireRole('admin'), (req, res) => {
  const index = db.books.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }
  db.books.splice(index, 1);
  db.bookCopies = db.bookCopies.filter((c) => c.bookId !== req.params.id);
  return res.status(204).send();
});

app.post('/book-copies', requireAuth, requireRole('librarian', 'admin'), (req, res) => {
  const copy = {
    id: createId('copy'),
    bookId: req.body.bookId,
    code: req.body.code,
    status: 'available',
  };
  db.bookCopies.push(copy);
  res.status(201).json(copy);
});

app.get('/book-copies', requireAuth, requireRole('librarian', 'admin'), (req, res) => {
  res.json(db.bookCopies);
});

app.put('/book-copies/:id', requireAuth, requireRole('librarian', 'admin'), (req, res) => {
  const copy = db.bookCopies.find((c) => c.id === req.params.id);
  if (!copy) {
    return res.status(404).json({ error: 'Copy not found' });
  }
  Object.assign(copy, req.body);
  return res.json(copy);
});

app.delete('/book-copies/:id', requireAuth, requireRole('admin'), (req, res) => {
  const index = db.bookCopies.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Copy not found' });
  }
  db.bookCopies.splice(index, 1);
  return res.status(204).send();
});

app.get('/settings', requireAuth, requireRole('admin'), (req, res) => {
  res.json(db.settings);
});

app.put('/settings', requireAuth, requireRole('admin'), (req, res) => {
  Object.assign(db.settings, req.body);
  addAudit('settings.updated', req.user.id, req.body);
  res.json(db.settings);
});

app.post('/borrow-requests', requireAuth, requireRole('student'), (req, res) => {
  const { bookId } = req.body;
  const request = {
    id: createId('req'),
    userId: req.user.id,
    bookId,
    status: 'pending',
    expiresAt: new Date(Date.now() + db.settings.requestExpiryHours * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  const available = firstAvailableCopy(bookId);
  if (!available) {
    request.status = 'queued';
    const reservation = {
      id: createId('res'),
      userId: req.user.id,
      bookId,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };
    db.reservations.push(reservation);
  }

  db.borrowRequests.push(request);
  res.status(201).json(request);
});

app.post('/borrow-requests/:id/approve', requireAuth, requireRole('librarian', 'admin'), (req, res) => {
  const request = db.borrowRequests.find((r) => r.id === req.params.id);
  if (!request || !['pending', 'queued'].includes(request.status)) {
    return res.status(404).json({ error: 'Request not approvable' });
  }
  const copy = firstAvailableCopy(request.bookId);
  if (!copy) {
    request.status = 'queued';
    return res.status(409).json({ error: 'No copy available; request remains queued' });
  }
  copy.status = 'issued';
  request.status = 'approved';

  const loan = {
    id: createId('loan'),
    requestId: request.id,
    userId: request.userId,
    copyId: copy.id,
    bookId: request.bookId,
    issuedAt: new Date().toISOString(),
    dueAt: new Date(Date.now() + db.settings.loanDays * 24 * 60 * 60 * 1000).toISOString(),
    returnedAt: null,
    status: 'issued',
    renewalUsed: false,
    finePaid: false,
    replacementCharge: 0,
  };
  db.loans.push(loan);

  notify('request_approved', request.userId, `Request ${request.id} approved`);
  addAudit('loan.issued', req.user.id, { loanId: loan.id, requestId: request.id });

  return res.status(201).json(loan);
});

app.post('/loans/:id/return', requireAuth, requireRole('librarian', 'admin'), (req, res) => {
  const loan = db.loans.find((l) => l.id === req.params.id);
  if (!loan || !['issued', 'overdue'].includes(loan.status)) {
    return res.status(404).json({ error: 'Active loan not found' });
  }

  const returnedAt = req.body.returnedAt || new Date().toISOString();
  const fine = calculateFine({
    dueAt: loan.dueAt,
    returnedAt,
    finePerDay: db.settings.finePerDay,
  });

  loan.returnedAt = returnedAt;
  loan.status = 'returned';
  loan.fine = fine;

  const copy = db.bookCopies.find((c) => c.id === loan.copyId);
  if (copy) {
    copy.status = 'available';
  }

  const waiting = db.reservations.find((r) => r.bookId === loan.bookId && r.status === 'waiting');
  if (waiting) {
    waiting.status = 'ready';
  }

  addAudit('loan.returned', req.user.id, { loanId: loan.id, fine });

  res.json({ loan, fine });
});

app.post('/loans/:id/renew', requireAuth, requireRole('student'), (req, res) => {
  const loan = db.loans.find((l) => l.id === req.params.id && l.userId === req.user.id);
  if (!loan || loan.status !== 'issued') {
    return res.status(404).json({ error: 'Active loan not found' });
  }
  if (loan.renewalUsed) {
    return res.status(400).json({ error: 'Renewal already used' });
  }

  const waitingExists = db.reservations.some((r) => r.bookId === loan.bookId && r.status === 'waiting');
  if (waitingExists) {
    return res.status(409).json({ error: 'Renewal blocked due to reservation queue' });
  }

  loan.dueAt = new Date(new Date(loan.dueAt).getTime() + db.settings.loanDays * 24 * 60 * 60 * 1000).toISOString();
  loan.renewalUsed = true;
  res.json(loan);
});

app.post('/loans/:id/report-loss-damage', requireAuth, requireRole('librarian', 'admin'), (req, res) => {
  const loan = db.loans.find((l) => l.id === req.params.id);
  const { condition } = req.body;
  if (!loan || loan.status !== 'issued') {
    return res.status(404).json({ error: 'Active loan not found' });
  }
  if (!['lost', 'damaged'].includes(condition)) {
    return res.status(400).json({ error: 'Condition must be lost or damaged' });
  }
  loan.status = condition;
  loan.replacementCharge = condition === 'lost' ? db.settings.replacementChargeLost : db.settings.replacementChargeDamaged;

  const copy = db.bookCopies.find((c) => c.id === loan.copyId);
  if (copy) {
    copy.status = condition;
  }

  addAudit('loan.loss_damage', req.user.id, { loanId: loan.id, condition, charge: loan.replacementCharge });

  res.json({ loanId: loan.id, condition, replacementCharge: loan.replacementCharge });
});

app.post('/payments/mock', requireAuth, (req, res) => {
  const { loanId, amount } = req.body;
  const payment = mockPay({ loanId, amount, userId: req.user.id });
  const loan = db.loans.find((l) => l.id === loanId);
  if (loan) {
    loan.finePaid = true;
  }
  res.status(201).json(payment);
});

app.post('/payments/razorpay/order', requireAuth, async (req, res) => {
  try {
    const order = await createRazorpayOrder({
      amount: req.body.amount,
      receipt: req.body.receipt || `receipt_${Date.now()}`,
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/audit-logs', requireAuth, requireRole('admin'), (req, res) => {
  res.json(db.auditLogs);
});

module.exports = { app, db, addAudit };
