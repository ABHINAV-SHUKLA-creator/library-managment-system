const cron = require('node-cron');
const { db } = require('../dataStore');
const { notify } = require('./notificationService');

function runMaintenance(now = new Date()) {
  db.borrowRequests
    .filter((r) => ['pending', 'queued'].includes(r.status) && new Date(r.expiresAt) < now)
    .forEach((r) => {
      r.status = 'expired';
    });

  db.loans
    .filter((l) => l.status === 'issued' && new Date(l.dueAt) < now)
    .forEach((l) => {
      l.status = 'overdue';
      notify('overdue', l.userId, `Loan ${l.id} is overdue`);
    });

  const dueSoonMs = db.settings.dueSoonDays * 24 * 60 * 60 * 1000;
  db.loans
    .filter((l) => l.status === 'issued')
    .forEach((l) => {
      const due = new Date(l.dueAt);
      if (due.getTime() - now.getTime() <= dueSoonMs && due > now) {
        notify('due_soon', l.userId, `Loan ${l.id} is due soon`);
      }
    });
}

function startScheduler() {
  return cron.schedule('*/30 * * * *', () => runMaintenance(new Date()));
}

module.exports = { runMaintenance, startScheduler };
