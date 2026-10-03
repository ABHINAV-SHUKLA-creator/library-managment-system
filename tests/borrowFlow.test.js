const request = require('supertest');
const { app, db } = require('../src/app');

function resetDb() {
  db.users.length = 0;
  db.books.length = 0;
  db.bookCopies.length = 0;
  db.borrowRequests.length = 0;
  db.loans.length = 0;
  db.reservations.length = 0;
  db.notifications.length = 0;
  db.auditLogs.length = 0;
}

describe('borrow issue return flow', () => {
  beforeEach(() => {
    resetDb();
  });

  it('creates request, approves, and returns with fine', async () => {
    await request(app).post('/auth/register').send({
      name: 'Librarian',
      email: 'lib@example.com',
      password: 'password',
      role: 'librarian',
    });
    await request(app).post('/auth/register').send({
      name: 'Student',
      email: 'student@example.com',
      password: 'password',
      role: 'student',
    });

    const librarianLogin = await request(app).post('/auth/login').send({ email: 'lib@example.com', password: 'password' });
    const studentLogin = await request(app).post('/auth/login').send({ email: 'student@example.com', password: 'password' });

    const librarianToken = librarianLogin.body.token;
    const studentToken = studentLogin.body.token;

    const book = await request(app)
      .post('/books')
      .auth(librarianToken, { type: 'bearer' })
      .send({ title: 'Clean Code', author: 'Robert C. Martin', isbn: '123' });

    await request(app)
      .post('/book-copies')
      .auth(librarianToken, { type: 'bearer' })
      .send({ bookId: book.body.id, code: 'COPY-1' });

    const borrowRequest = await request(app)
      .post('/borrow-requests')
      .auth(studentToken, { type: 'bearer' })
      .send({ bookId: book.body.id });

    const approve = await request(app)
      .post(`/borrow-requests/${borrowRequest.body.id}/approve`)
      .auth(librarianToken, { type: 'bearer' })
      .send();

    expect(approve.status).toBe(201);
    const loanId = approve.body.id;

    const returnedAt = new Date(new Date(approve.body.dueAt).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const returned = await request(app)
      .post(`/loans/${loanId}/return`)
      .auth(librarianToken, { type: 'bearer' })
      .send({ returnedAt });

    expect(returned.status).toBe(200);
    expect(returned.body.fine).toBe(10);
    expect(db.auditLogs.some((a) => a.action === 'loan.issued')).toBe(true);
    expect(db.auditLogs.some((a) => a.action === 'loan.returned')).toBe(true);
  });
});
