'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }
      const res = await fetch('http://localhost:5000/api/bookings/my', {
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
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status : 'rejected' })
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
      await fetch(`http://localhost:5000/api/bookings/${id}`, {
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
    if (status === 'confirmed') return { bg: 'rgba(76,175,80,0.2)', color: '#81c784' };
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
            { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#2e7d32' },
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
                        {booking.status === 'pending' ? '⏳ Pending' :
                         booking.status === 'confirmed' ? '✅ Confirmed' :
                         booking.status === 'rejected' ? '❌ Cancelled' : '🏁 Completed'}
                      </span>

                      {/* VIEW ITEM */}
                      <Link href={`/items/${booking.item?._id}`} style={{
                        color: '#64b5f6', fontSize: '13px', textDecoration: 'none',
                        background: 'rgba(100,181,246,0.1)',
                        border: '1px solid rgba(100,181,246,0.2)',
                        padding: '5px 14px', borderRadius: '8px'
                      }}>View Item →</Link>

                      {/* CANCEL BUTTON - only for pending */}
                      {booking.status === 'pending' && (
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
                      {booking.status !== 'pending' && (
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
    </main>
  );
}