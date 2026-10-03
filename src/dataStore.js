const { v4: uuid } = require('uuid');

const db = {
  users: [],
  books: [],
  bookCopies: [],
  settings: {
    finePerDay: 5,
    loanDays: 14,
    requestExpiryHours: 48,
    replacementChargeLost: 500,
    replacementChargeDamaged: 250,
    dueSoonDays: 2,
  },
  borrowRequests: [],
  loans: [],
  reservations: [],
  payments: [],
  notifications: [],
  auditLogs: [],
};

function createId(prefix) {
  return `${prefix}_${uuid()}`;
}

module.exports = { db, createId };
