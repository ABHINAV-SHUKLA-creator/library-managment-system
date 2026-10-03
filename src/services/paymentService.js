const Razorpay = require('razorpay');
const { db, createId } = require('../dataStore');

function mockPay({ loanId, amount, userId }) {
  const payment = {
    id: createId('pay'),
    loanId,
    userId,
    amount,
    provider: 'mock',
    status: 'paid',
    createdAt: new Date().toISOString(),
  };
  db.payments.push(payment);
  return payment;
}

async function createRazorpayOrder({ amount, receipt }) {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials are not configured');
  }
  const razorpay = new Razorpay({ key_id, key_secret });
  return razorpay.orders.create({ amount, currency: 'INR', receipt });
}

module.exports = { mockPay, createRazorpayOrder };
