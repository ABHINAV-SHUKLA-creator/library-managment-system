import { GRACE_PERIOD_DAYS, DAILY_FINE } from '../constants.js';

function calcFine(dueDate, returnDate, dailyFine = DAILY_FINE, gracePeriodDays = GRACE_PERIOD_DAYS) {
    if (!dueDate) return 0;

    const now = returnDate || new Date();
    if (now <= dueDate) return 0;

    const diffMs = now - dueDate;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const billableDays = Math.max(0, diffDays - gracePeriodDays);

    return billableDays * dailyFine;
}

export { calcFine };
