'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const money = minor => `LKR ${(minor / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const order = searchParams.get('order');
  const cancelled = searchParams.get('cancelled') === '1';
  const [payment, setPayment] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order) return;
    let active = true;
    let timer;
    let attempts = 0;
    const refresh = async () => {
      try {
        const token = localStorage.getItem('token');
        const paymentRes = await fetch(`/api/payments/${encodeURIComponent(order)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) throw new Error(paymentData.msg || 'Unable to verify payment status.');
        const summaryRes = await fetch(`/api/payments/bookings/${encodeURIComponent(paymentData.bookingId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const summaryData = summaryRes.ok ? await summaryRes.json() : null;
        if (!active) return;
        setPayment(paymentData);
        setSummary(summaryData);
        if (paymentData.status === 'successful') setError('');
        if ((paymentData.status === 'pending' || (paymentData.status === 'successful' && !summaryData)) &&
            attempts++ < 30) {
          timer = setTimeout(refresh, 3000);
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    };
    refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [order, searchParams]);

  const bookingSummary = summary?.booking;
  const successful = payment?.status === 'successful';

  return (
    <main style={{minHeight: '100vh', padding: '32px 16px', background: 'linear-gradient(135deg, #0a1628, #0d2137)', color: 'white'}}>
      <section style={{maxWidth: '680px', margin: '40px auto', padding: '28px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(100,181,246,0.2)', borderRadius: '18px'}}>
        <h1>{successful ? payment.provider === 'mock' ? 'Demo payment successful' : 'Payment confirmed' : payment?.status === 'pending' ? 'Payment processing' : payment ? `Payment ${payment.status}` : 'Checking payment status'}</h1>
        {cancelled && payment?.status === 'pending' && <p>The checkout was cancelled or closed. Confirmation depends on the provider notification; refresh while it is processing.</p>}
        {error && <p role="alert" style={{color: '#ef9a9a'}}>{error}</p>}
        {!order && <p role="alert">Payment reference is missing.</p>}
        {!payment && !error && order && <p>Waiting for verified status from PayHere…</p>}
        {payment && (
          <>
            <p>Order reference: {payment.merchantOrderId}</p>
            <p>Purpose: {payment.purpose.replaceAll('_', ' ')}</p>
            <p>Payment amount: {money(payment.amountMinor)}</p>
            {successful && (
              <>
                <p>{payment.provider === 'mock' ? 'Demo transaction reference' : 'Provider transaction'}: {payment.providerTransactionRef || 'Verified'}</p>
                <p>Paid at: {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'Confirmed'}</p>
                {bookingSummary && (
                  <>
                    <p>Listing: {bookingSummary.item?.title || 'Rental listing'}</p>
                    <p>Rental dates: {new Date(bookingSummary.startDate).toLocaleDateString()} – {new Date(bookingSummary.endDate).toLocaleDateString()}</p>
                    <p>Chargeable days: {bookingSummary.chargeableDays}</p>
                    <p>Daily rental price: {money(bookingSummary.dailyPriceMinor)}</p>
                    <p>Total rental amount: {money(bookingSummary.totalAmountMinor)}</p>
                    <p>Amount paid to date: {money(bookingSummary.amountPaidMinor)}</p>
                  </>
                )}
                <p>Remaining booking balance: {bookingSummary?.remainingBalanceMinor != null ? money(bookingSummary.remainingBalanceMinor) : 'Refreshing…'}</p>
                {payment.provider === 'mock'
                  ? <p>This is a simulated demo transaction. No real money was charged; this is not a payment receipt.</p>
                  : <p>This receipt confirms the payment received. It is not a tax invoice.</p>}
                <button onClick={() => window.print()} style={{padding: '10px 18px', borderRadius: '8px', cursor: 'pointer'}}>{payment.provider === 'mock' ? 'Print demo summary' : 'Print receipt'}</button>
              </>
            )}
            {payment.status === 'pending' && <p>We have not received verified confirmation yet. This page refreshes automatically; a redirect is not proof of payment.</p>}
            {['failed', 'cancelled', 'expired'].includes(payment.status) && <p>You can retry this payment from My Bookings. No successful payment was recorded for this attempt.</p>}
          </>
        )}
        <p style={{marginTop: '24px'}}><Link href="/bookings" style={{color: '#64b5f6'}}>Return to My Bookings</Link></p>
      </section>
      <style jsx global>{`@media print { body { background: white !important; } main { background: white !important; color: black !important; } main * { color: black !important; } }`}</style>
    </main>
  );
}

export default function PaymentResult() {
  return (
    <Suspense fallback={<main style={{minHeight: '100vh', padding: '32px', background: '#0a1628', color: 'white'}}>Loading payment status…</main>}>
      <PaymentResultContent />
    </Suspense>
  );
}
