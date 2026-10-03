function daysBetween(a, b) {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function calculateFine({ dueAt, returnedAt, finePerDay }) {
  const due = new Date(dueAt);
  const returned = new Date(returnedAt);
  if (returned <= due) {
    return 0;
  }
  return daysBetween(due, returned) * finePerDay;
}

module.exports = { calculateFine };
