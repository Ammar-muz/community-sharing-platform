const test = require('node:test');
const assert = require('node:assert/strict');
const payment = require('../lib/payment-utils.cjs');

const approvedBooking = (overrides = {}) => ({
  renter: 'renter-id',
  status: 'accepted',
  totalAmountMinor: 10001,
  depositAmountMinor: 3000,
  amountPaidMinor: 0,
  remainingBalanceMinor: 10001,
  paymentStatus: 'unpaid',
  ...overrides
});

const paymentAttempt = (purpose, amount, overrides = {}) => ({
  expectedAmountMinor: amount,
  purpose,
  currency: 'LKR',
  status: 'pending',
  ...overrides
});

const notification = (amount, statusCode = '2', overrides = {}) => ({
  payhere_amount: (amount / 100).toFixed(2),
  payhere_currency: 'LKR',
  status_code: statusCode,
  payment_id: 'provider-tx-1',
  ...overrides
});

test('rental dates are whole days, end-exclusive, and at least one day', () => {
  assert.equal(payment.parseRentalDays('2026-02-28', '2026-03-01'), 1);
  assert.equal(payment.parseRentalDays('2026-03-01', '2026-03-04'), 3);
  assert.throws(() => payment.parseRentalDays('2026-03-02', '2026-03-02'), /valid rental dates/);
  assert.throws(() => payment.parseRentalDays('2026-02-30', '2026-03-02'), /valid rental dates/);
});

test('price snapshot rounds to minor units and deposit plus balance equals total', () => {
  const snapshot = payment.createPriceSnapshot(100.005, 3, 30);
  assert.equal(snapshot.dailyPriceMinor, 10001);
  assert.equal(snapshot.totalAmountMinor, 30003);
  assert.equal(snapshot.depositAmountMinor, 9001);
  assert.equal(
    snapshot.depositAmountMinor + (snapshot.totalAmountMinor - snapshot.depositAmountMinor),
    snapshot.totalAmountMinor
  );
});

test('smallest supported rental still has a positive deposit and exact balance', () => {
  const snapshot = payment.createPriceSnapshot(0.05, 1, 30);
  assert.equal(snapshot.depositAmountMinor, 2);
  assert.equal(snapshot.remainingBalanceMinor, 5);
  assert.equal(snapshot.depositAmountMinor + (snapshot.totalAmountMinor - snapshot.depositAmountMinor), snapshot.totalAmountMinor);
});

test('PayHere decimal amounts convert without floating-point arithmetic', () => {
  assert.equal(payment.decimalToMinor('123.45'), 12345);
  assert.equal(payment.decimalToMinor('123'), 12300);
  assert.equal(payment.decimalToMinor('1.234'), null);
  assert.equal(payment.minorToDecimal(12345), '123.45');
});

test('PayHere configuration requires sandbox credentials and public HTTPS URLs', () => {
  assert.match(payment.payHereConfigurationError({ mode: 'live' }), /Live payments are disabled/);
  assert.match(payment.payHereConfigurationError({
    mode: 'sandbox',
    merchantId: 'merchant',
    merchantSecret: 'secret',
    siteUrl: 'http://localhost:3000',
    notifyUrl: 'http://localhost:3000/api/payments/payhere/notify'
  }), /public HTTPS URLs/);
  assert.equal(payment.payHereConfigurationError({
    mode: 'sandbox',
    merchantId: 'merchant',
    merchantSecret: 'secret',
    siteUrl: 'https://share.example',
    notifyUrl: 'https://share.example/api/payments/payhere/notify'
  }), null);
});

test('mock provider needs no PayHere credentials while unknown providers are rejected', () => {
  assert.equal(payment.getPaymentProvider(undefined, 'development'), 'mock');
  assert.equal(payment.getPaymentProvider(undefined, 'production'), 'payhere');
  assert.equal(payment.getPaymentProvider('payhere', 'development'), 'payhere');
  assert.equal(payment.paymentProviderConfigurationError({ provider: 'mock' }), null);
  assert.match(payment.paymentProviderConfigurationError({ provider: 'unsupported' }), /PAYMENT_PROVIDER/);
});

test('PayHere webhook signatures use the documented hash and reject tampering', () => {
  const fields = {
    merchant_id: '12345',
    order_id: 'CS-test',
    payhere_amount: '100.00',
    payhere_currency: 'LKR',
    status_code: '2'
  };
  const secret = 'sandbox-secret';
  const md5sig = payment.md5Upper(
    `${fields.merchant_id}${fields.order_id}${fields.payhere_amount}${fields.payhere_currency}${fields.status_code}${payment.md5Upper(secret)}`
  );
  assert.equal(payment.verifyPayHereNotification({ ...fields, md5sig }, secret), true);
  assert.equal(payment.verifyPayHereNotification({ ...fields, md5sig: '0'.repeat(32) }, secret), false);
  assert.equal(payment.verifyPayHereNotification({ ...fields, order_id: 'tampered', md5sig }, secret), false);
});

test('only the renter can pay and payment requires owner acceptance', () => {
  assert.throws(() => payment.validateCheckout(approvedBooking(), 'owner-id', 'full'), { status: 403 });
  assert.throws(() => payment.validateCheckout(
    approvedBooking({ status: 'pending' }), 'renter-id', 'full'
  ), { status: 409 });
});

test('full payment is rejected after any prior successful payment', () => {
  assert.throws(() => payment.validateCheckout(
    approvedBooking({ amountPaidMinor: 3000, remainingBalanceMinor: 7001, paymentStatus: 'partially_paid' }),
    'renter-id',
    'full'
  ), { status: 409 });
});

test('active checkout reservation prevents another concurrent attempt', () => {
  assert.throws(() => payment.validateCheckout(
    approvedBooking({ activePaymentAttempt: 'attempt-id' }), 'renter-id', 'full'
  ), { status: 409 });
});

test('full payment success clears balance and marks booking paid', () => {
  const transition = payment.applyPayHereNotification(
    paymentAttempt('full', 10001),
    approvedBooking(),
    notification(10001)
  );
  assert.equal(transition.paymentStatus, 'successful');
  assert.equal(transition.bookingPaymentStatus, 'paid');
  assert.equal(transition.amountPaidMinor, 10001);
  assert.equal(transition.remainingBalanceMinor, 0);
});

test('mock payment success updates the booking and produces a synthetic transaction reference', () => {
  const transition = payment.applyMockPaymentResult(
    { ...paymentAttempt('full', 10001), provider: 'mock', merchantOrderId: 'CS-demo' },
    approvedBooking(),
    'success'
  );
  assert.equal(transition.paymentStatus, 'successful');
  assert.equal(transition.providerTransactionRef, 'MOCK-CS-demo');
  assert.equal(transition.bookingPaymentStatus, 'paid');
  assert.equal(transition.remainingBalanceMinor, 0);
});

test('mock deposit and remaining-balance payments settle the booking exactly once', () => {
  const depositPayment = {
    ...paymentAttempt('deposit', 3000),
    provider: 'mock',
    merchantOrderId: 'CS-deposit'
  };
  const deposit = payment.applyMockPaymentResult(depositPayment, approvedBooking(), 'success');
  assert.equal(deposit.bookingPaymentStatus, 'partially_paid');
  assert.equal(deposit.remainingBalanceMinor, 7001);
  assert.equal(payment.applyMockPaymentResult(
    { ...depositPayment, status: 'successful' },
    { ...approvedBooking(), amountPaidMinor: 3000, remainingBalanceMinor: 7001, paymentStatus: 'partially_paid' },
    'success'
  ).unchanged, true);

  const balance = payment.applyMockPaymentResult(
    { ...paymentAttempt('remaining_balance', 7001), provider: 'mock', merchantOrderId: 'CS-balance' },
    { ...approvedBooking(), amountPaidMinor: 3000, remainingBalanceMinor: 7001, paymentStatus: 'partially_paid' },
    'success'
  );
  assert.equal(balance.amountPaidMinor, 10001);
  assert.equal(balance.remainingBalanceMinor, 0);
  assert.equal(balance.bookingPaymentStatus, 'paid');
});

test('mock failures and cancellations do not change booking totals', () => {
  for (const [result, status] of [['failure', 'failed'], ['cancel', 'cancelled']]) {
    const transition = payment.applyMockPaymentResult(
      { ...paymentAttempt('deposit', 3000), provider: 'mock' },
      approvedBooking(),
      result
    );
    assert.equal(transition.paymentStatus, status);
    assert.equal(transition.amountPaidMinor, undefined);
  }
});

test('mock payment rejects non-mock attempts and prevents changing a finished attempt', () => {
  assert.throws(() => payment.applyMockPaymentResult(
    { ...paymentAttempt('full', 10001), provider: 'payhere' },
    approvedBooking(),
    'success'
  ), { status: 400 });
  assert.throws(() => payment.applyMockPaymentResult(
    { ...paymentAttempt('full', 10001), provider: 'mock', status: 'failed' },
    approvedBooking(),
    'success'
  ), { status: 409 });
});

test('deposit success followed by remaining-balance success pays exactly the total', () => {
  const booking = approvedBooking();
  const deposit = payment.applyPayHereNotification(
    paymentAttempt('deposit', 3000), booking, notification(3000)
  );
  assert.equal(deposit.bookingPaymentStatus, 'partially_paid');
  assert.equal(deposit.remainingBalanceMinor, 7001);

  const remaining = payment.applyPayHereNotification(
    paymentAttempt('remaining_balance', 7001),
    { ...booking, amountPaidMinor: deposit.amountPaidMinor, remainingBalanceMinor: deposit.remainingBalanceMinor },
    notification(7001)
  );
  assert.equal(remaining.amountPaidMinor, 10001);
  assert.equal(remaining.remainingBalanceMinor, 0);
  assert.equal(remaining.bookingPaymentStatus, 'paid');
});

test('failed or cancelled attempts do not count toward the booking or erase a deposit', () => {
  const failed = payment.applyPayHereNotification(
    paymentAttempt('deposit', 3000), approvedBooking(), notification(3000, '-2')
  );
  assert.equal(failed.paymentStatus, 'failed');
  assert.equal(failed.amountPaidMinor, undefined);
  const cancelled = payment.applyPayHereNotification(
    paymentAttempt('deposit', 3000), approvedBooking(), notification(3000, '-1')
  );
  assert.equal(cancelled.paymentStatus, 'cancelled');

  const outOfOrderFailure = payment.applyPayHereNotification(
    paymentAttempt('deposit', 3000, { status: 'successful' }),
    approvedBooking({ amountPaidMinor: 3000, remainingBalanceMinor: 7001, paymentStatus: 'partially_paid' }),
    notification(3000, '-2')
  );
  assert.equal(outOfOrderFailure.unchanged, true);
});

test('success notification can safely supersede an earlier failed notification', () => {
  const transition = payment.applyPayHereNotification(
    paymentAttempt('full', 10001, { status: 'failed' }),
    approvedBooking(),
    notification(10001)
  );
  assert.equal(transition.paymentStatus, 'successful');
  assert.equal(transition.remainingBalanceMinor, 0);
});

test('duplicate successful webhook cannot add the payment twice', () => {
  const transition = payment.applyPayHereNotification(
    paymentAttempt('full', 10001, { status: 'successful' }),
    approvedBooking({ amountPaidMinor: 10001, remainingBalanceMinor: 0, paymentStatus: 'paid' }),
    notification(10001)
  );
  assert.equal(transition.unchanged, true);
});

test('bad webhook amount and currency are rejected', () => {
  assert.throws(() => payment.applyPayHereNotification(
    paymentAttempt('full', 10001), approvedBooking(), notification(9999)
  ), { status: 400 });
  assert.throws(() => payment.applyPayHereNotification(
    paymentAttempt('full', 10001), approvedBooking(), notification(10001, '2', { payhere_currency: 'USD' })
  ), { status: 400 });
});

test('already paid booking rejects further checkout attempts', () => {
  assert.throws(() => payment.validateCheckout(
    approvedBooking({ amountPaidMinor: 10001, remainingBalanceMinor: 0, paymentStatus: 'paid' }),
    'renter-id',
    'remaining_balance'
  ), { status: 409 });
});

test('browser redirect data is not a payment confirmation', () => {
  const result = payment.paymentAttemptStatusFromPayHere(undefined, 'pending');
  assert.equal(result, null);
  assert.equal(payment.paymentAttemptStatusFromPayHere('2', 'pending'), 'successful');
});
