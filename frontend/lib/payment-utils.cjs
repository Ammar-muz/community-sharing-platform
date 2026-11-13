const crypto = require('node:crypto');

function parseRentalDays(startDate, endDate) {
  const parseDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const timestamp = Date.parse(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
    return timestamp;
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (start === null || end === null || end <= start) {
    throw new Error('Choose valid rental dates. The end date is exclusive and must be after the start date.');
  }

  const days = (end - start) / 86_400_000;
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('A booking must include at least one chargeable rental day.');
  }
  return days;
}

function createPriceSnapshot(pricePerDay, days, depositPercent = 30) {
  const price = Number(pricePerDay);
  if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(days) || days < 1) {
    throw new Error('The listing price or rental dates are invalid.');
  }
  if (!Number.isInteger(depositPercent) || depositPercent < 1 || depositPercent > 99) {
    throw new Error('The reservation deposit percentage must be an integer from 1 to 99.');
  }

  const dailyPriceMinor = Math.round(price * 100);
  if (!Number.isSafeInteger(dailyPriceMinor) || dailyPriceMinor < 1) {
    throw new Error('The listing price is outside the supported range.');
  }
  const totalAmountMinor = dailyPriceMinor * days;
  if (!Number.isSafeInteger(totalAmountMinor)) {
    throw new Error('The rental total is outside the supported range.');
  }
  const depositAmountMinor = Math.min(
    totalAmountMinor,
    Math.max(1, Math.round(totalAmountMinor * depositPercent / 100))
  );
  return {
    currency: 'LKR',
    dailyPriceMinor,
    chargeableDays: days,
    totalAmountMinor,
    depositPercent,
    depositAmountMinor,
    amountPaidMinor: 0,
    remainingBalanceMinor: totalAmountMinor,
    paymentStatus: 'unpaid'
  };
}

function minorToDecimal(amountMinor) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 1) {
    throw new Error('Payment amount must be a positive integer number of minor units.');
  }
  return `${Math.floor(amountMinor / 100)}.${String(amountMinor % 100).padStart(2, '0')}`;
}

function decimalToMinor(amount) {
  if (typeof amount !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(amount)) return null;
  const [whole, fraction = ''] = amount.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(minor) ? minor : null;
}

function payHereConfigurationError({ mode, merchantId, merchantSecret, siteUrl, notifyUrl }) {
  if (mode !== 'sandbox') {
    return 'PayHere sandbox is not configured. Live payments are disabled.';
  }
  if (!merchantId || !merchantSecret || !siteUrl || !notifyUrl) {
    return 'PayHere sandbox credentials and public callback URLs are not configured.';
  }

  let site;
  let notification;
  try {
    site = new URL(siteUrl);
    notification = new URL(notifyUrl);
  } catch {
    return 'Set valid public HTTPS URLs for PAYMENT_SITE_URL and PAYHERE_NOTIFY_URL.';
  }

  const isLocalHost = hostname => ['localhost', '127.0.0.1', '::1'].includes(hostname);
  if (site.protocol !== 'https:' || notification.protocol !== 'https:' ||
      isLocalHost(site.hostname) || isLocalHost(notification.hostname)) {
    return 'PayHere checkout and notifications require public HTTPS URLs, not localhost.';
  }
  return null;
}

function getPaymentProvider(provider, environment = process.env.NODE_ENV) {
  if (provider) return provider;
  return environment === 'production' ? 'payhere' : 'mock';
}

function paymentProviderConfigurationError({ provider, mode, merchantId, merchantSecret, siteUrl, notifyUrl }) {
  if (provider === 'mock') return null;
  if (provider !== 'payhere') {
    return 'Set PAYMENT_PROVIDER to either mock or payhere.';
  }
  return payHereConfigurationError({ mode, merchantId, merchantSecret, siteUrl, notifyUrl });
}

function md5Upper(value) {
  return crypto.createHash('md5').update(value, 'utf8').digest('hex').toUpperCase();
}

function createPayHereHash(merchantId, orderId, amount, currency, merchantSecret) {
  return md5Upper(
    `${merchantId}${orderId}${amount}${currency}${md5Upper(merchantSecret)}`
  );
}

function validateCheckout(booking, userId, purpose) {
  if (booking.renter.toString() !== userId) {
    throw Object.assign(new Error('Only the renter can pay for this booking.'), { status: 403 });
  }
  if (booking.activePaymentAttempt) {
    throw Object.assign(new Error('A checkout is already in progress for this booking.'), { status: 409 });
  }
  if (!['accepted', 'confirmed'].includes(booking.status)) {
    throw Object.assign(new Error('Payment is available after the owner accepts the booking.'), { status: 409 });
  }
  if (!Number.isSafeInteger(booking.totalAmountMinor) ||
      !Number.isSafeInteger(booking.remainingBalanceMinor) ||
      !Number.isSafeInteger(booking.depositAmountMinor)) {
    throw Object.assign(new Error('This older booking has no price snapshot and cannot be paid online.'), { status: 409 });
  }
  if (booking.paymentStatus === 'paid' || booking.remainingBalanceMinor < 1) {
    throw Object.assign(new Error('This booking is already paid in full.'), { status: 409 });
  }

  if (purpose === 'full') {
    if (booking.amountPaidMinor !== 0) {
      throw Object.assign(new Error('Full payment is only available before any payment has been made. Pay the remaining balance.'), { status: 409 });
    }
    return booking.totalAmountMinor;
  }
  if (purpose === 'deposit') {
    if (booking.amountPaidMinor !== 0) {
      throw Object.assign(new Error('The reservation deposit has already been paid.'), { status: 409 });
    }
    return booking.depositAmountMinor;
  }
  if (purpose === 'remaining_balance') {
    if (booking.amountPaidMinor < 1) {
      throw Object.assign(new Error('Pay the reservation deposit or full amount first.'), { status: 409 });
    }
    return booking.remainingBalanceMinor;
  }
  throw Object.assign(new Error('Unsupported payment purpose.'), { status: 400 });
}

function verifyPayHereNotification(fields, merchantSecret) {
  const required = ['merchant_id', 'order_id', 'payhere_amount', 'payhere_currency', 'status_code', 'md5sig'];
  if (required.some(key => typeof fields[key] !== 'string' || fields[key].length === 0)) return false;
  const expected = md5Upper(
    `${fields.merchant_id}${fields.order_id}${fields.payhere_amount}${fields.payhere_currency}${fields.status_code}${md5Upper(merchantSecret)}`
  );
  const supplied = fields.md5sig.toUpperCase();
  if (!/^[A-F0-9]{32}$/.test(supplied)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

function paymentAttemptStatusFromPayHere(statusCode, currentStatus) {
  if (currentStatus === 'successful') return 'successful';
  if (statusCode === '2') return 'successful';
  if (statusCode === '0') return 'pending';
  if (statusCode === '-1') return 'cancelled';
  if (statusCode === '-2' || statusCode === '-3') return 'failed';
  return null;
}

function applyPayHereNotification(payment, booking, fields) {
  const receivedMinor = decimalToMinor(fields.payhere_amount);
  if (receivedMinor !== payment.expectedAmountMinor || fields.payhere_currency !== payment.currency) {
    throw Object.assign(new Error('Provider notification amount or currency did not match the expected payment.'), { status: 400 });
  }
  const nextStatus = paymentAttemptStatusFromPayHere(fields.status_code, payment.status);
  if (!nextStatus) throw Object.assign(new Error('Unknown provider payment status.'), { status: 400 });
  if (payment.status === 'successful') return { unchanged: true };
  if (nextStatus === 'successful' && !fields.payment_id) {
    throw Object.assign(new Error('Successful provider notification is missing its transaction reference.'), { status: 400 });
  }

  if (nextStatus !== 'successful') {
    return payment.status === 'pending'
      ? { paymentStatus: nextStatus, providerStatusCode: fields.status_code }
      : { unchanged: true };
  }

  return applySuccessfulPayment(
    payment,
    booking,
    fields.payment_id,
    fields.status_code
  );
}

function applySuccessfulPayment(payment, booking, transactionRef, providerStatusCode) {
  const expectedPrior = payment.purpose === 'remaining_balance'
    ? booking.amountPaidMinor > 0
    : booking.amountPaidMinor === 0;
  if (!expectedPrior ||
      booking.amountPaidMinor + payment.expectedAmountMinor > booking.totalAmountMinor ||
      (payment.purpose === 'deposit' && payment.expectedAmountMinor !== booking.depositAmountMinor) ||
      (payment.purpose === 'full' && payment.expectedAmountMinor !== booking.totalAmountMinor) ||
      (payment.purpose === 'remaining_balance' &&
        payment.expectedAmountMinor !== booking.remainingBalanceMinor)) {
    throw new Error('Payment no longer matches the booking balance.');
  }

  const amountPaidMinor = booking.amountPaidMinor + payment.expectedAmountMinor;
  const remainingBalanceMinor = booking.totalAmountMinor - amountPaidMinor;
  return {
    paymentStatus: 'successful',
    providerStatusCode,
    providerTransactionRef: transactionRef,
    paidAt: new Date(),
    amountPaidMinor,
    remainingBalanceMinor,
    bookingPaymentStatus: remainingBalanceMinor === 0 ? 'paid' : 'partially_paid'
  };
}

function applyMockPaymentResult(payment, booking, result) {
  const nextStatus = result === 'success'
    ? 'successful'
    : result === 'failure'
      ? 'failed'
      : result === 'cancel'
        ? 'cancelled'
        : null;
  if (!nextStatus) {
    throw Object.assign(new Error('Choose a valid mock payment result.'), { status: 400 });
  }
  if (payment.provider !== 'mock') {
    throw Object.assign(new Error('This payment is not a mock checkout.'), { status: 400 });
  }
  if (payment.status !== 'pending') {
    if (payment.status === nextStatus) return { unchanged: true };
    throw Object.assign(new Error('This payment attempt has already finished.'), { status: 409 });
  }
  if (nextStatus !== 'successful') {
    return {
      paymentStatus: nextStatus,
      providerStatusCode: `MOCK_${result.toUpperCase()}`
    };
  }
  return applySuccessfulPayment(
    payment,
    booking,
    `MOCK-${payment.merchantOrderId}`,
    'MOCK_SUCCESS'
  );
}

module.exports = {
  parseRentalDays,
  createPriceSnapshot,
  minorToDecimal,
  decimalToMinor,
  payHereConfigurationError,
  getPaymentProvider,
  paymentProviderConfigurationError,
  md5Upper,
  createPayHereHash,
  validateCheckout,
  verifyPayHereNotification,
  paymentAttemptStatusFromPayHere,
  applyPayHereNotification,
  applyMockPaymentResult
};
