const DAY = 24 * 60 * 60 * 1000

// 14 Nov 2026
export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

// ₹5, ₹12.50 (change 'INR' / 'en-IN' here if you use another currency)
export const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)

// whole days from one date to another (rounded up)
export const daysBetween = (from, to) => Math.ceil((new Date(to) - new Date(from)) / DAY)
