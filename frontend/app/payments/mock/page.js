'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const money = minor => `LKR ${(minor / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function MockPaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const loadPayment = async () => {
      if (!orderId) {
        setError('Payment reference is missing.');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Sign in to continue with this payment.');
        const response = await fetch(`/api/payments/${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Unable to load payment details.');
        if (data.provider !== 'mock') throw new Error('This payment is not a mock checkout.');
        if (active) setPayment(data);
      } catch (loadError) {
        if (active) setError(loadError.message);
      }
    };
    void loadPayment();
    return () => { active = false; };
  }, [orderId]);

  const finishPayment = async result => {
    if (submitting || !orderId) return;
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, result })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Unable to complete this demo payment.');
      window.location.assign(`/payments/result?order=${encodeURIComponent(orderId)}${result === 'cancel' ? '&cancelled=1' : ''}`);
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  };

  return (
    <main style={{minHeight: '100vh', padding: '32px 16px', background: 'linear-gradient(135deg, #0a1628, #0d2137)', color: 'white'}}>
      <section style={{maxWidth: '560px', margin: '40px auto', padding: '28px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(100,181,246,0.2)', borderRadius: '18px'}}>
        <p style={{color: '#ffd180', fontWeight: 700, letterSpacing: '0.08em'}}>PRESENTATION DEMO · NO REAL MONEY</p>
        <h1 style={{marginTop: 0}}>Mock payment checkout</h1>
        <p>This custom simulator demonstrates the payment workflow. It does not contact a bank or charge a card.</p>
        {payment && (
          <div style={{margin: '24px 0', padding: '18px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
            <p>Order reference: {payment.merchantOrderId}</p>
            <p>Payment purpose: {payment.purpose.replaceAll('_', ' ')}</p>
            <strong>Amount: {money(payment.amountMinor)}</strong>
            <p>Current status: {payment.status}</p>
          </div>
        )}
        {error && <p role="alert" style={{color: '#ef9a9a'}}>{error}</p>}
        {payment?.status === 'pending' && (
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '22px'}}>
            <button disabled={submitting} onClick={() => finishPayment('success')} style={{padding: '11px 16px', border: 0, borderRadius: '9px', background: '#2e7d32', color: 'white', cursor: 'pointer'}}>
              Simulate successful payment
            </button>
            <button disabled={submitting} onClick={() => finishPayment('failure')} style={{padding: '11px 16px', border: 0, borderRadius: '9px', background: '#b71c1c', color: 'white', cursor: 'pointer'}}>
              Simulate failure
            </button>
            <button disabled={submitting} onClick={() => finishPayment('cancel')} style={{padding: '11px 16px', border: '1px solid rgba(255,255,255,0.24)', borderRadius: '9px', background: 'transparent', color: 'white', cursor: 'pointer'}}>
              Cancel
            </button>
          </div>
        )}
        {payment && payment.status !== 'pending' && (
          <p>This attempt has finished. <Link href={`/payments/result?order=${encodeURIComponent(orderId)}`} style={{color: '#64b5f6'}}>View its result</Link> or return to your bookings.</p>
        )}
        <p style={{marginTop: '24px'}}><Link href="/bookings" style={{color: '#64b5f6'}}>Return to My Bookings</Link></p>
      </section>
    </main>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={<main style={{minHeight: '100vh', padding: '32px', background: '#0a1628', color: 'white'}}>Loading mock checkout…</main>}>
      <MockPaymentContent />
    </Suspense>
  );
}
