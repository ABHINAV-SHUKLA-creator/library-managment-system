const { calculateFine } = require('../src/services/fineService');

describe('fine calculation', () => {
  it('returns 0 when returned on time', () => {
    const fine = calculateFine({
      dueAt: '2026-01-10T00:00:00.000Z',
      returnedAt: '2026-01-10T00:00:00.000Z',
      finePerDay: 5,
    });
    expect(fine).toBe(0);
  });

  it('charges per overdue day', () => {
    const fine = calculateFine({
      dueAt: '2026-01-10T00:00:00.000Z',
      returnedAt: '2026-01-12T03:00:00.000Z',
      finePerDay: 5,
    });
    expect(fine).toBe(15);
  });
});
