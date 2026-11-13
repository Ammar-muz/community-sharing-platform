'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const money = minor => `LKR ${(minor / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [paymentPurpose, setPaymentPurpose] = useState('full');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }
      const res = await fetch(`/api/bookings/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchBookings, 0);
    return () => clearTimeout(timer);
  }, []);

  const openPayment = async booking => {
    setPaymentBooking(booking);
    setPaymentSummary(null);
    setPaymentPurpose(booking.paymentStatus === 'partially_paid' ? 'remaining_balance' : 'full');
    setPaymentError('');
    setCheckoutPhone('');
    setCheckoutCity('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/payments/bookings/${booking._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Could not load payment details.');
      setPaymentSummary(data);
    } catch (err) {
      setPaymentError(err.message);
    }
  };

  const startCheckout = async () => {
    if (!paymentSummary || paymentLoading) return;
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingId: paymentSummary.booking.id,
          purpose: paymentPurpose,
          phone: checkoutPhone,
          city: checkoutCity
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Checkout could not be started.');
      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }
      if (!data.checkoutUrl || !data.fields || typeof data.fields !== 'object') {
        throw new Error('Checkout returned an invalid provider response.');
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.checkoutUrl;
      Object.entries(data.fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setPaymentError(err.message);
      setPaymentLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      fetchBookings();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchBookings();
    } catch (err) {
      console.log(err);
    }
  };

  const getImgSrc = (src) => {
    if (!src) return '';
    return src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`;
  };

  const getStatusColor = (status) => {
    if (['accepted', 'confirmed'].includes(status)) return { bg: 'rgba(76,175,80,0.2)', color: '#81c784' };
    if (status === 'rejected') return { bg: 'rgba(244,67,54,0.2)', color: '#ef9a9a' };
    if (status === 'completed') return { bg: 'rgba(100,181,246,0.2)', color: '#64b5f6' };
    return { bg: 'rgba(255,193,7,0.2)', color: '#fff176' };
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
    }}>

      {/* NAVBAR */}
      <nav style={{
        background: 'rgba(10,22,40,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(100,181,246,0.15)',
        padding: '16px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <Link href="/" style={{display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none'}}>
          <span style={{fontSize: '28px'}}>🤝</span>
          <h1 style={{color: '#64b5f6', fontSize: '20px', fontWeight: 'bold', margin: 0}}>CommunityShare</h1>
        </Link>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          <Link href="/items" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>Browse Items</Link>
          <Link href="/dashboard" style={{
            background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
            color: 'white', padding: '8px 24px', borderRadius: '12px',
            textDecoration: 'none', fontSize: '14px', fontWeight: '600'
          }}>Dashboard</Link>
        </div>
      </nav>

      <section style={{padding: '40px', maxWidth: '900px', margin: '0 auto'}}>

        {/* HEADER */}
        <div style={{marginBottom: '32px'}}>
          <h2 style={{color: 'white', fontSize: '32px', fontWeight: 'bold', marginBottom: '8px'}}>
            My Bookings 📅
          </h2>
          <p style={{color: '#546e7a'}}>Track all your booking requests here</p>
        </div>

        {/* STATS ROW */} 
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px', marginBottom: '32px'
        }}>
          {[
            { label: 'Total', value: bookings.length, color: '#1565c0' },
            { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#ff8f00' },
            { label: 'Accepted', value: bookings.filter(b => ['accepted', 'confirmed'].includes(b.status)).length, color: '#2e7d32' },
            { label: 'Rejected', value: bookings.filter(b => b.status === 'rejected').length, color: '#c62828' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${stat.color}44`,
              borderRadius: '14px', padding: '16px', textAlign: 'center'
            }}>
              <div style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>{stat.value}</div>
              <div style={{color: '#546e7a', fontSize: '12px', marginTop: '4px'}}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* BOOKINGS LIST */}
        {loading ? (
          <div style={{textAlign: 'center', color: '#546e7a', padding: '60px'}}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>⏳</div>
            <p>Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{
            textAlign: 'center', color: '#546e7a', padding: '60px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>📭</div>
            <h3 style={{color: 'white', marginBottom: '8px'}}>No bookings yet</h3>
            <p style={{marginBottom: '24px'}}>Browse items and make your first booking!</p>
            <Link href="/items" style={{
              background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
              color: 'white', padding: '12px 28px', borderRadius: '12px',
              textDecoration: 'none', fontWeight: '600'
            }}>Browse Items →</Link>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {bookings.map((booking, i) => {
              const statusStyle = getStatusColor(booking.status);
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(100,181,246,0.15)',
                  borderRadius: '16px', overflow: 'hidden',
                  display: 'flex'
                }}>
                  {/* ITEM IMAGE */}
                  <div style={{
                    width: '140px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #1565c020, #0d47a130)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {booking.item?.images && booking.item.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImgSrc(booking.item.images[0])}
                        alt={booking.item?.title}
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                      />
                    ) : (
                      <span style={{fontSize: '40px'}}>
                        {booking.item?.category === 'vehicle' ? '🚗' :
                         booking.item?.category === 'tool' ? '🔧' : '⚙️'}
                      </span>
                    )}
                  </div>

                  {/* BOOKING DETAILS */}
                  <div style={{
                    flex: 1, padding: '20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{color: 'white', fontWeight: '600', fontSize: '17px', marginBottom: '6px'}}>
                        {booking.item?.title}
                      </h4>
                      <p style={{color: '#546e7a', fontSize: '13px', marginBottom: '4px'}}>
                        👤 Owner: {booking.owner?.name}
                      </p>
                      <p style={{color: '#546e7a', fontSize: '13px', marginBottom: '4px'}}>
                        📅 {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                      <p style={{color: '#64b5f6', fontWeight: 'bold', fontSize: '15px'}}>
                        Rs. {booking.totalPrice}
                      </p>
                    </div>

                    {/* STATUS AND ACTIONS */}
                    <div style={{textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                      
                      {/* STATUS BADGE */}
                      <span style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        padding: '6px 16px', borderRadius: '999px',
                        fontSize: '13px', fontWeight: '500'
                      }}>
                        {booking.status === 'pending' ? '⏳ Awaiting owner approval' :
                         ['accepted', 'confirmed'].includes(booking.status) ? '✅ Accepted' :
                         ['rejected', 'cancelled'].includes(booking.status) ? '❌ Cancelled' : '🏁 Completed'}
                      </span>

                      {/* VIEW ITEM */}
                      <Link href={`/items/${booking.item?._id}`} style={{
                        color: '#64b5f6', fontSize: '13px', textDecoration: 'none',
                        background: 'rgba(100,181,246,0.1)',
                        border: '1px solid rgba(100,181,246,0.2)',
                        padding: '5px 14px', borderRadius: '8px'
                      }}>View Item →</Link>

                      {['accepted', 'confirmed'].includes(booking.status) && booking.paymentStatus !== 'paid' &&
                        (booking.totalAmountMinor != null || booking.paymentStatus === 'partially_paid') && (
                        <button onClick={() => openPayment(booking)} style={{
                          padding: '8px 16px', border: 'none', borderRadius: '9px',
                          color: 'white', background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                          cursor: 'pointer', fontWeight: 600
                        }}>{booking.paymentStatus === 'partially_paid' ? 'Pay Remaining Balance' : 'Pay Now'}</button>
                      )}
                      {booking.paymentStatus === 'paid' && (
                        <span style={{color: '#81c784', fontWeight: 600}}>Paid in Full</span>
                      )}
                      {booking.paymentStatus === 'partially_paid' && (
                        <span style={{color: '#90a4ae', fontSize: '12px'}}>
                          Paid {money(booking.amountPaidMinor || 0)} · Balance {money(booking.remainingBalanceMinor ?? 0)}
                        </span>
                      )}

                      {['pending', 'accepted', 'confirmed'].includes(booking.status) && booking.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          style={{
                            padding: '5px 14px',
                            background: 'rgba(255,193,7,0.15)',
                            border: '1px solid rgba(255,193,7,0.3)',
                            borderRadius: '8px', color: '#fff176',
                            fontSize: '13px', cursor: 'pointer'
                          }}>🚫 Cancel</button>
                      )}

                      {/* DELETE BUTTON - for all statuses except pending */}
                      {booking.status !== 'pending' &&
                        booking.paymentStatus !== 'paid' &&
                        booking.paymentStatus !== 'partially_paid' && (
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          style={{
                            padding: '5px 14px',
                            background: 'rgba(244,67,54,0.15)',
                            border: '1px solid rgba(244,67,54,0.3)',
                            borderRadius: '8px', color: '#ef9a9a',
                            fontSize: '13px', cursor: 'pointer'
                          }}>🗑️ Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {paymentBooking && (
        <div role="presentation" onClick={event => {
          if (event.target === event.currentTarget && !paymentLoading) setPaymentBooking(null);
        }} style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,8,18,0.78)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '16px'
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="payment-title" style={{
            width: 'min(100%, 600px)', maxHeight: '92vh', overflowY: 'auto', padding: 'clamp(20px, 5vw, 32px)',
            background: 'linear-gradient(155deg, #10243b, #0b1728)', border: '1px solid rgba(148,185,225,0.22)',
            borderRadius: '24px', color: '#f4f8ff', boxShadow: '0 28px 90px rgba(0,0,0,0.48)'
          }}>
            <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '22px'}}>
              <div>
                <div style={{fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#77b9ff', marginBottom: '8px'}}>
                  Secure checkout
                </div>
                <h2 id="payment-title" style={{fontSize: '25px', lineHeight: 1.2, margin: 0}}>Rental payment</h2>
              </div>
              <span style={{
                whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 700, color: '#a8d7ff',
                background: 'rgba(66,165,245,0.12)', border: '1px solid rgba(100,181,246,0.25)',
                borderRadius: '999px', padding: '7px 10px'
              }}>{paymentSummary?.checkoutProvider === 'mock' ? 'MOCK DEMO · NO REAL CHARGE' : paymentSummary ? 'PAYHERE SANDBOX' : 'LOADING CHECKOUT'}</span>
            </header>
            {paymentSummary ? (
              <>
                <div style={{
                  padding: '17px 18px', marginBottom: '18px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <h3 style={{fontSize: '17px', margin: '0 0 7px'}}>{paymentSummary.booking.item?.title || paymentBooking.item?.title}</h3>
                  <p style={{fontSize: '13px', lineHeight: 1.6, color: '#a9b9cd', margin: 0}}>
                    {new Date(paymentSummary.booking.startDate).toLocaleDateString()} – {new Date(paymentSummary.booking.endDate).toLocaleDateString()}
                    <span style={{display: 'block', fontSize: '12px', color: '#8295ac'}}>End date is not charged</span>
                  </p>
                </div>
                {paymentSummary.booking.totalAmountMinor != null ? (
                  <>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      padding: '13px 16px', marginBottom: '16px', borderRadius: '14px',
                      background: 'rgba(100,181,246,0.08)', border: '1px solid rgba(100,181,246,0.18)'
                    }}>
                      <div>
                        <div style={{fontSize: '12px', color: '#a9b9cd'}}>Rental total · {paymentSummary.booking.chargeableDays} chargeable days</div>
                        <div style={{fontSize: '12px', color: '#8295ac', marginTop: '3px'}}>Daily rate {money(paymentSummary.booking.dailyPriceMinor)}</div>
                      </div>
                      <strong style={{fontSize: '17px', whiteSpace: 'nowrap'}}>{money(paymentSummary.booking.totalAmountMinor)}</strong>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px'}}>
                      {paymentSummary.booking.amountPaidMinor === 0 && (
                        <label style={{
                          display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '13px',
                          borderRadius: '14px', cursor: 'pointer',
                          background: paymentPurpose === 'full' ? 'rgba(100,181,246,0.13)' : 'rgba(255,255,255,0.035)',
                          border: `1px solid ${paymentPurpose === 'full' ? 'rgba(100,181,246,0.48)' : 'rgba(255,255,255,0.09)'}`
                        }}>
                          <input type="radio" name="payment-purpose" checked={paymentPurpose === 'full'}
                            onChange={() => setPaymentPurpose('full')} style={{accentColor: '#64b5f6', marginTop: '3px'}} />
                          <span><strong style={{display: 'block', fontSize: '13px'}}>Pay in full</strong><span style={{fontSize: '12px', color: '#a9b9cd'}}>{money(paymentSummary.booking.totalAmountMinor)}</span></span>
                        </label>
                      )}
                      {paymentSummary.booking.amountPaidMinor === 0 && (
                        <label style={{
                          display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '13px',
                          borderRadius: '14px', cursor: 'pointer',
                          background: paymentPurpose === 'deposit' ? 'rgba(100,181,246,0.13)' : 'rgba(255,255,255,0.035)',
                          border: `1px solid ${paymentPurpose === 'deposit' ? 'rgba(100,181,246,0.48)' : 'rgba(255,255,255,0.09)'}`
                        }}>
                          <input type="radio" name="payment-purpose" checked={paymentPurpose === 'deposit'}
                            onChange={() => setPaymentPurpose('deposit')} style={{accentColor: '#64b5f6', marginTop: '3px'}} />
                          <span><strong style={{display: 'block', fontSize: '13px'}}>Reservation deposit · {paymentSummary.booking.depositPercent}%</strong><span style={{fontSize: '12px', color: '#a9b9cd'}}>{money(paymentSummary.booking.depositAmountMinor)}</span></span>
                        </label>
                      )}
                      {paymentSummary.booking.amountPaidMinor > 0 && (
                        <label style={{
                          display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '13px',
                          borderRadius: '14px', cursor: 'pointer', background: 'rgba(100,181,246,0.13)',
                          border: '1px solid rgba(100,181,246,0.48)'
                        }}>
                          <input type="radio" name="payment-purpose" checked={paymentPurpose === 'remaining_balance'}
                            onChange={() => setPaymentPurpose('remaining_balance')} style={{accentColor: '#64b5f6', marginTop: '3px'}} />
                          <span><strong style={{display: 'block', fontSize: '13px'}}>Pay remaining balance</strong><span style={{fontSize: '12px', color: '#a9b9cd'}}>{money(paymentSummary.booking.remainingBalanceMinor)}</span></span>
                        </label>
                      )}
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      marginTop: '14px', padding: '16px', borderRadius: '14px',
                      background: 'linear-gradient(120deg, rgba(21,101,192,0.35), rgba(13,71,161,0.18))',
                      border: '1px solid rgba(100,181,246,0.22)'
                    }}>
                      <span style={{fontSize: '14px', fontWeight: 600}}>Due today</span>
                      <strong style={{fontSize: '20px', color: '#9ed3ff'}}>{money(
                        paymentPurpose === 'full' ? paymentSummary.booking.totalAmountMinor :
                        paymentPurpose === 'deposit' ? paymentSummary.booking.depositAmountMinor :
                        paymentSummary.booking.remainingBalanceMinor
                      )}</strong>
                    </div>
                    <p style={{display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '9px 3px 0', fontSize: '12px', color: '#a9b9cd'}}>
                      <span>Balance after this payment</span>
                      <span>{money(
                        paymentSummary.booking.remainingBalanceMinor -
                        (paymentPurpose === 'full' ? paymentSummary.booking.totalAmountMinor :
                         paymentPurpose === 'deposit' ? paymentSummary.booking.depositAmountMinor :
                         paymentSummary.booking.remainingBalanceMinor)
                      )}</span>
                    </p>
                    {paymentPurpose === 'deposit' && (
                      <p style={{fontSize: '12px', lineHeight: 1.5, color: '#a9b9cd', margin: '12px 2px 0'}}>
                        This is an advance rental payment, not a refundable damage or security deposit.
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{padding: '14px', borderRadius: '12px', color: '#ffd180', background: 'rgba(255,183,77,0.1)'}}>
                    This older booking has no saved price snapshot and cannot be paid online.
                  </p>
                )}
                {paymentSummary.checkoutProvider !== 'mock' && <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '20px'}}>
                <label style={{display: 'block', fontSize: '12px', color: '#c4d2e3'}}>
                  Phone number
                  <input value={checkoutPhone} onChange={event => setCheckoutPhone(event.target.value)}
                    type="tel" autoComplete="tel" placeholder="+94 77 123 4567"
                    style={{display: 'block', width: '100%', marginTop: '7px', padding: '12px', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid rgba(172,196,224,0.2)', background: 'rgba(4,12,23,0.48)', color: 'white', outlineColor: '#64b5f6'}} />
                </label>
                <label style={{display: 'block', fontSize: '12px', color: '#c4d2e3'}}>
                  City
                  <input value={checkoutCity} onChange={event => setCheckoutCity(event.target.value)}
                    autoComplete="address-level2" placeholder="Colombo"
                    style={{display: 'block', width: '100%', marginTop: '7px', padding: '12px', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid rgba(172,196,224,0.2)', background: 'rgba(4,12,23,0.48)', color: 'white', outlineColor: '#64b5f6'}} />
                </label>
                </div>}
                {paymentSummary.checkoutConfigurationError && (
                  <div role="status" style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '16px', padding: '13px 14px',
                    borderRadius: '12px', color: '#ffd18a', background: 'rgba(255,167,38,0.09)',
                    border: '1px solid rgba(255,183,77,0.25)', fontSize: '13px', lineHeight: 1.5
                  }}>
                    <span aria-hidden="true">ⓘ</span>
                    <span>Checkout is currently unavailable. {paymentSummary.checkoutConfigurationError} Please contact the site administrator to finish setup.</span>
                  </div>
                )}
              </>
            ) : <p style={{color: '#a9b9cd'}}>Loading saved booking and payment details…</p>}
            {paymentError && paymentError !== paymentSummary?.checkoutConfigurationError && (
              <p role="alert" style={{color: '#ff9d9d', fontSize: '13px'}}>{paymentError}</p>
            )}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px', paddingTop: '17px', borderTop: '1px solid rgba(255,255,255,0.08)'}}>
              <button disabled={paymentLoading} onClick={() => setPaymentBooking(null)} style={{
                padding: '11px 16px', borderRadius: '11px', border: '1px solid rgba(172,196,224,0.2)',
                background: 'transparent', color: '#c4d2e3', fontWeight: 600, cursor: 'pointer'
              }}>Close</button>
              <button disabled={paymentLoading || !paymentSummary || paymentSummary.booking.totalAmountMinor == null || Boolean(paymentSummary.checkoutConfigurationError)}
                onClick={startCheckout} style={{
                  padding: '11px 18px', borderRadius: '11px', border: 'none',
                  background: paymentLoading || paymentSummary?.checkoutConfigurationError ? '#405267' : 'linear-gradient(135deg, #1976d2, #0d47a1)',
                  color: 'white', fontWeight: 700, cursor: paymentLoading || paymentSummary?.checkoutConfigurationError ? 'not-allowed' : 'pointer',
                  boxShadow: paymentSummary?.checkoutConfigurationError ? 'none' : '0 8px 24px rgba(21,101,192,0.3)'
                }}>
                {paymentLoading ? 'Starting checkout…' : paymentSummary?.checkoutConfigurationError ? 'Checkout unavailable' : paymentSummary?.checkoutProvider === 'mock' ? 'Continue to demo payment' : 'Continue to secure payment'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
